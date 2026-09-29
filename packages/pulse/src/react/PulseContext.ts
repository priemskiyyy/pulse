import { createContext } from "react";

import type { Pulse } from "src/utils/Pulse";

export const PulseContext = createContext<Pulse | undefined>(undefined);
