import type React from "react";

export const Footer: React.FunctionComponent = () => (
  <footer className="border-t border-zinc-200/70 dark:border-zinc-800">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-8 text-sm text-zinc-500 sm:px-6">
      <span>
        Pulse reads this page&apos;s own visibility, focus and page transitions.
        Nothing leaves your browser.
      </span>
      <a
        href="https://github.com/priemskiyyy/pulse"
        className="underline-offset-2 hover:underline sm:ml-auto"
      >
        Pulse on GitHub
      </a>
    </div>
  </footer>
);
