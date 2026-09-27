import { ArrowLeft } from "@phosphor-icons/react";
import clsx from "clsx";
import type React from "react";

import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { CARD_CLASS_NAME } from "example-shared/ui/styles/cardStyles";

const handleBackPress = () => {
  window.history.back();
};

export const SecondPage: React.FunctionComponent = () => (
  <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
    <section className={clsx("flex flex-col gap-3 p-6", CARD_CLASS_NAME)}>
      <h1 className="text-2xl font-semibold tracking-tight">Second page</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Go back with the browser or the button below. A back/forward cache
        restore keeps the lab&apos;s document token; a fresh load shows a new
        one.
      </p>
      <button
        type="button"
        onClick={handleBackPress}
        className={clsx("self-start", buttonStyles({ variant: "primary" }))}
      >
        <ArrowLeft aria-hidden="true" size={16} weight="bold" />
        Back to the lab
      </button>
    </section>
  </main>
);
