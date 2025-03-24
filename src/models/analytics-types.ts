import { z } from 'zod';

/**
 * Parameters for analytics queries
 */
export interface AnalyticsQueryParams {
  userId?: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  segments?: string[];
  limit?: number;
}

/**
 * A point in a time series
 */
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

/**
 * Result for a single analytics metric
 */
export interface AnalyticsResult {
  metricName: string;
  totalValue: number;
  timeSeriesData: TimeSeriesPoint[];
  segmentData?: Record<string, number>;
}

/**
 * Validation schema for query parameters
 */
export const queryParamsSchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metrics: z.array(z.string()),
  segments: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
});

/**
 * Express Request with validated parameters
 */
export interface ValidatedRequest extends Express.Request {
  validatedParams: AnalyticsQueryParams;
}