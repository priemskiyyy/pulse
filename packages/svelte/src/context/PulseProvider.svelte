<!--
@component Publishes one Pulse to the components below. It only publishes: it
never starts or disposes the Pulse, so start it at bootstrap.
@example `<PulseProvider {pulse}><Application /></PulseProvider>`
-->
<script lang="ts">
  import type { Pulse } from "@priemskiyyy/pulse";
  import { setContext } from "svelte";
  import type { PulseProviderProps } from "../types/PulseProviderProps.js";
  import type { ReadableValue } from "../types/ReadableValue.js";
  import { PULSE_CONTEXT } from "./PulseContext.js";

  const props: PulseProviderProps = $props();

  setContext(PULSE_CONTEXT, {
    get current() {
      return props.pulse;
    },
  } satisfies ReadableValue<Pulse>);
</script>

{#if props.children}
  {@render props.children()}
{/if}
