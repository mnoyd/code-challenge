import { Request, Response, NextFunction } from 'express';
import { chessCustomizationStorage } from '../storage';
import { validateCreateCustomization, validateUpdateCustomization, ValidationError } from '../utils/validation';
import { ApiErrorResponse, ApiSuccessResponse } from '../models';
import { ChessCustomization, CreateChessCustomizationRequest, UpdateChessCustomizationRequest } from '../models';
import { logError, logSuccess } from '../middleware';

/**
 * Create a new chess customization
 * POST /api/customizations
 */
export const createCustomization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const validation = validateCreateCustomization(req.body);
    if (!validation.isValid) {
      // Throw ValidationError to be handled by error middleware
      throw new ValidationError(validation.errors);
    }

    // Create customization
    const createData: CreateChessCustomizationRequest = req.body;
    const customization = await chessCustomizationStorage.create(createData);
    
    logSuccess('createCustomization', `Created customization with ID: ${customization.id}`, {
      id: customization.id,
      name: customization.name
    });
    
    const successResponse: ApiSuccessResponse<ChessCustomization> = {
      success: true,
      data: customization,
      message: 'Customization created successfully'
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    logError('createCustomization', error as Error, { body: req.body });
    next(error);
  }
};

/**
 * Get all chess customizations
 * GET /api/customizations
 */
export const getAllCustomizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customizations = await chessCustomizationStorage.getAll();
    
    logSuccess('getAllCustomizations', `Retrieved ${customizations.length} customizations`);
    
    const successResponse: ApiSuccessResponse<ChessCustomization[]> = {
      success: true,
      data: customizations,
      message: `Retrieved ${customizations.length} customizations`
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logError('getAllCustomizations', error as Error);
    next(error);
  }
};

/**
 * Get a chess customization by ID
 * GET /api/customizations/:id
 */
export const getCustomizationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError(['Customization ID is required and must be a string']);
    }

    const customization = await chessCustomizationStorage.getById(id);
    
    if (!customization) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Not found',
        message: `Customization with ID ${id} not found`
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    logSuccess('getCustomizationById', `Retrieved customization: ${customization.name}`, { id });
    
    const successResponse: ApiSuccessResponse<ChessCustomization> = {
      success: true,
      data: customization,
      message: 'Customization retrieved successfully'
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logError('getCustomizationById', error as Error, { id: req.params.id });
    next(error);
  }
};

/**
 * Update a chess customization by ID
 * PUT /api/customizations/:id
 */
export const updateCustomization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError(['Customization ID is required and must be a string']);
    }

    // Check if customization exists
    if (!(await chessCustomizationStorage.exists(id))) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Not found',
        message: `Customization with ID ${id} not found`
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Validate request body
    const validation = validateUpdateCustomization(req.body);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Update customization
    const updateData: UpdateChessCustomizationRequest = req.body;
    const updatedCustomization = await chessCustomizationStorage.update(id, updateData);
    
    if (!updatedCustomization) {
      // This shouldn't happen since we checked existence above, but handle it just in case
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Update failed',
        message: 'Failed to update customization'
      };
      res.status(500).json(errorResponse);
      return;
    }
    
    logSuccess('updateCustomization', `Updated customization: ${updatedCustomization.name}`, { id });
    
    const successResponse: ApiSuccessResponse<ChessCustomization> = {
      success: true,
      data: updatedCustomization,
      message: 'Customization updated successfully'
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logError('updateCustomization', error as Error, { id: req.params.id, body: req.body });
    next(error);
  }
};

/**
 * Delete a chess customization by ID
 * DELETE /api/customizations/:id
 */
export const deleteCustomization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError(['Customization ID is required and must be a string']);
    }

    // Check if customization exists before attempting to delete
    if (!(await chessCustomizationStorage.exists(id))) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Not found',
        message: `Customization with ID ${id} not found`
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Delete customization
    const deleted = await chessCustomizationStorage.delete(id);
    
    if (!deleted) {
      // This shouldn't happen since we checked existence above, but handle it just in case
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Delete failed',
        message: 'Failed to delete customization'
      };
      res.status(500).json(errorResponse);
      return;
    }
    
    logSuccess('deleteCustomization', `Deleted customization with ID: ${id}`, { id });
    
    // Return 204 No Content for successful deletion (no response body)
    res.status(204).send();
  } catch (error) {
    logError('deleteCustomization', error as Error, { id: req.params.id });
    next(error);
  }
};