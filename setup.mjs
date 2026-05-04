import { writeFileSync } from 'fs';

writeFileSync('__tests__/regression.test.ts', `import { movingAverage, linearRegression, forecastRevenue } from '../lib/regression';

describe('movingAverage', () => {
  test('returns same length as input', () => {
    const data = [1, 2, 3, 4, 5];
    expect(movingAverage(data, 3).length).toBe(5);
  });

  test('single element window returns same values', () => {
    const data = [10, 20, 30];
    expect(movingAverage(data, 1)).toEqual([10, 20, 30]);
  });

  test('window larger than data uses all available points', () => {
    const data = [2, 4];
    const result = movingAverage(data, 10);
    expect(result[0]).toBeCloseTo(2);
    expect(result[1]).toBeCloseTo(3);
  });

  test('computes correct 3-point moving average', () => {
    const data = [1, 2, 3, 4, 5];
    const result = movingAverage(data, 3);
    expect(result[2]).toBeCloseTo(2);
    expect(result[3]).toBeCloseTo(3);
    expect(result[4]).toBeCloseTo(4);
  });

  test('handles all same values', () => {
    const data = [5, 5, 5, 5];
    const result = movingAverage(data, 3);
    result.forEach(v => expect(v).toBeCloseTo(5));
  });
});

describe('linearRegression', () => {
  test('returns slope, intercept, and predict function', () => {
    const result = linearRegression([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(result).toHaveProperty('slope');
    expect(result).toHaveProperty('intercept');
    expect(result).toHaveProperty('predict');
  });

  test('perfect linear data returns slope 1 and intercept 0', () => {
    const data = [0,1,2,3,4].map(x => ({ x, y: x }));
    const { slope, intercept } = linearRegression(data);
    expect(slope).toBeCloseTo(1);
    expect(intercept).toBeCloseTo(0);
  });

  test('predict returns correct value on perfect linear data', () => {
    const data = [0,1,2,3,4].map(x => ({ x, y: x * 2 }));
    const { predict } = linearRegression(data);
    expect(predict(5)).toBeCloseTo(10);
  });

  test('horizontal line returns slope 0', () => {
    const data = [0,1,2,3].map(x => ({ x, y: 5 }));
    const { slope } = linearRegression(data);
    expect(slope).toBeCloseTo(0);
  });

  test('negative slope detected correctly', () => {
    const data = [0,1,2,3].map(x => ({ x, y: 10 - x }));
    const { slope } = linearRegression(data);
    expect(slope).toBeCloseTo(-1);
  });
});

describe('forecastRevenue', () => {
  test('returns 0 for empty snapshots', () => {
    expect(forecastRevenue([], 30)).toBe(0);
  });

  test('returns a positive number for valid data', () => {
    const snapshots = Array.from({ length: 10 }, (_, i) => ({
      snapshot_date: '2024-01-0' + (i + 1),
      revenue: 1000 + i * 100,
    }));
    const result = forecastRevenue(snapshots, 30);
    expect(result).toBeGreaterThan(0);
  });

  test('forecast is higher for upward trending data', () => {
    const up = Array.from({ length: 10 }, (_, i) => ({ snapshot_date: '', revenue: i * 500 }));
    const flat = Array.from({ length: 10 }, (_, i) => ({ snapshot_date: '', revenue: 1000 }));
    expect(forecastRevenue(up, 30)).toBeGreaterThan(forecastRevenue(flat, 30));
  });

  test('never returns negative value', () => {
    const down = Array.from({ length: 5 }, (_, i) => ({ snapshot_date: '', revenue: 100 - i * 50 }));
    expect(forecastRevenue(down, 30)).toBeGreaterThanOrEqual(0);
  });
});
`);

console.log('Test file written!');