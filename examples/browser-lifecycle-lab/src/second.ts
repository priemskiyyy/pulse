import { findElement } from "src/findElement";

findElement("back", HTMLButtonElement).addEventListener("click", () => {
  history.back();
});
