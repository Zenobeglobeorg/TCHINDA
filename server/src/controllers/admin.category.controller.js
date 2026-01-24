import { adminCategoryService } from '../services/admin.category.service.js';

export const listAdminCategories = async (req, res, next) => {
  try {
    const categories = await adminCategoryService.listCategories();
    res.json({ success: true, data: categories });
  } catch (e) {
    next(e);
  }
};

export const createAdminCategory = async (req, res, next) => {
  try {
    const category = await adminCategoryService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
};

export const updateAdminCategory = async (req, res, next) => {
  try {
    const category = await adminCategoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
};

export const deleteAdminCategory = async (req, res, next) => {
  try {
    const result = await adminCategoryService.deleteCategory(req.params.id);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const toggleAdminCategoryActive = async (req, res, next) => {
  try {
    const category = await adminCategoryService.toggleCategoryActive(req.params.id, req.body?.isActive);
    res.json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
};

