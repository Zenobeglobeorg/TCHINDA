import { uploadService } from '../services/upload.service.js';

export const sellerUploadController = {
  async uploadProductImages(req, res, next) {
    try {
      const userId = req.user?.id;
      const files = req.files || [];

      if (!files.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'Aucune image fournie' },
        });
      }

      const urls = await uploadService.uploadProductImages({ userId, files });
      res.status(201).json({
        success: true,
        data: { urls },
      });
    } catch (e) {
      next(e);
    }
  },
};

