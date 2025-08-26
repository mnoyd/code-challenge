# Chess Board Customization API

This project demonstrates a comprehensive CRUD API with a practical, engaging context. Rather than building a generic data management system, this API serves a chess customization platform that showcases proper data modeling, validation, and database organization.

The application enables users to create personalized chess experiences by designing custom board themes and piece sets. Traditional chess can feel monotonous with its standard wooden pieces, so this API empowers creativity by allowing users to submit and manage their own visual interpretations.

For example, a user passionate about gardening could create a "Botanical Chess" theme where rooks become elegant tulips, knights transform into roses, and the entire board reflects a garden aesthetic. Each user can maintain multiple themed sets, creating a rich library of personalized chess experiences.

## Overview

This system allows users to create and manage custom chess board customizations by uploading SVG graphics in base64 format. Users can customize:

- **Chess Board**: 8x8 grid design as SVG
- **Chess Pieces**: Individual piece designs (pawn, rook, knight, bishop, queen, king) for both white and black pieces

## Features

- Create custom chess board designs
- Upload SVG pieces in base64 format
- Retrieve all customizations or specific ones by ID
- Update existing customizations
- Delete unwanted designs
- Basic validation for SVG format and size limits

## API Endpoints

```
GET    /api/customizations     # Get all customizations
GET    /api/customizations/:id # Get customization by ID
POST   /api/customizations     # Create new customization
PUT    /api/customizations/:id # Update customization
DELETE /api/customizations/:id # Delete customization
```

## Data Format

Each customization includes:

- Name and optional description
- Optional board SVG (base64 encoded)
- Array of piece designs with type, color, and SVG data
- Timestamps for creation and updates

## Requirements

- SVG files must be base64 encoded
- Maximum size limit of 100KB per SVG
- Valid chess piece types: pawn, rook, knight, bishop, queen, king
- Piece colors: white, black

## Technology Stack

- **Backend**: Node.js with ExpressJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Docker Compose
- **Database Client**: node-postgres (pg)
- **Validation**: Custom validation functions
- **Logging**: Console logging

## Setup and Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Docker and Docker Compose

### Quick Start with Docker

The easiest way to run the complete application with PostgreSQL:

```bash
# Clone the repository
git clone <repository-url>
cd express-crud-api

# Start both the API and PostgreSQL database
docker-compose up --build
```

The API will be available at `http://localhost:3000` and PostgreSQL at `localhost:5432`.

### Development Setup

For local development with hot reload:

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd express-crud-api
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` file with your database configuration if needed.

3. **Start only the PostgreSQL database:**

```bash
npm run db:up
# or
docker-compose up postgres
```

4. **Start the development server:**

```bash
npm run dev
```

The development server will start on `http://localhost:3000` with hot reload enabled.

### Production Deployment

#### Option 1: Docker Compose (Recommended)

```bash
# Build and start both services in production mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Manual Build

```bash
# Start PostgreSQL
npm run db:up

# Build and start the application
npm run build
npm start
```

## Available Scripts

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript (automatically cleans dist first)
- `npm start` - Start production server
- `npm run clean` - Remove compiled files from dist directory
- `npm run type-check` - Check TypeScript types without compiling
- `npm run lint` - Placeholder for linting (ESLint not configured)

### Database Scripts

- `npm run db:up` - Start PostgreSQL database only (for development)
- `npm run db:down` - Stop all Docker Compose services
- `npm run db:logs` - View PostgreSQL database logs

### Docker Commands

- `docker-compose up --build` - Start both API and PostgreSQL services
- `docker-compose up postgres` - Start only PostgreSQL service
- `docker-compose up -d --build` - Start services in detached mode
- `docker-compose down` - Stop all services
- `docker-compose logs -f app` - View API service logs
- `docker-compose logs -f postgres` - View PostgreSQL logs

### Testing Scripts

- `npm test` - Run all tests (uses PostgreSQL)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Usage Examples

### Create a Chess Customization

```bash
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Board",
    "description": "A beautiful wooden chess set",
    "boardSvg": "data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4=",
    "pieces": [
      {
        "type": "pawn",
        "color": "white",
        "svgData": "data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4="
      }
    ]
  }'
```

### Get All Customizations

```bash
curl http://localhost:3000/api/customizations
```

### Get Specific Customization

```bash
curl http://localhost:3000/api/customizations/{id}
```

### Update a Customization

```bash
curl -X PUT http://localhost:3000/api/customizations/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Board Name",
    "description": "Updated description"
  }'
```

### Delete a Customization

```bash
curl -X DELETE http://localhost:3000/api/customizations/{id}
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    "id": "unique-id",
    "name": "Customization Name",
    "description": "Optional description",
    "boardSvg": "base64-encoded-svg",
    "pieces": [
      {
        "type": "pawn",
        "color": "white",
        "svgData": "base64-encoded-svg"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (for successful deletions)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include details:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": "SVG data must be valid base64 format"
}
```

## Testing

All tests use PostgreSQL as the storage backend for consistency with production.

### Running Tests

1. **Start the PostgreSQL database:**

```bash
npm run db:up
```

2. **Run the test suite:**

```bash
npm test
```

3. **Run tests with coverage:**

```bash
npm run test:coverage
```

4. **Run tests in watch mode:**

```bash
npm run test:watch
```

### Test Configuration

Tests automatically use a separate test database (`chess_customizations_test`) to avoid conflicts with development data. The test database is created and managed automatically.

### Test Environment Variables

You can configure the test database connection:

```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=chess_customizations_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=password
```

### Test Types

The project includes:

- **Unit tests**: Validation functions, error handling, database connection logic
- **Integration tests**: Full API endpoint testing with real database
- **Storage tests**: PostgreSQL storage layer functionality
- **Database tests**: Connection and initialization testing

## Docker Services

The application consists of two Docker services:

### App Service

- **Image**: Built from local Dockerfile
- **Port**: 3000
- **Health Check**: Monitors `/health` endpoint
- **Dependencies**: Waits for PostgreSQL to be healthy before starting
- **Restart Policy**: Automatically restarts unless stopped

### PostgreSQL Service

- **Image**: postgres:15
- **Port**: 5432
- **Database**: chess_customizations
- **Credentials**: postgres/password (configurable via environment)
- **Volume**: Persistent data storage
- **Health Check**: Uses `pg_isready` command

## Development Workflows

### Full Stack Development

```bash
# Start both services for complete development environment
docker-compose up --build

# Make changes to code, rebuild and restart
docker-compose up --build --force-recreate app
```

### API Development Only

```bash
# Start only PostgreSQL for local API development
npm run db:up

# Run API locally with hot reload
npm run dev
```

### Database Management

```bash
# View database logs
npm run db:logs

# Connect to database
docker-compose exec postgres psql -U postgres -d chess_customizations

# Reset database (removes all data)
docker-compose down -v
docker-compose up postgres
```

## Development Notes

- **Data Persistence**: PostgreSQL data persists between container restarts via Docker volumes
- **Hot Reload**: Use `npm run dev` for local development with automatic restarts
- **Health Checks**: Both services include health monitoring for reliable startup
- **Environment Variables**: Configure database connection via `.env` file or Docker environment
- **SVG Validation**: Files are limited to 100KB and must be base64 encoded
- **API Standards**: Follows RESTful conventions with proper HTTP status codes
