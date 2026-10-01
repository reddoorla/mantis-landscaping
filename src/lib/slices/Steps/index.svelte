<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
  import { PrismicImage, PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";

  let { slice }: { slice: Content.StepsSlice } = $props();

  const onGold = $derived((slice.primary.background ?? "gold") === "gold");
  const steps = $derived(slice.items.filter((item) => !!item.title));
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="w-full {onGold ? 'bg-gold-deep text-white' : 'bg-light text-primary'}"
>
  <div class="mx-auto max-w-6xl px-6 py-20">
    {#if isFilled.richText(slice.primary.heading)}
      <div class="eyebrow mb-12 text-center text-base md:text-xl">
        <PrismicRichText field={slice.primary.heading} />
      </div>
    {/if}
    <ol class="grid grid-cols-1 gap-12 md:auto-cols-fr md:grid-flow-col">
      {#each steps as step, i (i)}
        <li class="flex flex-col gap-4">
          {#if isFilled.image(step.image)}
            <PrismicImage
              field={step.image}
              widths={cappedWidths(step.image)}
              sizes="(min-width: 768px) 360px, calc(100vw - 3rem)"
              loading="lazy"
              class="aspect-square w-full rounded-lg object-cover"
            />
          {:else if step.icon}
            <Icon name={step.icon} class="h-14 w-14 {onGold ? 'text-white' : 'text-gold-deep'}" />
          {/if}
          <h3 class="eyebrow">{step.title}</h3>
          <div class="text-sm">
            <PrismicRichText field={step.body} />
          </div>
        </li>
      {/each}
    </ol>
    {#if slice.primary.cta_label && isFilled.link(slice.primary.cta_link)}
      <div class="mt-12 text-center">
        <PrismicLink
          field={slice.primary.cta_link}
          class="eyebrow inline-block rounded bg-white px-6 py-3 text-primary hover:bg-light"
        >
          {slice.primary.cta_label} +
        </PrismicLink>
      </div>
    {/if}
  </div>
</section>
