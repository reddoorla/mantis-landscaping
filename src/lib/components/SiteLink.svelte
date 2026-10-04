<script lang="ts">
  import { asLinkAttrs, type LinkField } from "@prismicio/client";
  import type { Snippet } from "svelte";
  import { linkResolver } from "$lib/prismicio";

  let {
    field,
    class: className = "",
    children,
  }: { field: LinkField | null | undefined; class?: string; children: Snippet } = $props();

  const attrs = $derived(asLinkAttrs(field, { linkResolver }));
</script>

<a href={attrs.href || ""} target={attrs.target} rel={attrs.rel} class={className}>
  {@render children()}
</a>
