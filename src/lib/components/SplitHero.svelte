<script lang="ts">
  import { PrismicImage, PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type ImageField, type LinkField, type RichTextField } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";

  let {
    image,
    kicker,
    heading,
    body,
    ctaLabel,
    ctaLink,
    tone = "dark",
    sliceType,
    variation,
  }: {
    image: ImageField;
    kicker?: string | null;
    heading: RichTextField;
    body?: RichTextField;
    ctaLabel?: string | null;
    ctaLink?: LinkField;
    tone?: string | null;
    sliceType?: string;
    variation?: string;
  } = $props();

  const panel = $derived(tone === "gold" ? "bg-gold-deep" : "bg-dark");
  const accent = $derived(tone === "gold" ? "text-white" : "text-gold");
  const big = $derived(tone === "gold");
</script>

<section
  data-slice-type={sliceType}
  data-slice-variation={variation}
  class="grid w-full md:grid-cols-2"
>
  <div class="relative min-h-80 md:min-h-[36rem]">
    {#if isFilled.image(image)}
      <PrismicImage
        field={image}
        widths={cappedWidths(image)}
        sizes="(min-width: 768px) 50vw, 100vw"
        fetchpriority="high"
        class="absolute inset-0 h-full w-full object-cover"
      />
    {/if}
  </div>
  <div class="flex flex-col justify-center gap-6 px-6 py-16 text-white md:px-12 lg:px-16 {panel}">
    {#if kicker}
      <p class="eyebrow">{kicker}</p>
    {/if}
    <div
      class="split-hero-heading font-light {big
        ? 'text-5xl leading-tight lg:text-7xl'
        : 'text-3xl leading-snug lg:text-4xl'}"
    >
      <PrismicRichText field={heading} />
    </div>
    {#if body && isFilled.richText(body)}
      <div class="max-w-md text-lg">
        <PrismicRichText field={body} />
      </div>
    {/if}
    {#if ctaLabel && ctaLink && isFilled.link(ctaLink)}
      <PrismicLink field={ctaLink} class="eyebrow inline-block py-2 {accent} hover:underline">
        {ctaLabel} +
      </PrismicLink>
    {/if}
  </div>
</section>
