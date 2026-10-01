<script lang="ts">
  import { iconFor } from "$lib/icons";

  let { name, class: className = "" }: { name: string | null | undefined; class?: string } =
    $props();

  const Glyph = $derived(iconFor(name));
</script>

{#if Glyph}
  <Glyph class={className} aria-hidden="true" strokeWidth={1.25} />
{/if}
