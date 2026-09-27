/** `observedAway` is an estimate between two observed samples, never a stopwatch. */
export const formatAway = (observedAway: number | null) => {
  if (observedAway === null) {
    return "away time not observed";
  }

  if (observedAway < 1_000) {
    return `away about ${Math.round(observedAway)} ms`;
  }

  return `away about ${(observedAway / 1_000).toFixed(1)} s`;
};
