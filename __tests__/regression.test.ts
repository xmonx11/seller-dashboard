// We import the 3 functions we want to test
// These are the exact same functions used in your dashboard
import {
  movingAverage,
  linearRegression,
  forecastRevenue,
} from '../lib/regression';

// ================================================================
// movingAverage — 4 tests
// ================================================================
// describe() groups related tests together
// Makes output easier to read: "movingAverage > window of 2"
describe('movingAverage', () => {

  // TEST 1
  // Window of 3 — average of last 3 numbers at each index
  // index 0: [10]           → 10/1 = 10
  // index 1: [10,20]        → 30/2 = 15
  // index 2: [10,20,30]     → 60/3 = 20
  // index 3: [20,30,40]     → 90/3 = 30
  // index 4: [30,40,50]     → 120/3 = 40
  test('computes correct moving average with window of 3', () => {
    const result = movingAverage([10, 20, 30, 40, 50], 3);
    // toBeCloseTo handles floating point precision issues
    // e.g. 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(15);
    expect(result[2]).toBeCloseTo(20);
    expect(result[3]).toBeCloseTo(30);
    expect(result[4]).toBeCloseTo(40);
  });

  // TEST 2
  // Window of 1 — each value averages only itself
  // So output should equal input exactly
  test('window of 1 returns same values as input', () => {
    const input  = [5, 10, 15, 20];
    const result = movingAverage(input, 1);
    // forEach checks every element individually
    input.forEach((val, i) => {
      expect(result[i]).toBeCloseTo(val);
    });
  });

  // TEST 3
  // Window larger than data length
  // e.g. data=[10,20], window=10
  // index 0: [10]     → 10
  // index 1: [10,20]  → 15
  // Should NOT crash — window just uses what's available
  test('window larger than data length does not crash', () => {
    const result = movingAverage([10, 20], 10);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(15);
  });

  // TEST 4
  // Empty array input → should return empty array
  // Important edge case — dashboard passes empty array
  // when no snapshots exist yet
  test('empty array returns empty array', () => {
    const result = movingAverage([], 3);
    expect(result).toEqual([]);
  });

});

// ================================================================
// linearRegression — 4 tests
// ================================================================
describe('linearRegression', () => {

  // TEST 5
  // Perfect upward line: y = x
  // points: (0,0), (1,1), (2,2), (3,3), (4,4)
  // slope should = 1, intercept should = 0
  test('computes slope of 1 for perfect upward line', () => {
    const data = [0, 1, 2, 3, 4].map((x) => ({ x, y: x }));
    const { slope, intercept } = linearRegression(data);
    expect(slope).toBeCloseTo(1);
    expect(intercept).toBeCloseTo(0);
  });

  // TEST 6
  // Flat line: all y values are the same
  // points: (0,5), (1,5), (2,5), (3,5)
  // slope should = 0 (no trend up or down)
  test('computes slope of 0 for flat line', () => {
    const data = [0, 1, 2, 3].map((x) => ({ x, y: 5 }));
    const { slope } = linearRegression(data);
    expect(slope).toBeCloseTo(0);
  });

  // TEST 7
  // predict() function — given x, returns y on the line
  // For y = 2x + 1:
  // slope=2, intercept=1
  // predict(5) should = 2*5 + 1 = 11
  test('predict() returns correct value on the line', () => {
    // y = 2x + 1 → points: (0,1),(1,3),(2,5),(3,7),(4,9)
    const data = [0, 1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 1 }));
    const { predict } = linearRegression(data);
    expect(predict(5)).toBeCloseTo(11); // 2*5 + 1 = 11
    expect(predict(0)).toBeCloseTo(1);  // 2*0 + 1 = 1
    expect(predict(10)).toBeCloseTo(21); // 2*10 + 1 = 21
  });

  // TEST 8
  // Negative slope — downward trend
  // points: (0,4),(1,3),(2,2),(3,1),(4,0)
  // slope should be negative (-1)
  test('computes negative slope for downward trend', () => {
    const data = [0, 1, 2, 3, 4].map((x) => ({ x, y: 4 - x }));
    const { slope } = linearRegression(data);
    expect(slope).toBeCloseTo(-1);
  });

});

// ================================================================
// forecastRevenue — 4 tests
// ================================================================
describe('forecastRevenue', () => {

  // TEST 9
  // Empty snapshots → should return 0
  // This is what happens on first launch with no data
  // Math.max(0, ...) in forecastRevenue ensures we return 0 not negative
  test('returns 0 for empty snapshots', () => {
    const result = forecastRevenue([], 30);
    expect(result).toBe(0);
  });

  // TEST 10
  // Upward trending data → forecast should be positive
  // Revenue goes 100, 200, 300... clearly going up
  // So 30 days ahead should be > 0
  test('returns positive forecast for upward trending data', () => {
    const snapshots = [100, 200, 300, 400, 500, 600, 700].map(
      (revenue, i) => ({
        // snapshot_date is not used in calculation
        // but forecastRevenue expects this shape
        snapshot_date: `2024-01-0${i + 1}`,
        revenue,
        units_sold: 10,
      })
    );
    const result = forecastRevenue(snapshots, 30);
    expect(result).toBeGreaterThan(0);
  });

  // TEST 11
  // forecastRevenue uses Math.max(0, predict(...))
  // So even if regression predicts negative (declining data),
  // result should never be negative — always >= 0
  test('never returns negative value even for declining data', () => {
    const snapshots = [700, 600, 500, 400, 300, 200, 100].map(
      (revenue, i) => ({
        snapshot_date: `2024-01-0${i + 1}`,
        revenue,
        units_sold: 10,
      })
    );
    // Very far ahead — regression would predict negative
    const result = forecastRevenue(snapshots, 999);
    // Math.max(0, ...) ensures floor of 0
    expect(result).toBeGreaterThanOrEqual(0);
  });

  // TEST 12
  // Forecasting further ahead = higher value for upward trend
  // 30 days ahead should be more than 7 days ahead
  // This is the core of the 7-day vs 30-day toggle defense question!
  test('30-day forecast is greater than 7-day forecast for upward trend', () => {
    const snapshots = [100, 200, 300, 400, 500, 600, 700].map(
      (revenue, i) => ({
        snapshot_date: `2024-01-0${i + 1}`,
        revenue,
        units_sold: 10,
      })
    );
    const forecast7  = forecastRevenue(snapshots, 7);
    const forecast30 = forecastRevenue(snapshots, 30);
    // 30 days ahead on upward trend MUST be higher than 7 days ahead
    expect(forecast30).toBeGreaterThan(forecast7);
  });

});