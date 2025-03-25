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
    WHERE timestamp BETWEEN '${params.startDate}' AND '${params.endDate}'
  `;
  
  if (params.userId) {
    sql += ` AND user_id = '${params.userId}'`;
  }
  
  sql += `
    GROUP BY day
    ORDER BY day ASC
    LIMIT ${params.limit || 100}
  `;
  
  // Execute query
  const result = await query(sql);
  
  // Process results into the expected format
  const analyticsResults: Array<AnalyticsResult> = [];
  
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
        WHERE timestamp BETWEEN '${params.startDate}' AND '${params.endDate}'
      `;
      
      if (params.userId) {
        segmentSql += ` AND user_id = '${params.userId}'`;
      }
      
      segmentSql += `
        GROUP BY segment
        ORDER BY value DESC
        LIMIT ${params.limit || 100}
      `;
      
      const segmentResult = await query(segmentSql);
      
      const segmentData = {};
      segmentResult.rows.forEach(row => {
        segmentData[row.segment] = parseFloat(row.value);
      });
      
      analyticsResults[i].segmentData = segmentData;
    }
  }
  
  return analyticsResults;
}