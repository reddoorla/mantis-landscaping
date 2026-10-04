<script lang="ts">
  import { asLinkAttrs, type LinkField } from "@prismicio/client";
  import type { Snippet } from "svelte";
  import { linkResolver } from "$lib/prismicio";

  let {
    field,
    class: className = "",
    as = "span",
    children,
  }: {
    field: LinkField | null | undefined;
    class?: string;
    as?: "span" | "div";
    children: Snippet;
  } = $props();

  const attrs = $derived(asLinkAttrs(field, { linkResolver }));
</script>

{#if attrs.href}
  <a href={attrs.href} target={attrs.target} rel={attrs.rel} class={className}>
    {@render children()}
  </a>
{:else}
  <svelte:element this={as} class={className}>
    {@render children()}
  </svelte:element>
{/if}
