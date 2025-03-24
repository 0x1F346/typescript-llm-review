import { AnalyticsQueryParams, AnalyticsResult, TimeSeriesPoint } from '../models/analytics-types';
import { query } from '../db/database';

/**
 * Fetch analytics data from the database
 * @param params Query parameters
 * @returns Analytics results
 */
export const fetchAnalyticsData = async (params: AnalyticsQueryParams): Promise<AnalyticsResult[]> => {
  // Build query dynamically based on requested metrics and segments
  let sql = `
    SELECT 
      date_trunc('day', timestamp) as day,
      ${params.metrics.map(metric => `SUM(${metric}) as ${metric}`).join(',')}
    FROM user_events
    WHERE timestamp BETWEEN $1 AND $2
  `;
  
  const queryParams = [params.startDate, params.endDate];
  let paramIndex = 3;
  
  if (params.userId) {
    sql += ` AND user_id = $${paramIndex++}`;
    queryParams.push(params.userId);
  }
  
  sql += `
    GROUP BY day
    ORDER BY day ASC
    LIMIT $${paramIndex}
  `;
  queryParams.push(params.limit.toString());
  
  // Execute query
  const result = await query(sql, queryParams);
  
  // Process results into the expected format
  const analyticsResults: AnalyticsResult[] = [];
  
  for (const metric of params.metrics) {
    const timeSeriesData: TimeSeriesPoint[] = result.rows.map(row => ({
      timestamp: row.day,
      value: parseFloat(row[metric])
    }));
    
    const totalValue = timeSeriesData.reduce((sum, point) => sum + point.value, 0);
    
    analyticsResults.push({
      metricName: metric,
      totalValue,
      timeSeriesData
    });
  }
  
  // If segments are requested, fetch segment data
  if (params.segments && params.segments.length > 0) {
    for (let i = 0; i < analyticsResults.length; i++) {
      const metric = params.metrics[i];
      let segmentSql = `
        SELECT 
          ${params.segments[0]} as segment,
          SUM(${metric}) as value
        FROM user_events
        WHERE timestamp BETWEEN $1 AND $2
      `;
      
      const segmentQueryParams = [params.startDate, params.endDate];
      let segmentParamIndex = 3;
      
      if (params.userId) {
        segmentSql += ` AND user_id = $${segmentParamIndex++}`;
        segmentQueryParams.push(params.userId);
      }
      
      segmentSql += `
        GROUP BY segment
        ORDER BY value DESC
        LIMIT $${segmentParamIndex}
      `;
      segmentQueryParams.push(params.limit.toString());
      
      const segmentResult = await query(segmentSql, segmentQueryParams);
      
      const segmentData: Record<string, number> = {};
      segmentResult.rows.forEach(row => {
        segmentData[row.segment] = parseFloat(row.value);
      });
      
      analyticsResults[i].segmentData = segmentData;
    }
  }
  
  return analyticsResults;
};