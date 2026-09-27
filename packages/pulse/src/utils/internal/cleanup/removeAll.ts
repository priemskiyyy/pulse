// One failure is rethrown as itself; several are kept on `errors` so none is lost. A plain Error, since older Hermes engines lack AggregateError.
const throwFailures = (failures: unknown[], message: string) => {
  if (failures.length === 1) {
    throw failures[0];
  }

  throw Object.assign(new Error(message), { errors: failures });
};

/** Runs every removal, newest first, even when one throws, then rethrows what failed. */
export const removeAll = (removals: Array<() => void>) => {
  const failures: unknown[] = [];

  for (const remove of [...removals].reverse()) {
    try {
      remove();
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length === 0) {
    return;
  }

  throwFailures(failures, "Several removals threw.");
};

/** Undoes a setup that threw, then rethrows its error; a failed rollback is kept beside it. */
export const rollBack = (
  removals: Array<() => void>,
  error: unknown,
): never => {
  try {
    removeAll(removals);
  } catch (rollbackError) {
    throwFailures(
      [error, rollbackError],
      "The setup threw, and undoing it threw too.",
    );
  }

  throw error;
};
