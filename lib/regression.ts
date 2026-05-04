// ================================================================
// lib/regression.ts
// Core Algorithm: Moving Average + Least Squares Linear Regression
// ================================================================

/**
 * movingAverage
 * Smooths noisy data by averaging each point with its preceding neighbors.
 * 
 * Time Complexity: O(n * w) where w = window size
 * Space Complexity: O(n)
 *
 * @param data   - array of numbers (e.g. daily revenues)
 * @param window - how many past values to include in each average
 * @returns      - smoothed array of same length
 */
export function movingAverage(data: number[], window: number): number[] {
  // Edge case: empty array → return empty (avoids crash in forecastRevenue)
  if (!data.length) return [];

  return data.map((_, i) => {
    // start index: clamp to 0 so we don't go out of bounds
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/**
 * linearRegression
 * Fits a line y = mx + b to a set of (x, y) points using least squares.
 *
 * Formula:
 *   slope     = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)
 *   intercept = (Σy - slope * Σx) / n
 *
 * Time Complexity: O(n) — 4 single-pass reduces
 * Space Complexity: O(1) — only scalars stored
 *
 * @param data - array of { x: number, y: number } points
 * @returns    - { slope, intercept, predict(x) }
 */
export function linearRegression(
  data: { x: number; y: number }[]
): { slope: number; intercept: number; predict: (x: number) => number } {
  const n = data.length;

  // Edge case: no data → return flat line at 0
  if (n === 0) {
    return { slope: 0, intercept: 0, predict: () => 0 };
  }

  // Edge case: single point → no slope can be computed
  if (n === 1) {
    return {
      slope: 0,
      intercept: data[0].y,
      predict: () => data[0].y,
    };
  }

  const sumX  = data.reduce((a, b) => a + b.x, 0);
  const sumY  = data.reduce((a, b) => a + b.y, 0);
  const sumXY = data.reduce((a, b) => a + b.x * b.y, 0);
  const sumXX = data.reduce((a, b) => a + b.x * b.x, 0);

  // Denominator of the slope formula
  const denom = n * sumXX - sumX * sumX;

  // Guard: if denom is 0, all x values are the same — slope is undefined
  // Fall back to a flat line at the mean y value
  if (denom === 0) {
    const meanY = sumY / n;
    return { slope: 0, intercept: meanY, predict: () => meanY };
  }

  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  };
}

/**
 * forecastRevenue
 * Forecasts revenue daysAhead into the future using:
 *   1. Moving average smoothing (reduces noise before regression)
 *   2. Least squares linear regression on smoothed data
 *   3. Math.max(0, ...) floor — revenue can't be negative
 *
 * @param snapshots - array of { snapshot_date, revenue, units_sold }
 * @param daysAhead - how many days into the future to predict
 * @returns         - forecasted revenue (always >= 0)
 */
export function forecastRevenue(
  snapshots: { snapshot_date: string; revenue: number; units_sold: number }[],
  daysAhead: number
): number {
  // Edge case: no history → can't forecast
  if (!snapshots.length) return 0;

  // Adaptive window: use half the data length (min 1, max 7)
  // Prevents over-smoothing on small datasets (e.g. 7-day view)
  const window = Math.min(7, Math.max(1, Math.floor(snapshots.length / 2)));

  const smoothed = movingAverage(snapshots.map((s) => s.revenue), window);
  const points   = smoothed.map((y, x) => ({ x, y }));
  const { predict } = linearRegression(points);

  // Predict at index = (last known index + daysAhead)
  // Floor at 0 — revenue forecast should never be negative
  return Math.max(0, predict(points.length - 1 + daysAhead));
}