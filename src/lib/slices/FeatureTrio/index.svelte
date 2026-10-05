<script lang="ts">
  import IconRow from "$lib/components/IconRow.svelte";
  import { PrismicRichText } from "@prismicio/svelte";
  import { asText, isFilled, type Content } from "@prismicio/client";

  let { slice }: { slice: Content.FeatureTrioSlice } = $props();
</script>

{#snippet heading()}
  <PrismicRichText field={slice.primary.heading} />
{/snippet}

<IconRow
  sliceType={slice.slice_type}
  variation={slice.variation}
  heading={isFilled.richText(slice.primary.heading) ? heading : undefined}
  items={slice.primary.features ?? []}
  background={slice.primary.background}
  label={isFilled.richText(slice.primary.heading) ? asText(slice.primary.heading) : undefined}
  carouselBelow={slice.primary.carousel_below}
  autoplay={slice.primary.autoplay}
/>
