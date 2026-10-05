<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import { actionHref } from "$lib/action-url";
  import Field from "$lib/components/Field.svelte";
  import TurnstileWidget from "$lib/components/TurnstileWidget.svelte";
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let name = $state("");
  let email = $state("");
  let phone = $state("");
  let message = $state("");
  let submitting = $state(false);

  let signupEmail = $state("");
  let firstName = $state("");
  let lastName = $state("");
  let subscribing = $state(false);
  let signupEngaged = $state(false);

  const contactResult = $derived(form?.form === "contact" ? form : null);
  const signupResult = $derived(form?.form === "subscribe" ? form : null);

  let contactLatched = $state(false);
  let signupLatched = $state(false);
  $effect(() => {
    if (contactResult?.success) contactLatched = true;
    if (signupResult?.success) signupLatched = true;
  });
  const contactSent = $derived(!!contactResult?.success || contactLatched);
  const subscribed = $derived(!!signupResult?.success || signupLatched);

  const contactTs = untrack(() => data.formTs);
  const signupTs = untrack(() => data.formTs);

  /** Focused when the confirmation replaces the form. Without this, focus is
   *  left on a submit button that no longer exists, which drops it to <body> —
   *  a keyboard or screen-reader user is then sitting at the top of the
   *  document with no idea the request went through. */
  let confirmationEl = $state<HTMLElement | null>(null);
  $effect(() => {
    if (contactResult?.success) confirmationEl?.focus();
  });

  let signupConfirmationEl = $state<HTMLElement | null>(null);
  $effect(() => {
    if (signupResult?.success) signupConfirmationEl?.focus();
  });
</script>

{#if data.page}
  <SliceZone slices={data.page.data.slices} {components} context={data.context} />
{:else}
  <header class="w-full bg-gold-deep text-white">
    <div class="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <h1 class="text-5xl leading-tight font-light md:text-7xl">Contact Us</h1>
    </div>
  </header>
{/if}

<section class="w-full bg-light text-primary" aria-label="Contact form">
  <div class="mx-auto max-w-5xl px-6 pb-20">
    <div class="max-w-3xl space-y-8">
      <!-- One-and-done: on success the form unmounts. To allow another submission, keep the form mounted and reset the field state instead. -->
      {#if contactSent}
        <!-- tabindex=-1 so the effect above can move focus here; role=status
         announces it to assistive tech without stealing the reading position
         from someone who is already elsewhere on the page. -->
        <p
          bind:this={confirmationEl}
          role="status"
          tabindex="-1"
          class="border-2 border-green-600 bg-green-50 rounded p-4 text-green-900"
        >
          Thanks — your message is on its way. We'll be in touch soon.
        </p>
      {:else}
        <form
          method="POST"
          action={actionHref(page.url.search, "contact")}
          aria-label="Send us a message"
          class="space-y-4"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              await update();
              submitting = false;
            };
          }}
        >
          <!-- Single top-level error; for multi-field validation summaries see $lib/components/Form.svelte. -->
          {#if contactResult?.error}
            <p role="alert" class="border-2 border-red-600 bg-red-50 rounded p-4 text-red-900">
              {contactResult.error}
            </p>
          {/if}

          <!-- Anti-bot: per-request timing token + a hidden honeypot. Naive bots
           fill the honeypot; a too-fast fill is caught by the timing screen. -->
          <input type="hidden" name="ts" value={contactTs} />
          <input
            type="text"
            name="bot-field"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
            class="hidden"
          />

          <Field name="name" label="Name" autocomplete="name" required bind:value={name} />
          <Field
            name="email"
            label="Email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
          />
          <Field name="phone" label="Phone" type="tel" autocomplete="tel" bind:value={phone} />
          <Field
            name="message"
            label="Message"
            type="textarea"
            maxlength={5000}
            required
            bind:value={message}
          />

          <!-- Optional Cloudflare Turnstile (dark until PUBLIC_TURNSTILE_SITE_KEY is
           set — the component gates itself). Mounted inside the form so the widget
           injects a hidden `cf-turnstile-response` input here, which
           createIngestAction reads and forwards. Verification is central (the
           dashboard holds TURNSTILE_SECRET_KEY; sites carry only the public key). -->
          <TurnstileWidget />

          <!-- The last click in the flow, and it used to acknowledge the wait by
           DIMMING itself: `disabled:opacity-60` composited the label against a
           faded button at the exact moment someone is waiting on it and
           deciding whether to click again — the least readable state on the
           page, during the only wait it has. The sending state now keeps label
           and background at full strength and says so instead: `aria-busy` so
           the change reaches a screen reader rather than only the accessible
           name silently mutating, and a wait cursor for everyone else. -->
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            class="eyebrow rounded bg-gold-deep px-6 py-3 text-white transition-colors hover:bg-dark disabled:cursor-wait"
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </form>
      {/if}
    </div>
  </div>
</section>

<section id="newsletter" class="w-full bg-light text-primary" aria-labelledby="newsletter-heading">
  <div class="mx-auto max-w-5xl px-6 pb-20">
    <div class="max-w-3xl space-y-6">
      <h2 id="newsletter-heading" class="text-3xl leading-tight font-light md:text-4xl">
        Mantis Monthly Newsletter
      </h2>
      <p>
        Interested in keeping up with Mantis? Join the mailing list for monthly newsletters on our
        seedling giveaways, gardening tips, and more.
      </p>
      {#if subscribed}
        <p
          bind:this={signupConfirmationEl}
          role="status"
          tabindex="-1"
          class="border-2 border-green-600 bg-green-50 rounded p-4 text-green-900"
        >
          Thanks — you're on the list.
        </p>
      {:else}
        <form
          method="POST"
          action={actionHref(page.url.search, "subscribe")}
          aria-labelledby="newsletter-heading"
          class="space-y-4"
          onfocusin={() => (signupEngaged = true)}
          use:enhance={() => {
            subscribing = true;
            return async ({ update }) => {
              await update();
              subscribing = false;
            };
          }}
        >
          {#if signupResult?.error}
            <p role="alert" class="border-2 border-red-600 bg-red-50 rounded p-4 text-red-900">
              {signupResult.error}
            </p>
          {/if}

          <input type="hidden" name="ts" value={signupTs} />
          <input
            type="text"
            name="bot-field"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
            class="hidden"
          />

          <Field
            name="email"
            label="Email"
            type="email"
            autocomplete="email"
            required
            bind:value={signupEmail}
          />
          <Field
            name="firstName"
            label="First name"
            autocomplete="given-name"
            bind:value={firstName}
          />
          <Field
            name="lastName"
            label="Last name"
            autocomplete="family-name"
            bind:value={lastName}
          />

          <TurnstileWidget active={signupEngaged} />

          <button
            type="submit"
            disabled={subscribing}
            aria-busy={subscribing}
            class="eyebrow rounded bg-gold-deep px-6 py-3 text-white transition-colors hover:bg-dark disabled:cursor-wait"
          >
            {subscribing ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      {/if}
    </div>
  </div>
</section>
