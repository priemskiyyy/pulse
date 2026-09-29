<script lang="ts">
  import type { Pulse } from "@priemskiyyy/pulse";
  import PulseProvider from "./PulseProvider.svelte";
  import Status from "./Status.fixture.svelte";

  type Props = {
    pulse: Pulse;
  };

  const props: Props = $props();
</script>

<PulseProvider pulse={props.pulse}><Status /></PulseProvider>
