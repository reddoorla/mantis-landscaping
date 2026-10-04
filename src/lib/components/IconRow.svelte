<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";

  let {
    heading,
    items,
    background = "dark",
    sliceType,
    variation,
  }: {
    heading?: import("svelte").Snippet;
    items: { icon?: string | null; label?: string | null }[];
    background?: string | null;
    sliceType?: string;
    variation?: string;
  } = $props();

  const ground = $derived(
    (
      {
        "gold-deep": "bg-gold-deep text-white",
        dark: "bg-dark text-white",
        moss: "bg-moss text-white",
      } as Record<string, string>
    )[background ?? "gold-deep"] ?? "bg-gold-deep text-white",
  );
  const onGold = $derived(background === "gold-deep");
  const headingTone = $derived(onGold ? "text-white" : "text-gold");
  const labelled = $derived(items.filter((item) => !!item.label));
  const anyIcon = $derived(labelled.some((item) => !!item.icon));
</script>

{#if labelled.length > 0}
  <section data-slice-type={sliceType} data-slice-variation={variation} class="w-full {ground}">
    <div class="mx-auto max-w-6xl px-6 py-14 text-center">
      {#if heading}
        <div class="eyebrow mb-10 {headingTone}">{@render heading()}</div>
      {/if}
      <ul
        class="grid grid-cols-2 gap-x-6 gap-y-10 md:auto-cols-fr md:grid-flow-col md:grid-cols-none"
      >
        {#each labelled as item, i (i)}
          {#if item.label}
            <li class="flex flex-col items-center gap-4">
              {#if item.icon}
                <Icon name={item.icon} class="h-14 w-14 {onGold ? 'text-white' : 'text-accent'}" />
              {/if}
              <span class={anyIcon ? "eyebrow" : "text-xl md:text-2xl"}>{item.label}</span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
  </section>
{/if}
