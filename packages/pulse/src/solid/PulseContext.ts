import { createContext } from "solid-js";
import type { Accessor } from "solid-js";

import type { Pulse } from "src/utils/Pulse";

export const PulseContext = createContext<Accessor<Pulse>>();
