import type { TimelineEntry } from "example-shared/lab/types/TimelineEntry";

type ExportTraceOptions = { documentToken: string; entries: TimelineEntry[] };

// Downloads the timeline with what identifies the run, so an exercise can be reported.
export const exportTrace = ({ documentToken, entries }: ExportTraceOptions) => {
  const trace = {
    documentToken,
    userAgent: navigator.userAgent,
    exportedAt: new Date().toISOString(),
    entries: [...entries].reverse(),
  };

  const link = document.createElement("a");

  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" }),
  );
  link.download = "pulse-trace.json";
  link.click();
  URL.revokeObjectURL(link.href);
};
