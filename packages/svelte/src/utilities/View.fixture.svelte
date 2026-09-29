<script lang="ts">
  import { untrack } from "svelte";

  type Props = {
    read: () => void;
  };

  const props: Props = $props();

  // Read once on purpose: the utilities run while the component initializes.
  untrack(() => props.read)();
</script>
