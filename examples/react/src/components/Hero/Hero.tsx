import { ClockCounterClockwise, Eye } from "@phosphor-icons/react";
import type React from "react";

import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { HeroStep } from "src/components/Hero/HeroStep";
import { scrollToElement } from "src/utils/scrollToElement";

export const Hero: React.FunctionComponent = () => (
  <section
    aria-label="Overview"
    className="grid gap-6 rounded-3xl border border-rose-200 bg-linear-to-br from-rose-50 via-rose-50/70 to-sky-50/60 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center dark:border-rose-900/60 dark:from-rose-950/30 dark:via-zinc-950 dark:to-sky-950/20"
  >
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm font-semibold tracking-widest text-rose-700 uppercase dark:text-rose-300">
        A Pulse demo
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        What this page observes about itself
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
        One Pulse observes this page through the browser adapter: a phase, an
        interaction, and a transition between known phases. The raw browser
        events sit beside it, so you can compare what the browser said with what
        Pulse committed.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => scrollToElement("state")}
          className={buttonStyles({ variant: "primary" })}
        >
          <Eye aria-hidden="true" size={16} weight="bold" />
          See the state
        </button>
        <button
          type="button"
          onClick={() => scrollToElement("timeline")}
          className={buttonStyles({ variant: "ghost" })}
        >
          <ClockCounterClockwise aria-hidden="true" size={16} weight="bold" />
          Open the timeline
        </button>
      </div>
    </div>
    <ol aria-label="How to use this page" className="flex flex-col gap-2.5">
      <HeroStep
        number={1}
        title="Switch tabs and windows"
        description="Another tab makes the page background; another window keeps it foreground with interaction unavailable."
      />
      <HeroStep
        number={2}
        title="Navigate away and back"
        description="Open the second page and go back. A back/forward cache restore keeps the document token; a fresh load does not."
      />
      <HeroStep
        number={3}
        title="Export the trace"
        description="Record the raw signals, run an exercise and download the timeline with your browser's details."
      />
    </ol>
  </section>
);
