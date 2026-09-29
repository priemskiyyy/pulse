<script lang="ts">
  import { useLifecycle } from "../utilities/useLifecycle.svelte.js";

  const lifecycle = useLifecycle();
</script>

<span>{lifecycle.current.phase}/{lifecycle.current.interaction}</span>
