<script lang="ts">
  import { setPulseContext } from "src/svelte/setPulseContext";
  import type { Pulse } from "src/utils/Pulse";

  const { pulse, read }: { pulse?: Pulse; read: () => void } = $props();

  // Runs once while the component initializes, where Svelte allows context.
  if (pulse !== undefined) {
    setPulseContext(pulse);
  }

  read();
</script>
