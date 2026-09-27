// The core compiles without DOM or Node types, where no console is declared.
declare const console: { error?: unknown } | undefined;

export const reportToConsole = (...values: unknown[]) => {
  try {
    if (typeof console === "undefined" || typeof console.error !== "function") {
      return;
    }

    console.error(...values);
  } catch {
    // A missing or throwing console must not break the delivery around it.
  }
};
