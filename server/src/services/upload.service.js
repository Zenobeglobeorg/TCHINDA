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
};

