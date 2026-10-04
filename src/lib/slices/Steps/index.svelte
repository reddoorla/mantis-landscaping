<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import SiteLink from "$lib/components/SiteLink.svelte";
  import { siteHref } from "$lib/site-link";
  import { isFilled, type Content } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";

  let { slice }: { slice: Content.StepsSlice } = $props();

  const background = $derived(slice.primary.background ?? "gold-deep");
  const ground = $derived(
    (
      {
        "gold-deep": "bg-gold-deep text-white",
        gold: "bg-gold text-primary",
        light: "bg-light text-primary",
      } as Record<string, string>
    )[background] ?? "bg-gold-deep text-white",
  );
  const iconTone = $derived(background === "gold-deep" ? "text-white" : "text-primary");
  const buttonSkin = $derived(
    background === "gold-deep"
      ? "bg-white text-primary hover:bg-light"
      : background === "gold"
        ? "bg-dark text-white hover:bg-moss"
        : "bg-gold-deep text-white hover:bg-dark",
  );
  const hasHeading = $derived(isFilled.richText(slice.primary.heading));
  const steps = $derived((slice.primary.steps ?? []).filter((item) => !!item.title));
</script>

{#if steps.length > 0}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="w-full {ground}"
  >
    <div class="mx-auto max-w-6xl px-6 py-20">
      {#if hasHeading}
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
                fallbackAlt=""
                widths={cappedWidths(step.image)}
                sizes="(min-width: 768px) 360px, calc(100vw - 3rem)"
                loading="lazy"
                class="aspect-square w-full rounded-lg object-cover"
              />
            {:else if step.icon}
              <Icon name={step.icon} class="h-14 w-14 {iconTone}" />
            {/if}
            <svelte:element this={hasHeading ? "h3" : "h2"} class="eyebrow"
              >{step.title}</svelte:element
            >
            <div class="text-sm">
              <PrismicRichText field={step.body} />
            </div>
          </li>
        {/each}
      </ol>
      {#if slice.primary.cta_label && siteHref(slice.primary.cta_link)}
        <div class="mt-12 text-center">
          <SiteLink
            field={slice.primary.cta_link}
            class="eyebrow inline-block rounded px-6 py-3 transition-colors {buttonSkin}"
          >
            {slice.primary.cta_label} +
          </SiteLink>
        </div>
      {/if}
    </div>
  </section>
{/if}
