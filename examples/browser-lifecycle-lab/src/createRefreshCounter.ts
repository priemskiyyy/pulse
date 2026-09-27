type RefreshCounterOptions = {
  staleAfter: number;
  load: () => Promise<void>;
  onChange: () => void;
};

// One refresh at a time: a foreground transition during a refresh joins it instead of starting another.
export const createRefreshCounter = ({
  staleAfter,
  load,
  onChange,
}: RefreshCounterOptions) => {
  let refreshes = 0;
  let lastError: unknown = null;
  let loadedAt = Date.now();
  let inFlight: Promise<void> | null = null;

  const refreshIfStale = () => {
    if (inFlight !== null) {
      return inFlight;
    }

    if (Date.now() - loadedAt < staleAfter) {
      return Promise.resolve();
    }

    inFlight = load()
      .then(
        () => {
          refreshes += 1;
          lastError = null;
          loadedAt = Date.now();
        },
        (error: unknown) => {
          lastError = error;
        },
      )
      .finally(() => {
        inFlight = null;
        onChange();
      });

    return inFlight;
  };

  return {
    refreshIfStale,
    getRefreshes: () => refreshes,
    getLastError: () => lastError,
  };
};
