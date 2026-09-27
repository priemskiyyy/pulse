import type React from "react";

import type { LifecycleLab } from "example-shared/lab/types/LifecycleLab";
import { Footer } from "src/components/Footer/Footer";
import { Header } from "src/components/Header/Header";
import { Hero } from "src/components/Hero/Hero";
import { RefreshPanel } from "src/components/Refresh/RefreshPanel";
import { Section } from "src/components/Section/Section";
import { SimulationPanel } from "src/components/Simulation/SimulationPanel";
import { InstancePanel } from "src/components/State/InstancePanel";
import { StatePanel } from "src/components/State/StatePanel";
import { TimelinePanel } from "src/components/Timeline/TimelinePanel";

type ApplicationProps = { lab: LifecycleLab; documentToken: string };

export const Application: React.FunctionComponent<ApplicationProps> = ({
  lab,
  documentToken,
}) => (
  <>
    <Header pulse={lab.pulse} />
    <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6">
      <Hero />
      <Section
        id="state"
        hint="Switch to another tab and back: background, then foreground. Focus another window while this one stays visible: the phase stays foreground and interaction turns unavailable."
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <StatePanel pulse={lab.pulse} />
          <InstancePanel lab={lab} documentToken={documentToken} />
        </div>
      </Section>
      <Section
        id="refresh"
        hint="Stay in another tab for 30 seconds, then come back: one refresh runs. Turn on Fail the next refresh first, and the failure shows while the old data stays."
      >
        <RefreshPanel lab={lab} />
      </Section>
      <Section
        id="timeline"
        hint="Turn on Record raw signals, then open the second page and go back. A pageshow with persisted=true is a back/forward cache restore; persisted=false is a fresh load."
      >
        <TimelinePanel lab={lab} documentToken={documentToken} />
      </Section>
      <Section
        id="simulation"
        hint="Pick Inactive, then Background. The simulated Pulse commits both; the real one above stays where the browser put it."
      >
        <SimulationPanel lab={lab} />
      </Section>
    </main>
    <Footer />
  </>
);
