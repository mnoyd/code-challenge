import { CreateChessCustomizationRequest, UpdateChessCustomizationRequest, PieceType, PieceColor } from '../models/ChessCustomization';

/**
 * Validates if a string is valid base64 format
 */
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Remove data URL prefix if present (e.g., "data:image/svg+xml;base64,")
  const base64Data = str.replace(/^data:[^;]+;base64,/, '');
  
  // Check if string contains only valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    return false;
  }

  // Check if length is valid (must be multiple of 4)
  if (base64Data.length % 4 !== 0) {
    return false;
  }

  try {
    // Try to decode to verify it's valid base64
    Buffer.from(base64Data, 'base64');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates SVG size limit (100KB max)
 */
export function isValidSvgSize(base64Svg: string): boolean {
  if (!base64Svg || typeof base64Svg !== 'string') {
    return false;
  }

  // Remove data URL prefix if present
  const base64Data = base64Svg.replace(/^data:[^;]+;base64,/, '');
  
  // Calculate size in bytes (base64 encoding increases size by ~33%)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxSizeInBytes = 100 * 1024; // 100KB

  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Validates required fields for creating a chess customization
 */
export function validateCreateCustomization(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body is required'] };
  }

  // Validate required name field
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  // Validate pieces array
  if (!Array.isArray(data.pieces)) {
    errors.push('Pieces must be an array');
  } else if (data.pieces.length === 0) {
    errors.push('At least one chess piece is required');
  } else {
    // Validate each piece
    data.pieces.forEach((piece: any, index: number) => {
      const pieceErrors = validateChessPiece(piece, index);
      errors.push(...pieceErrors);
    });
  }

  // Validate optional description
  if (data.description !== undefined && (typeof data.description !== 'string')) {
    errors.push('Description must be a string if provided');
  }

  // Validate optional boardSvg
  if (data.boardSvg !== undefined) {
    if (typeof data.boardSvg !== 'string') {
      errors.push('Board SVG must be a string if provided');
    } else {
      if (!isValidBase64(data.boardSvg)) {
        errors.push('Board SVG must be valid base64 format');
      }
      if (!isValidSvgSize(data.boardSvg)) {
        errors.push('Board SVG exceeds maximum size limit of 100KB');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates required fields for updating a chess customization
 */
export function validateUpdateCustomization(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body is required'] };
  }

  // At least one field must be provided for update
  const hasValidField = data.name !== undefined || 
                       data.description !== undefined || 
                       data.boardSvg !== undefined || 
                       data.pieces !== undefined;

  if (!hasValidField) {
    errors.push('At least one field (name, description, boardSvg, or pieces) must be provided for update');
  }

  // Validate name if provided
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name must be a non-empty string if provided');
    }
  }

  // Validate description if provided
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string if provided');
  }

  // Validate boardSvg if provided
  if (data.boardSvg !== undefined) {
    if (typeof data.boardSvg !== 'string') {
      errors.push('Board SVG must be a string if provided');
    } else {
      if (!isValidBase64(data.boardSvg)) {
        errors.push('Board SVG must be valid base64 format');
      }
      if (!isValidSvgSize(data.boardSvg)) {
        errors.push('Board SVG exceeds maximum size limit of 100KB');
      }
    }
  }

  // Validate pieces if provided
  if (data.pieces !== undefined) {
    if (!Array.isArray(data.pieces)) {
      errors.push('Pieces must be an array if provided');
    } else if (data.pieces.length === 0) {
      errors.push('At least one chess piece is required if pieces array is provided');
    } else {
      // Validate each piece
      data.pieces.forEach((piece: any, index: number) => {
        const pieceErrors = validateChessPiece(piece, index);
        errors.push(...pieceErrors);
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a single chess piece
 */
function validateChessPiece(piece: any, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Piece at index ${index}:`;

  if (!piece || typeof piece !== 'object') {
    errors.push(`${prefix} must be an object`);
    return errors;
  }

  // Validate piece type
  const validTypes: PieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
  if (!piece.type || !validTypes.includes(piece.type)) {
    errors.push(`${prefix} type must be one of: ${validTypes.join(', ')}`);
  }

  // Validate piece color
  const validColors: PieceColor[] = ['white', 'black'];
  if (!piece.color || !validColors.includes(piece.color)) {
    errors.push(`${prefix} color must be one of: ${validColors.join(', ')}`);
  }

  // Validate SVG data
  if (!piece.svgData || typeof piece.svgData !== 'string') {
    errors.push(`${prefix} svgData is required and must be a string`);
  } else {
    if (!isValidBase64(piece.svgData)) {
      errors.push(`${prefix} svgData must be valid base64 format`);
    }
    if (!isValidSvgSize(piece.svgData)) {
      errors.push(`${prefix} svgData exceeds maximum size limit of 100KB`);
    }
  }

  return errors;
}

// Export ValidationError from errors module for consistency
export { ValidationError } from './errors';