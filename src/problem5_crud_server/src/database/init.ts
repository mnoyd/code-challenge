import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Database initialization utility
 * Handles creating tables and setting up the database schema
 */
export class DatabaseInitializer {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Initialize the database by creating tables if they don't exist
     * Reads and executes the schema.sql file
     */
    async initializeDatabase(): Promise<void> {
        try {
            console.log('Initializing database schema...');
            
            // Read the schema SQL file
            const schemaPath = join(__dirname, 'schema.sql');
            const schemaSql = readFileSync(schemaPath, 'utf8');
            
            // Execute the schema SQL
            await this.pool.query(schemaSql);
            
            console.log('Database schema initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database schema:', error);
            throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if the database tables exist
     * Returns true if both customizations and chess_pieces tables exist
     */
    async tablesExist(): Promise<boolean> {
        try {
            const result = await this.pool.query(`
                SELECT COUNT(*) as table_count
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('customizations', 'chess_pieces')
            `);
            
            return parseInt(result.rows[0].table_count) === 2;
        } catch (error) {
            console.error('Error checking if tables exist:', error);
            return false;
        }
    }

    /**
     * Verify database connection and schema
     * Throws an error if connection fails or schema is invalid
     */
    async verifyDatabase(): Promise<void> {
        try {
            // Test basic connection
            await this.pool.query('SELECT NOW()');
            
            // Check if tables exist
            const tablesExist = await this.tablesExist();
            if (!tablesExist) {
                throw new Error('Database tables do not exist. Run initialization first.');
            }
            
            // Verify table structure by checking key columns
            await this.pool.query('SELECT id, name, created_at FROM customizations LIMIT 0');
            await this.pool.query('SELECT id, customization_id, type, color, svg_data FROM chess_pieces LIMIT 0');
            
            console.log('Database verification successful');
        } catch (error) {
            console.error('Database verification failed:', error);
            throw new Error(`Database verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}