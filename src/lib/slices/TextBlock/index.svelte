<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import SiteLink from "$lib/components/SiteLink.svelte";
  import { isFilled, type Content } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";

  let { slice }: { slice: Content.TextBlockSlice } = $props();

  const background = $derived(slice.primary.background ?? "dark");
  const hasPhoto = $derived(
    background === "image" && isFilled.image(slice.primary.background_image),
  );
  const onDark = $derived(background !== "light" && background !== "white");
  const ground = $derived(
    (
      {
        dark: "bg-dark text-white",
        light: "bg-light text-primary",
        white: "bg-white text-primary",
        "gold-deep": "bg-gold-deep text-white",
        image: "bg-dark text-white",
      } as Record<string, string>
    )[background] ?? "bg-dark text-white",
  );
  const eyebrowTone = $derived(
    background === "gold-deep" || background === "image"
      ? "text-white"
      : onDark
        ? "text-gold"
        : "text-gold-deep",
  );
  const display = $derived(slice.primary.heading_style === "display");
  const centered = $derived(slice.primary.align === "center");
  const statement = $derived(slice.primary.size === "statement");
  const buttons = $derived(
    (slice.primary.buttons ?? []).filter(
      (item) => !!item.button_label && isFilled.link(item.button_link),
    ),
  );
  const buttonSkin = $derived(
    background === "gold-deep" || background === "image"
      ? "bg-white text-primary hover:bg-light"
      : onDark
        ? "bg-gold-deep text-white hover:bg-gold hover:text-primary"
        : "bg-gold-deep text-white hover:bg-dark",
  );
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="relative isolate w-full overflow-hidden {ground}"
>
  {#if hasPhoto}
    <PrismicImage
      field={slice.primary.background_image}
      alt=""
      widths={cappedWidths(slice.primary.background_image)}
      sizes="100vw"
      loading="lazy"
      class="absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div class="absolute inset-0 -z-10 bg-dark/70" aria-hidden="true"></div>
  {/if}
  <div
    class="mx-auto flex max-w-5xl flex-col gap-6 px-6 {display
      ? 'py-24 md:py-32'
      : 'py-20'} {centered ? 'items-center text-center' : 'items-start'} {hasPhoto
      ? 'min-h-[28rem] justify-center'
      : ''}"
  >
    {#if isFilled.richText(slice.primary.heading)}
      <div
        class={display ? "text-5xl leading-tight font-light md:text-7xl" : `eyebrow ${eyebrowTone}`}
      >
        <PrismicRichText field={slice.primary.heading} />
      </div>
    {/if}
    {#if isFilled.richText(slice.primary.body)}
      <div
        class="flex max-w-3xl flex-col gap-4 {statement ? 'statement' : ''} {hasPhoto
          ? 'statement'
          : ''}"
      >
        <PrismicRichText field={slice.primary.body} />
      </div>
    {/if}
    {#if buttons.length > 0}
      <div class="flex flex-wrap gap-4 {centered ? 'justify-center' : ''}">
        {#each buttons as button, i (i)}
          <SiteLink
            field={button.button_link}
            class="eyebrow inline-block rounded px-5 py-3 transition-colors {buttonSkin}"
          >
            {button.button_label} +
          </SiteLink>
        {/each}
      </div>
    {/if}
  </div>
</section>
