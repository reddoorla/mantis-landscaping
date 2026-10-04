<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
  import { PrismicRichText } from "@prismicio/svelte";
  import SiteLink from "$lib/components/SiteLink.svelte";
  import { siteHref } from "$lib/site-link";
  import { isFilled, type Content } from "@prismicio/client";

  let { slice }: { slice: Content.ServiceCardsSlice } = $props();

  const cards = $derived((slice.primary.cards ?? []).filter((item) => !!item.title));
</script>

{#if cards.length > 0}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="w-full bg-dark text-white"
  >
    <div class="mx-auto max-w-6xl px-6 pb-20 text-center">
      {#if isFilled.richText(slice.primary.heading)}
        <div class="eyebrow mb-8 text-gold">
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      <ul
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none"
      >
        {#each cards as card, i (i)}
          <li>
            {#if siteHref(card.link)}
              <SiteLink
                field={card.link}
                class="group flex aspect-[4/5] max-h-72 w-full flex-col items-center justify-center gap-6 rounded-lg bg-moss p-6 transition-colors hover:bg-gold-deep focus-visible:bg-gold-deep"
              >
                <Icon
                  name={card.icon}
                  class="h-16 w-16 text-accent group-hover:text-white group-focus-visible:text-white"
                />
                <span class="eyebrow">{card.title}</span>
              </SiteLink>
            {:else}
              <div
                class="flex aspect-[4/5] max-h-72 w-full flex-col items-center justify-center gap-6 rounded-lg bg-moss p-6"
              >
                <Icon name={card.icon} class="h-16 w-16 text-accent" />
                <span class="eyebrow">{card.title}</span>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}
