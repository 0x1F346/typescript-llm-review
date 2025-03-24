# Analytics Dashboard Backend

This repository contains the backend service that powers our customer-facing analytics dashboard. The service provides APIs for retrieving analytics data with various filtering, segmentation, and visualization options.

## Project Overview

The analytics backend handles:
- Querying time-series analytics data from PostgreSQL
- Caching frequently requested data in Redis
- Segmenting data by different dimensions
- Handling authentication and authorization
- Providing data in formats suitable for frontend visualization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your configuration
4. Build the project:
   ```
   npm run build
   ```
5. Start the service:
   ```
   npm start
   ```

For development mode:
```
npm run dev
```

## API Documentation

### GET /api/analytics/data

Retrieves analytics data based on provided parameters.

**Query Parameters:**
- `userId` (optional): Filter data for a specific user
- `startDate`: Start date in YYYY-MM-DD format
- `endDate`: End date in YYYY-MM-DD format
- `metrics`: Array of metric names to retrieve
- `segments` (optional): Array of dimensions to segment data by
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
[
  {
    "metricName": "pageViews",
    "totalValue": 15000,
    "timeSeriesData": [
      { "timestamp": "2023-01-01", "value": 1500 },
      { "timestamp": "2023-01-02", "value": 1600 }
    ],
    "segmentData": {
      "mobile": 8000,
      "desktop": 7000
    }
  }
]
```

### POST /api/analytics/refresh-cache

Forces a refresh of cached data for the specified parameters.

## Architecture

The service follows a modular architecture with:
- Type-safe interfaces using TypeScript
- Express.js for API routing
- PostgreSQL for data storage
- Redis for caching
- Zod for request validation

## Project Structure

- `/src` - Source code
  - `/db` - Database connection and queries
  - `/models` - TypeScript interfaces
  - `/routes` - Express routes
  - `/services` - Business logic
  - `/utils` - Utility functions
  - `index.ts` - Application entry point