import { Router } from 'express';
import {
  createCustomization,
  getAllCustomizations,
  getCustomizationById,
  updateCustomization,
  deleteCustomization
} from '../controllers/customizationController';

const router = Router();

// GET /api/customizations - Get all customizations
router.get('/', getAllCustomizations);

// GET /api/customizations/:id - Get customization by ID
router.get('/:id', getCustomizationById);

// POST /api/customizations - Create new customization
router.post('/', createCustomization);

// PUT /api/customizations/:id - Update customization by ID
router.put('/:id', updateCustomization);

// DELETE /api/customizations/:id - Delete customization by ID
router.delete('/:id', deleteCustomization);

export default router;