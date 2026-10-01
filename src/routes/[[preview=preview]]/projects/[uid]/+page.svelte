<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import SplitHero from "$lib/components/SplitHero.svelte";
  import IconRow from "$lib/components/IconRow.svelte";

  let { data } = $props();

  const project = $derived(data.project);
</script>

<SplitHero
  image={project.data.hero_image}
  kicker={project.data.kicker}
  heading={project.data.title}
  body={project.data.intro}
  tone="gold"
/>

{#if project.data.services.length > 0}
  {#snippet servicesHeading()}
    <h2>{project.data.services_heading || "Services provided"}</h2>
  {/snippet}
  <IconRow heading={servicesHeading} items={project.data.services} background="dark" />
{/if}

<SliceZone slices={project.data.slices} {components} context={data.context} />
