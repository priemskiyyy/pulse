import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SecondPage } from "src/components/SecondPage/SecondPage";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("The page has no #root element.");
}

createRoot(root).render(
  <StrictMode>
    <SecondPage />
  </StrictMode>,
);
