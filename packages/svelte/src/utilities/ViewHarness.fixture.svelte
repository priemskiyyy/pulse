<script lang="ts">
  import type { Pulse } from "@priemskiyyy/pulse";
  import PulseProvider from "../context/PulseProvider.svelte";
  import View from "./View.fixture.svelte";

  type Props = {
    pulse: Pulse;
    read: () => void;
  };

  const props: Props = $props();
</script>

<PulseProvider pulse={props.pulse}><View read={props.read} /></PulseProvider>
