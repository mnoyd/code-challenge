export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  svgData: string; // base64 encoded SVG
}

export interface ChessCustomization {
  id: string;
  name: string;
  description?: string;
  boardSvg?: string; // base64 encoded SVG
  pieces: ChessPiece[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChessCustomizationRequest {
  name: string;
  description?: string;
  boardSvg?: string;
  pieces: ChessPiece[];
}

export interface UpdateChessCustomizationRequest {
  name?: string;
  description?: string;
  boardSvg?: string;
  pieces?: ChessPiece[];
}