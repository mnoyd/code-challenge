-- Chess Customizations Database Schema
-- This file contains the table definitions for storing chess board customizations

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main customizations table
CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    board_svg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chess pieces table (normalized to handle the pieces array)
CREATE TABLE IF NOT EXISTS chess_pieces (
    id SERIAL PRIMARY KEY,
    customization_id UUID NOT NULL REFERENCES customizations(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('pawn', 'rook', 'knight', 'bishop', 'queen', 'king')),
    color VARCHAR(5) NOT NULL CHECK (color IN ('white', 'black')),
    svg_data TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chess_pieces_customization_id ON chess_pieces(customization_id);
CREATE INDEX IF NOT EXISTS idx_customizations_name ON customizations(name);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_customizations_updated_at ON customizations;
CREATE TRIGGER update_customizations_updated_at 
    BEFORE UPDATE ON customizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();