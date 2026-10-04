<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { asText, isFilled, type Content } from "@prismicio/client";
  import { cappedWidths } from "@reddoorla/maintenance/images";
  import type { SliceContext } from "$lib/slice-context";

  let { slice, context = {} }: { slice: Content.ProjectListSlice; context?: SliceContext } =
    $props();

  const projects = $derived(context.projects ?? []);
  const hasHeading = $derived(isFilled.richText(slice.primary.heading));
</script>

{#if projects.length > 0}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="w-full bg-white"
  >
    <div class="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
      {#if hasHeading}
        <div class="eyebrow">
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      <ul class="flex flex-col gap-8">
        {#each projects as project (project.id)}
          {@const image = isFilled.image(project.data.card_image)
            ? project.data.card_image
            : project.data.hero_image}
          <li>
            <a
              href="/projects/{project.uid}"
              class="group relative isolate flex aspect-[16/9] w-full items-end overflow-hidden bg-dark p-6 text-white md:items-center md:p-10"
            >
              {#if isFilled.image(image)}
                <PrismicImage
                  field={image}
                  alt=""
                  widths={cappedWidths(image)}
                  sizes="(min-width: 1152px) 1104px, calc(100vw - 3rem)"
                  loading="lazy"
                  class="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              {/if}
              <span
                class="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 to-black/60"
                aria-hidden="true"
              ></span>
              <span class="flex flex-col gap-2">
                {#if project.data.kicker}
                  <span class="eyebrow">{project.data.kicker}</span>
                {/if}
                <svelte:element
                  this={hasHeading ? "h3" : "h2"}
                  class="text-4xl font-light md:text-7xl"
                >
                  {asText(project.data.title)}
                </svelte:element>
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}
