<script lang="ts">
  import Icon from "$lib/components/Icon.svelte";
  import Slider from "$lib/components/Slider.svelte";

  let {
    heading,
    items,
    background = "dark",
    sliceType,
    variation,
    carouselBelow = null,
    autoplay = 0,
    label,
  }: {
    heading?: import("svelte").Snippet;
    items: { icon?: string | null; label?: string | null }[];
    background?: string | null;
    sliceType?: string;
    variation?: string;
    carouselBelow?: "900" | "600" | null;
    autoplay?: number | null;
    label?: string;
  } = $props();

  const GRID_FROM: Record<string, string> = {
    "900": "[@container(width<=900px)]:hidden",
    "600": "[@container(width<=600px)]:hidden",
  };
  const CAROUSEL_UNTIL: Record<string, string> = {
    "900": "[@container(width>900px)]:hidden",
    "600": "[@container(width>600px)]:hidden",
  };
  const FADE: Record<string, string> = {
    "900": "duration-[250ms] ease-in-out",
    "600": "duration-500 ease-in-out",
  };

  const ground = $derived(
    (
      {
        "gold-deep": "bg-gold-deep text-white",
        dark: "bg-dark text-white",
        moss: "bg-moss text-white",
      } as Record<string, string>
    )[background ?? "gold-deep"] ?? "bg-gold-deep text-white",
  );
  const onGold = $derived(background === "gold-deep");
  const headingTone = $derived(onGold ? "text-white" : "text-gold");
  const labelled = $derived(items.filter((item) => !!item.label));
  const anyIcon = $derived(labelled.some((item) => !!item.icon));
  const breakpoint = $derived(
    carouselBelow && Object.hasOwn(GRID_FROM, carouselBelow) ? carouselBelow : null,
  );
  const carouselLabel = $derived(label || labelled.map((item) => item.label).join(", "));
</script>

{#snippet feature(item: { icon?: string | null; label?: string | null })}
  {#if item.icon}
    <Icon name={item.icon} class="h-14 w-14 {onGold ? 'text-white' : 'text-accent'}" />
  {/if}
  <span class={anyIcon ? "eyebrow" : "text-xl md:text-2xl"}>{item.label}</span>
{/snippet}

{#if labelled.length > 0}
  <section data-slice-type={sliceType} data-slice-variation={variation} class="w-full {ground}">
    <div class="mx-auto max-w-6xl px-6 py-14 text-center {breakpoint ? '@container' : ''}">
      {#if heading}
        <div class="eyebrow mb-10 {headingTone}">{@render heading()}</div>
      {/if}
      <ul
        class="grid grid-cols-2 gap-x-6 gap-y-10 md:auto-cols-fr md:grid-flow-col md:grid-cols-none {breakpoint
          ? GRID_FROM[breakpoint]
          : ''}"
      >
        {#each labelled as item, i (i)}
          <li class="flex flex-col items-center gap-4">
            {@render feature(item)}
          </li>
        {/each}
      </ul>
      {#if breakpoint}
        <div class={CAROUSEL_UNTIL[breakpoint]} data-carousel-below={breakpoint}>
          <Slider
            itemCount={labelled.length}
            label={carouselLabel}
            mode="fade"
            showArrows={false}
            autoplay={autoplay ?? 0}
            transitionClass={FADE[breakpoint]}
            pauseClass="text-white hover:bg-white/10"
            dotClass="bg-[#ededed]"
            activeDotClass="bg-white"
          >
            {#snippet children({ index })}
              <div class="flex flex-col items-center gap-4">
                {@render feature(labelled[index])}
              </div>
            {/snippet}
          </Slider>
        </div>
      {/if}
    </div>
  </section>
{/if}
