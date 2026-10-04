<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";

  let { slice }: { slice: Content.PageTitleSlice } = $props();

  const background = $derived(slice.primary.background ?? "white");
  const ground = $derived(
    (
      {
        white: "bg-white text-primary",
        light: "bg-light text-primary",
        "gold-deep": "bg-gold-deep text-white",
        dark: "bg-dark text-white",
      } as Record<string, string>
    )[background] ?? "bg-white text-primary",
  );
  const eyebrowTone = $derived(
    background === "gold-deep"
      ? "text-white"
      : background === "dark"
        ? "text-gold"
        : "text-gold-deep",
  );
  const display = $derived(slice.primary.heading_style === "display");
</script>

{#if isFilled.richText(slice.primary.heading)}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="w-full {ground}"
  >
    <div
      class="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 {display
        ? 'py-24 md:py-32'
        : 'py-20'}"
    >
      <div
        class={display ? "text-5xl leading-tight font-light md:text-7xl" : `eyebrow ${eyebrowTone}`}
      >
        <PrismicRichText field={slice.primary.heading} />
      </div>
      {#if isFilled.richText(slice.primary.body)}
        <div class="statement flex max-w-3xl flex-col gap-4">
          <PrismicRichText field={slice.primary.body} />
        </div>
      {/if}
    </div>
  </section>
{/if}
