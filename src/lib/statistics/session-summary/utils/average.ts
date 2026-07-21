export function calculateAverage(
  total: number,
  count: number,
  precision = 2
): number {
  if (count <= 0) {
    return 0;
  }

  return Number((total / count).toFixed(precision));
}
