import { Pulse } from "@priemskiyyy/pulse";
import { createMockAdapter } from "@priemskiyyy/pulse/testing";

// A Pulse over a foreground host, for the status view.
export const createStatus = () => {
  const mock = createMockAdapter({
    initial: { phase: "foreground", interaction: "available" },
  });

  return { mock, pulse: new Pulse({ adapter: mock.adapter }) };
};
