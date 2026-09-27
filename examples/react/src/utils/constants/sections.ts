import type { Section } from "src/types/Section";
import type { SectionId } from "src/types/SectionId";

export const SECTIONS: Record<SectionId, Section> = {
  state: { number: 1, title: "Two fields, never a guess", label: "State" },
  refresh: {
    number: 2,
    title: "Refresh stale data on return",
    label: "Refresh",
  },
  timeline: { number: 3, title: "Watch it happen", label: "Timeline" },
  simulation: {
    number: 4,
    title: "Simulate what the browser will not do",
    label: "Simulation",
  },
};

export const SECTION_IDS: SectionId[] = [
  "state",
  "refresh",
  "timeline",
  "simulation",
];
