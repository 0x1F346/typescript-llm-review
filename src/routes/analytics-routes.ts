import express, { Request, Response, NextFunction } from 'express';
import { AnalyticsQueryParams, queryParamsSchema } from '../models/analytics-types';
import { fetchAnalyticsData } from '../services/analytics-service';
import { generateCacheKey, getCachedData, setCachedData } from '../utils/cache-utils';

// Create router
const router = express.Router();

// Middleware to validate request params
const validateQueryParams = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert query params from string to expected types
    const params: any = {
      ...req.query,
      metrics: req.query.metrics ? 
        (Array.isArray(req.query.metrics) ? req.query.metrics : [req.query.metrics]) : [],
      segments: req.query.segments ? 
        (Array.isArray(req.query.segments) ? req.query.segments : [req.query.segments]) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const validatedParams = queryParamsSchema.parse(params);
    (req as any).validatedParams = validatedParams;
    next();
  } catch (error: any) {
    res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
  }
};

// API endpoint to get analytics data
router.get('/data', validateQueryParams, async (req: Request, res: Response) => {
  try {
    const params = (req as any).validatedParams as AnalyticsQueryParams;
    const cacheKey = generateCacheKey(params);
    
    // Try to get from cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch from database if not in cache
    const analyticsData = await fetchAnalyticsData(params);
    
    // Store in cache for 15 minutes
    await setCachedData(cacheKey, analyticsData);
    
    return res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// API endpoint to refresh cache
router.post('/refresh-cache', validateQueryParams, async (req: Request, res: Response) => {
  try {
    const params = (req as any).validatedParams as AnalyticsQueryParams;
    const cacheKey = generateCacheKey(params);
    
    // Fetch fresh data
    const analyticsData = await fetchAnalyticsData(params);
    
    // Update cache
    await setCachedData(cacheKey, analyticsData);
    
    return res.json({ success: true, message: 'Cache refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

export default router;