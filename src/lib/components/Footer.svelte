<script lang="ts">
  import BrandIcon from "./BrandIcon.svelte";
  import type { FooterSocial, FooterItem, FooterImage, FooterColumn } from "$lib/site-config";

  interface Props {
    /** Optional per-route override of the `$lib/site-config.json` footer (no
     * route in the bare template supplies this). When present they take
     * precedence over the site-config socials/text chrome. */
    columns?: FooterColumn[];
    /** Social links from the site config (empty → none rendered). */
    socials?: FooterSocial[];
    /** The WHOLE rights line, verbatim. Use this only when the line is not of
     * the form "© <year> <owner>" — it freezes whatever year it contains, and
     * a copyright line that silently goes stale every January is worse than a
     * generic one. Prefer `owner`. */
    text?: string;
    /** Who holds the copyright, e.g. "Roalson Interests". The year is supplied
     * at render, so it cannot go stale. This is the prop a site should set. */
    owner?: string;
  }

  // Placeholder styling — restyle per project. `columns` (a per-route
  // override) wins when a route supplies it; otherwise the site-config
  // socials + rights line render (the fleet default chrome).
  let { columns, socials = [], text, owner }: Props = $props();

  const isImage = (i: FooterItem): i is FooterImage => "image" in i;

  // Only http(s) links open in a new tab; tel:/mailto: stay same-tab.
  // Consistent shape — Svelte drops undefined attributes — so target/rel
  // can't drift between the text- and image-link branches.
  const isExternal = (href: string) => /^https?:\/\//i.test(href);
  const linkAttrs = (href: string) => ({
    href,
    target: isExternal(href) ? "_blank" : undefined,
    rel: isExternal(href) ? "noopener noreferrer" : undefined,
  });

  // Social network id (from site-config) → the BrandIcon glyph + an
  // accessible label. Networks BrandIcon can't draw are dropped rather than
  // rendered as an empty link.
  const NETWORK: Record<string, { platform: string; label: string }> = {
    facebook: { platform: "facebook", label: "Facebook" },
    twitter: { platform: "twitter", label: "Twitter" }, // BrandIcon aliases → X
    x: { platform: "x", label: "X" },
    instagram: { platform: "instagram", label: "Instagram" },
    linkedin: { platform: "linkedin", label: "LinkedIn" },
    "linkedin-company": { platform: "linkedin", label: "LinkedIn" },
    pinterest: { platform: "pinterest", label: "Pinterest" },
    youtube: { platform: "youtube", label: "YouTube" },
    reddit: { platform: "reddit", label: "Reddit" },
  };

  const known = $derived(
    socials
      // `Object.hasOwn` guard: a network literally named "toString" or
      // "constructor" would otherwise resolve to an inherited Object.prototype
      // member (truthy) and slip past the filter, then crash on `.platform`.
      .map((s) => ({
        ...s,
        meta: Object.hasOwn(NETWORK, s.network) ? NETWORK[s.network] : undefined,
      }))
      .filter((s): s is typeof s & { meta: { platform: string; label: string } } => !!s.meta),
  );
</script>

{#snippet logo(img: FooterImage["image"])}
  <img
    src={img.url}
    alt={img.alt ?? ""}
    width={img.width}
    height={img.height}
    loading="lazy"
    style={img.maxWidth ? `max-width:${img.maxWidth}` : undefined}
  />
{/snippet}

<footer class="mt-auto w-full {columns?.length ? 'bg-footer px-[4%] py-10' : 'px-8 py-12'}">
  {#if columns?.length}
    <div class="mx-auto grid max-w-[1280px] grid-cols-1 min-[601px]:grid-cols-2">
      {#each columns as col, colIndex (colIndex)}
        <div class="flex flex-col items-start">
          {#each col.items as item, itemIndex (itemIndex)}
            {#if isImage(item)}
              {#if item.href}
                <a {...linkAttrs(item.href)} class="block p-[10px]">{@render logo(item.image)}</a>
              {:else}
                <div class="p-[10px]">{@render logo(item.image)}</div>
              {/if}
            {:else if item.href}
              <a
                {...linkAttrs(item.href)}
                class="block p-[10px] leading-[normal] font-semibold text-olive">{item.text}</a
              >
            {:else}
              <p class="p-[10px] leading-[normal] font-semibold text-olive">{item.text}</p>
            {/if}
          {/each}
          {#if colIndex === columns.length - 1}
            {#each known as social, i (i)}
              {#if social.href}
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.meta.label}
                  class="inline-flex p-[10px] text-olive hover:opacity-70"
                >
                  <BrandIcon platform={social.meta.platform} class="h-8 w-8" />
                </a>
              {/if}
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
      {#if known.length > 0}
        <ul class="flex items-center gap-4">
          <!-- Keyed by index: a network can repeat across footer blocks, and a
               duplicate key throws each_key_duplicate at hydration. -->
          {#each known as social, i (i)}
            <li>
              {#if social.href}
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.meta.label}
                  class="inline-flex min-h-11 min-w-11 items-center justify-center hover:opacity-70"
                >
                  <BrandIcon platform={social.meta.platform} class="h-5 w-5" />
                </a>
              {:else}
                <!-- No recovered url — render the glyph, but not as a dead link. -->
                <span
                  class="inline-flex min-h-11 min-w-11 items-center justify-center"
                  aria-label={social.meta.label}
                  role="img"
                >
                  <BrandIcon platform={social.meta.platform} class="h-5 w-5" />
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
      <p class="text-sm text-secondary">
        {text ?? `© ${new Date().getFullYear()} ${owner ?? "Company Name"}`}
      </p>
    </div>
  {/if}
</footer>
