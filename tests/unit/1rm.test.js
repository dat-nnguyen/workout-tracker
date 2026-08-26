import { calculateEstimated1RM } from '../../src/modules/metrics/metrics.service.js';

describe('1RM Calculator Utility (Unit)', () => {
  test('should return exact weight if reps is 1', () => {
    const result = calculateEstimated1RM(100, 1);
    expect(result).toBe(100);
  });

  test('should calculate 1RM using the Epley formula for multiple reps', () => {
    // 100 * (1 + 10 / 30) = 100 * 1.3333... = 133.3
    const result = calculateEstimated1RM(100, 10);
    expect(result).toBe(133.3);
  });

  test('should calculate 1RM for 5 reps correctly', () => {
    // 80 * (1 + 5 / 30) = 80 * (1 + 0.16666...) = 93.333... = 93.3
    const result = calculateEstimated1RM(80, 5);
    expect(result).toBe(93.3);
  });

  test('should return 0 when weight or reps is 0 or negative', () => {
    expect(calculateEstimated1RM(0, 10)).toBe(0);
    expect(calculateEstimated1RM(100, 0)).toBe(0);
    expect(calculateEstimated1RM(-50, 10)).toBe(0);
    expect(calculateEstimated1RM(100, -5)).toBe(0);
    expect(calculateEstimated1RM(null, undefined)).toBe(0);
  });
});
