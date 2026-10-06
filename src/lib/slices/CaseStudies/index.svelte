<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content, type ImageField } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";
  import Slider from "$lib/components/Slider.svelte";
  import { SINGLE_PHOTO_SIZES } from "./sizes";
  import type { SliceContext } from "$lib/slice-context";

  let { slice, context = {} }: { slice: Content.CaseStudiesSlice; context?: SliceContext } =
    $props();

  const studies = $derived(
    (context.project?.data.case_studies ?? [])
      .filter((study) => !!study.title)
      .map((study) => {
        const photos = (study.photos ?? []).filter((entry) => isFilled.image(entry.photo));
        return { ...study, photos };
      }),
  );
  const hasHeading = $derived(isFilled.richText(slice.primary.heading));
</script>

{#snippet photo(field: ImageField | undefined)}
  {#if field}
    <PrismicImage
      {field}
      fallbackAlt=""
      widths={cappedWidths(field)}
      sizes={SINGLE_PHOTO_SIZES}
      loading="lazy"
      class="aspect-[4/3] h-full w-full object-cover"
    />
  {/if}
{/snippet}

{#if studies.length > 0}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="w-full bg-light"
  >
    <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
      {#if hasHeading}
        <div class="eyebrow text-center text-gold-deep">
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      {#each studies as study, i (i)}
        <article
          class="grid grid-cols-1 overflow-hidden rounded-lg bg-moss text-white md:grid-cols-5"
          aria-labelledby="case-study-{i}"
        >
          {#if study.photos.length > 0}
            <div class="relative min-w-0 md:col-span-3">
              {#if study.photos.length > 1}
                <Slider
                  itemCount={study.photos.length}
                  label="{study.title} photos"
                  mode="fade"
                  transitionClass="duration-500 ease-in-out"
                  navigationClass="!mt-0 py-2"
                  arrowPlacement="overlay"
                  dotClass="bg-white/60"
                  activeDotClass="bg-white"
                >
                  {#snippet children({ index })}
                    {@render photo(study.photos[index].photo)}
                  {/snippet}
                </Slider>
              {:else}
                <div role="region" aria-label="{study.title} photos">
                  {@render photo(study.photos[0]?.photo)}
                </div>
              {/if}
            </div>
          {/if}
          <div
            class="flex flex-col gap-4 p-8 {study.photos.length > 0
              ? 'md:col-span-2'
              : 'md:col-span-5'}"
          >
            {#if study.label}
              <p class="eyebrow">{study.label}</p>
            {/if}
            <svelte:element
              this={hasHeading ? "h3" : "h2"}
              id="case-study-{i}"
              class="text-3xl leading-tight font-light text-gold"
            >
              {study.title}
            </svelte:element>
            <div class="flex flex-col gap-3 text-sm">
              <PrismicRichText field={study.body} />
            </div>
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}
