import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import type React from "react";

import { Application } from "src/Application";
import { startLab } from "src/lab/startLab";

// The application owns one observation for its whole life, started outside React.
const { lab, runtime } = startLab();

const Root: React.FunctionComponent = () => (
  <Application lab={lab} runtime={runtime} />
);

registerRootComponent(Root);
