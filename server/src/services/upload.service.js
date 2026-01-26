import crypto from 'crypto';
import path from 'path';
import { getSupabaseAdmin } from '../utils/supabase.js';

function getBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
}

function guessExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  if (file.mimetype === 'application/pdf') return '.pdf';
  return '.jpg';
}

export const uploadService = {
  /**
   * Upload multiple images to Supabase Storage and return public URLs.
   * Requires bucket to be PUBLIC (recommended for product images).
   */
  async uploadProductImages({ userId, files }) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const err = new Error('Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
      err.statusCode = 500;
      throw err;
    }

    const bucket = getBucketName();
    const now = Date.now();

    const uploads = await Promise.all(
      files.map(async (file) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          const err = new Error('Seules les images sont autorisées');
          err.statusCode = 400;
          throw err;
        }
        const ext = guessExtension(file);
        const filename = `${now}-${crypto.randomUUID()}${ext}`;
        const storagePath = `products/${userId}/${filename}`;

        const { error } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

        if (error) {
          const err = new Error(`Erreur upload Supabase: ${error.message}`);
          err.statusCode = 500;
          throw err;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        if (!data?.publicUrl) {
          const err = new Error('Impossible de récupérer l’URL publique de l’image');
          err.statusCode = 500;
          throw err;
        }

        return data.publicUrl;
      })
    );

    return uploads;
  },

  /**
   * Upload KYC documents (CNI / Passeport / Permis / selfie) to Supabase Storage.
   * Note: for security/privacy, a PRIVATE bucket + signed URLs is recommended.
   * This implementation stores in the same bucket as product images, under a `kyc/` prefix.
   */
  async uploadKycDocuments({ userId, filesByField }) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const err = new Error('Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
      err.statusCode = 500;
      throw err;
    }

    const bucket = getBucketName();
    const now = Date.now();

    const allowed = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]);

    const uploadOne = async (field, file) => {
      if (!file) return null;
      if (!file.mimetype || !allowed.has(file.mimetype)) {
        const err = new Error('Format de document non supporté (images ou PDF uniquement)');
        err.statusCode = 400;
        throw err;
      }

      const ext = guessExtension(file);
      const filename = `${field}-${now}-${crypto.randomUUID()}${ext}`;
      const storagePath = `kyc/${userId}/${filename}`;

      const { error } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        const err = new Error(`Erreur upload Supabase: ${error.message}`);
        err.statusCode = 500;
        throw err;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      if (!data?.publicUrl) {
        const err = new Error('Impossible de récupérer l’URL publique du document');
        err.statusCode = 500;
        throw err;
      }

      return data.publicUrl;
    };

    const documentFront = filesByField?.documentFront?.[0] || null;
    const documentBack = filesByField?.documentBack?.[0] || null;
    const selfie = filesByField?.selfie?.[0] || null;

    const [frontUrl, backUrl, selfieUrl] = await Promise.all([
      uploadOne('documentFront', documentFront),
      uploadOne('documentBack', documentBack),
      uploadOne('selfie', selfie),
    ]);

    return {
      documentFront: frontUrl,
      documentBack: backUrl,
      selfie: selfieUrl,
    };
  },
};

