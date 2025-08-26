import { Pool } from 'pg';
import { ChessCustomization, CreateChessCustomizationRequest, UpdateChessCustomizationRequest, ChessPiece } from '../models';

export class PostgreSQLChessCustomizationStorage {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new chess customization
   */
  async create(data: CreateChessCustomizationRequest): Promise<ChessCustomization> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert into customizations table
      const customizationResult = await client.query(
        `INSERT INTO customizations (name, description, board_svg) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, board_svg, created_at, updated_at`,
        [data.name, data.description || null, data.boardSvg || null]
      );

      const customizationRow = customizationResult.rows[0];
      const customizationId = customizationRow.id;

      // Insert chess pieces
      const pieces: ChessPiece[] = [];
      for (const piece of data.pieces) {
        await client.query(
          `INSERT INTO chess_pieces (customization_id, type, color, svg_data) 
           VALUES ($1, $2, $3, $4)`,
          [customizationId, piece.type, piece.color, piece.svgData]
        );
        pieces.push(piece);
      }

      await client.query('COMMIT');

      // Return the created customization
      const customization: ChessCustomization = {
        id: customizationRow.id,
        name: customizationRow.name,
        description: customizationRow.description,
        boardSvg: customizationRow.board_svg,
        pieces: pieces,
        createdAt: new Date(customizationRow.created_at),
        updatedAt: new Date(customizationRow.updated_at)
      };

      return customization;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating chess customization:', error);
      throw new Error(`Failed to create chess customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get all chess customizations
   */
  async getAll(): Promise<ChessCustomization[]> {
    try {
      const result = await this.pool.query(`
        SELECT 
          c.id, c.name, c.description, c.board_svg, c.created_at, c.updated_at,
          cp.type, cp.color, cp.svg_data
        FROM customizations c
        LEFT JOIN chess_pieces cp ON c.id = cp.customization_id
        ORDER BY c.created_at DESC, cp.id
      `);

      return this.transformRowsToCustomizations(result.rows);
    } catch (error) {
      console.error('Error getting all chess customizations:', error);
      throw new Error(`Failed to get chess customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a chess customization by ID
   */
  async getById(id: string): Promise<ChessCustomization | undefined> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return undefined;
      }

      const result = await this.pool.query(`
        SELECT 
          c.id, c.name, c.description, c.board_svg, c.created_at, c.updated_at,
          cp.type, cp.color, cp.svg_data
        FROM customizations c
        LEFT JOIN chess_pieces cp ON c.id = cp.customization_id
        WHERE c.id = $1
        ORDER BY cp.id
      `, [id]);

      if (result.rows.length === 0) {
        return undefined;
      }

      const customizations = this.transformRowsToCustomizations(result.rows);
      return customizations[0];
    } catch (error) {
      console.error('Error getting chess customization by ID:', error);
      throw new Error(`Failed to get chess customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a chess customization by ID
   */
  async update(id: string, data: UpdateChessCustomizationRequest): Promise<ChessCustomization | undefined> {
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      return undefined;
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if customization exists
      const existsResult = await client.query('SELECT id FROM customizations WHERE id = $1', [id]);
      if (existsResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return undefined;
      }

      // Update customizations table
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(data.name);
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(data.description);
      }
      if (data.boardSvg !== undefined) {
        updateFields.push(`board_svg = $${paramIndex++}`);
        updateValues.push(data.boardSvg);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await client.query(
          `UPDATE customizations SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // If pieces are being updated, replace all pieces
      if (data.pieces !== undefined) {
        // Delete existing pieces
        await client.query('DELETE FROM chess_pieces WHERE customization_id = $1', [id]);
        
        // Insert new pieces
        for (const piece of data.pieces) {
          await client.query(
            `INSERT INTO chess_pieces (customization_id, type, color, svg_data) 
             VALUES ($1, $2, $3, $4)`,
            [id, piece.type, piece.color, piece.svgData]
          );
        }
      }

      await client.query('COMMIT');

      // Return the updated customization
      return await this.getById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating chess customization:', error);
      throw new Error(`Failed to update chess customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete a chess customization by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return false;
      }

      const result = await this.pool.query('DELETE FROM customizations WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting chess customization:', error);
      throw new Error(`Failed to delete chess customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a customization exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return false;
      }

      const result = await this.pool.query('SELECT 1 FROM customizations WHERE id = $1', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking if chess customization exists:', error);
      throw new Error(`Failed to check chess customization existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the total count of customizations
   */
  async count(): Promise<number> {
    try {
      const result = await this.pool.query('SELECT COUNT(*) as count FROM customizations');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting chess customizations:', error);
      throw new Error(`Failed to count chess customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all customizations (useful for testing)
   */
  async clear(): Promise<void> {
    try {
      await this.pool.query('DELETE FROM customizations');
    } catch (error) {
      console.error('Error clearing chess customizations:', error);
      throw new Error(`Failed to clear chess customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Transform database rows into ChessCustomization objects
   * Handles the JOIN result where each row contains customization + piece data
   */
  private transformRowsToCustomizations(rows: any[]): ChessCustomization[] {
    const customizationMap = new Map<string, ChessCustomization>();

    for (const row of rows) {
      const customizationId = row.id;
      
      if (!customizationMap.has(customizationId)) {
        customizationMap.set(customizationId, {
          id: row.id,
          name: row.name,
          description: row.description,
          boardSvg: row.board_svg,
          pieces: [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        });
      }

      // Add piece if it exists (LEFT JOIN might have null pieces)
      if (row.type && row.color && row.svg_data) {
        const customization = customizationMap.get(customizationId)!;
        customization.pieces.push({
          type: row.type,
          color: row.color,
          svgData: row.svg_data
        });
      }
    }

    return Array.from(customizationMap.values());
  }
}