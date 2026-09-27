import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: { src: fileURLToPath(new URL("./src", import.meta.url)) },
    // The workspace links Pulse with its own React; the page must render with one.
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      // The second page is where a back navigation starts from.
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        second: fileURLToPath(new URL("./second.html", import.meta.url)),
      },
    },
  },
});
