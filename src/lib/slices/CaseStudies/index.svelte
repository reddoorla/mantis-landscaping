<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";
  import type { SliceContext } from "$lib/slice-context";

  let { slice, context = {} }: { slice: Content.CaseStudiesSlice; context?: SliceContext } =
    $props();

  const studies = $derived(
    (context.project?.data.case_studies ?? [])
      .filter((study) => !!study.title)
      .map((study) => ({
        ...study,
        photos: (study.photos ?? []).filter((entry) => isFilled.image(entry.photo)),
      })),
  );
  const hasHeading = $derived(isFilled.richText(slice.primary.heading));
</script>

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
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div
            class="scroll-strip flex snap-x snap-mandatory overflow-x-auto md:col-span-3"
            role="region"
            aria-label="{study.title} photos"
            tabindex={study.photos.length > 1 ? 0 : undefined}
          >
            <ul class="flex">
              {#each study.photos as entry, p (p)}
                <li class="w-[85vw] shrink-0 snap-start md:w-[36rem]">
                  <PrismicImage
                    field={entry.photo}
                    fallbackAlt=""
                    widths={cappedWidths(entry.photo)}
                    sizes="(min-width: 768px) 576px, 85vw"
                    loading="lazy"
                    class="aspect-[4/3] h-full w-full object-cover"
                  />
                </li>
              {/each}
            </ul>
          </div>
          <div class="flex flex-col gap-4 p-8 md:col-span-2">
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
