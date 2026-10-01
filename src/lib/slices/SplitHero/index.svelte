<script lang="ts">
  import SplitHero from "$lib/components/SplitHero.svelte";
  import type { Content } from "@prismicio/client";

  let { slice }: { slice: Content.SplitHeroSlice } = $props();
</script>

<SplitHero
  sliceType={slice.slice_type}
  variation={slice.variation}
  image={slice.primary.image}
  kicker={slice.primary.kicker}
  heading={slice.primary.heading}
  body={slice.primary.body}
  ctaLabel={slice.primary.cta_label}
  ctaLink={slice.primary.cta_link}
  tone={slice.primary.tone}
/>
