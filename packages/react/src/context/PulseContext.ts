import type { Pulse } from "@priemskiyyy/pulse";
import { createContext } from "react";

export const PulseContext = createContext<Pulse | undefined>(undefined);
