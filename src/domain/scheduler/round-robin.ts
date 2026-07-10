export function buildRoundRobinPairs(memberIds: string[]): string[][][] {
  if (memberIds.length < 2) return [];

  const ids = [...memberIds];
  if (ids.length % 2 === 1) ids.push("__BYE__");

  const rounds: string[][][] = [];
  const total = ids.length;
  const half = total / 2;
  let current = [...ids];

  for (let round = 0; round < total - 1; round += 1) {
    const pairings: string[][] = [];

    for (let i = 0; i < half; i += 1) {
      const a = current[i];
      const b = current[total - 1 - i];

      if (a !== "__BYE__" && b !== "__BYE__") {
        pairings.push([a, b]);
      }
    }

    rounds.push(pairings);

    const fixed = current[0];
    const rest = current.slice(1);
    rest.unshift(rest.pop()!);
    current = [fixed, ...rest];
  }

  return rounds;
}
