-- Create analytics functions for business dashboard

-- Function to get job posts analytics
CREATE OR REPLACE FUNCTION get_job_posts_analytics(days_range INTEGER DEFAULT 7)
RETURNS TABLE (
  day TEXT,
  active BIGINT,
  inactive BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_series.day, 'Dy') as day,
    COALESCE(COUNT(*) FILTER (WHERE j.status = 'open'), 0) as active,
    COALESCE(COUNT(*) FILTER (WHERE j.status IN ('closed', 'draft')), 0) as inactive
  FROM generate_series(
    CURRENT_DATE - (days_range - 1) * INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS date_series(day)
  LEFT JOIN jobs j ON DATE(j.created_at) = DATE(date_series.day)
  GROUP BY date_series.day
  ORDER BY date_series.day;
END;
$$ LANGUAGE plpgsql;

-- Function to get candidate registrations analytics
CREATE OR REPLACE FUNCTION get_candidate_registrations_analytics(days_range INTEGER DEFAULT 7)
RETURNS TABLE (
  day TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_series.day, 'Dy') as day,
    COALESCE(COUNT(c.id), 0) as count
  FROM generate_series(
    CURRENT_DATE - (days_range - 1) * INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS date_series(day)
  LEFT JOIN candidates c ON DATE(c.created_at) = DATE(date_series.day)
  GROUP BY date_series.day
  ORDER BY date_series.day;
END;
$$ LANGUAGE plpgsql;

-- Function to get employer registrations analytics
CREATE OR REPLACE FUNCTION get_employer_registrations_analytics(days_range INTEGER DEFAULT 7)
RETURNS TABLE (
  day TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_series.day, 'Dy') as day,
    COALESCE(COUNT(e.id), 0) as count
  FROM generate_series(
    CURRENT_DATE - (days_range - 1) * INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS date_series(day)
  LEFT JOIN employers e ON DATE(e.created_at) = DATE(date_series.day)
  GROUP BY date_series.day
  ORDER BY date_series.day;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue analytics
CREATE OR REPLACE FUNCTION get_revenue_analytics(days_range INTEGER DEFAULT 7)
RETURNS TABLE (
  day TEXT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(date_series.day, 'Dy') as day,
    COALESCE(SUM(pt.amount) / 100.0, 0) as revenue
  FROM generate_series(
    CURRENT_DATE - (days_range - 1) * INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS date_series(day)
  LEFT JOIN payment_transactions pt ON DATE(pt.created_at) = DATE(date_series.day)
    AND pt.status = 'success'
  GROUP BY date_series.day
  ORDER BY date_series.day;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_job_posts_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_registrations_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_registrations_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_analytics(INTEGER) TO authenticated;
