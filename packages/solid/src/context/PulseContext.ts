import type { Pulse } from "@priemskiyyy/pulse";
import { createContext } from "solid-js";
import type { Accessor } from "solid-js";

export const PulseContext = createContext<Accessor<Pulse>>();
