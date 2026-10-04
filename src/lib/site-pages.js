// The page assemblies for this site — the SINGLE source of truth for both
// consumers: scripts/seed/seed.mjs, which publishes them through the Prismic
// Migration API, and src/routes/dev/match/[uid], the local matching surface.
// Because both read from here, any fix made to pass a gate is a fix to what
// ships.
//
// THE MIGRATION API DROPS SILENTLY. It validates against the slice models
// registered in Prismic and discards every field the model does not declare —
// HTTP 200, no warning. src/lib/site-pages.test.ts is the mechanical check;
// run it before every seed.
//
// PURE by contract: no node:*, no fetch, no token, no side effects at import,
// so Vite can bundle it into the dev route and node can import it into the seed.
//
// Copy is the Blux site's, verbatim (matching/spec/capture/pages). The alt
// text and meta descriptions are new (OD 62c); the client signs them off.

export const lang = "en-us";

/** Alt text for every photo the pages use, keyed by the Blux original's file
 *  name (matching/spec/capture/manifest.json). */
/** @type {Record<string, string>} */
export const ALT = {
  "33aa34a6-890c-4faf-b2e8-737a265b4b6f": "Close-up of sunlit mint leaves",
  "054058c4-e73e-4803-9618-a453f966f45d":
    "Artichokes and cardoons growing in front of a green wall",
  "0e69c0a8-242e-49e1-af17-92d648ec7537":
    "A white rooftop terrace with built-in planters, a stone-topped bar and a potted palm",
  "0f2a5cf3-65cb-49c6-804b-e6a639738e84":
    "Orange California poppies in front of red-hot poker flowers",
  "10b6ae09-5894-403e-83aa-f7818aaadd80":
    "Young trees in a bed of white gravel behind an office's glass wall",
  "1aa68442-3422-417b-b4a2-abdc6130f1b8":
    "Red phormium and blue succulents in a rooftop planter overlooking the hills",
  "22635d1f-c4a8-4441-b466-7d31f937379d":
    "Ornamental grasses planted along a pale paved walkway under an office overhang",
  "2554f84c-a613-4364-9149-11072f63267f": "A gardener tending long rows of crops on an urban farm",
  "26b082b4-377c-4b83-8747-288afd38d385":
    "A courtyard deck with white benches and bright orange, green and red seats",
  "28bb9fce-2762-42f0-84f7-8045cf4565d3":
    "A rooftop with an outdoor kitchen, chimney flues and planters along the edge",
  "28e49249-987c-41e7-b7d2-461fba6f37bc": "Young vegetables in raised wooden beds under a rainbow",
  "2c52b1dd-80b1-46a1-ba4c-4ff83d075d18":
    "A front yard of drought-tolerant plants and mulch behind a new wooden fence with a Mantis sign",
  "2e0901bc-a4c2-4e7f-8015-17917da00a01":
    "A lemon tree above a garden of flowering perennials and red bromeliads",
  "2ee8d4fc-d8d6-4b84-ad6d-5a30644ded29":
    "An office lobby at night with a bed of white gravel, boulders and low planters",
  "33e8356e-82be-40f8-8346-0b3400424f92": "Rosemary in front of a park lawn and tall palm trees",
  "34d91322-5f9f-4099-b156-41fda1a02a3c":
    "A potted ponytail palm on a white rooftop terrace with stucco planters",
  "37744df0-dc03-4682-856a-6e302a98def8":
    "A formal vegetable garden of raised beds around a white pergola",
  "3ed4ae9a-c9ce-43bf-b7bf-646ac6ffc348":
    "A hillside garden of lavender and herbs below a Spanish-style house",
  "516ba2f4-6cdf-4c57-b543-bca990fcc5a4":
    "A chard plant growing from a hydroponic tower on a balcony",
  "56cd8c6a-916b-45db-89b8-a55a34af9116":
    "A flowering squash plant in a narrow side-yard bed beside a lattice fence",
  "5acaeadb-a952-47ec-9d6f-21d1d3831905":
    "A white rooftop lounge with a fire pit, potted palms and a view of the city",
  "5c145d6c-7c5a-4a24-9857-dad53c28ff1d":
    "A cedar side gate opening onto a gravel path and drought-tolerant plantings",
  "5c7db569-0cda-4509-910d-f33970145195":
    "A backyard deck and succulent garden beside a pool, seen through a window",
  "5e6b04aa-41cd-4bdf-8a3d-cc9bcfc9dcdb":
    "A front-yard patio with wicker chairs inside a wooden fence, edged with young plantings",
  "5f1d7d82-ff1b-4100-8811-b978ea03852c":
    "A grapevine and an orange tree growing along a side-yard wall",
  "5f73c753-180d-4a96-9ee2-ea885823dc8b":
    "Herbs and edible plants filling a mulched bed below a vine-covered wall",
  "6058c356-2939-4c9e-a82b-b7b2ae42b460":
    "A white rooftop terrace with stucco planters of red and silver foliage",
  "60992cab-7cf1-444d-bac6-78d10f330275":
    "A shaded courtyard deck with grey sofas, a wooden screen wall and a water feature",
  "713e0abe-d301-4fa4-90f5-050f7a79ac0c":
    "Tomatoes and lettuce growing in a raised bed against a stone wall",
  "795f3fe9-ab7a-41b8-adf0-b8bcfe44edce":
    "Red, orange and green seats and potted snake plants on a white office terrace",
  "79898adf-3524-466b-9d98-7b5fbc16a871":
    "A secluded deck with sofas, screened by tall bamboo and soft grasses",
  "7a1b681f-efb3-42d1-bdac-39ce38f933ab":
    "A rooftop walkway between white stucco planters of grasses and phormium",
  "7ac1fb23-ca45-48b4-a701-e65291a4cd5b":
    "Two young girls laughing as they pick carrots from a raised bed",
  "7e4107f4-c055-41b4-8db6-366718b9c4e4":
    "Herbs, beans and greens growing from a white hydroponic tower",
  "7f55caf6-b6c3-40d0-8399-5806b3e0fa38":
    "Rows of raised wooden beds full of vegetables and flowers on a gravel lot",
  "7fb16d89-7e65-414b-8c09-d4d2c3453080":
    "A patio set on decomposed granite in front of a blue house, ringed by young plantings",
  "813d9e94-38cf-4529-a003-74ea50125be3":
    "A snake plant and a potted shrub at the entry to a rooftop terrace",
  "8523f0af-a447-4c6e-be7a-78032ffdb727":
    "Volunteers preparing the ground on a large urban farm plot",
  "89012397-6c92-44d7-b845-49f619de012f":
    "Three gardeners smiling in a garden, one holding a bag of fresh greens",
  "8e597c3f-c8af-45cb-85fc-9bc62b44211a":
    "A row of raised beds full of greens along a fence in a community garden",
  "8e85621c-29c1-4084-b16b-70aa0a584b9b":
    "White stucco steps and planters around a fire pit on a rooftop",
  "91a170c6-4ce4-411d-a780-16dedf336c63":
    "A sloping garden of raised beds, chard and flowering herbs beside a house",
  "95d926cc-12d6-42ca-b445-d9da395c7444":
    "Artichokes and herbs in a curved garden bed along a concrete path",
  "9bfcd732-ca30-4d09-a540-89f851947cde": "Collard greens in long raised beds on a community farm",
  "9d31fc20-6f34-40c5-9cb0-3729db716757":
    "A wood deck with a built-in bench, potted plants and a dining table by a pool",
  "a0a785a5-2039-4abf-a518-4f081c121aa9":
    "Colourful seats on an office terrace beside a tall planter of horsetail reed",
  "a3011027-b63a-498a-becf-f95abe835021":
    "Three volunteers in Alma Backyard Farms shirts standing together on the farm",
  "a3a924f2-167f-4c3f-a61a-bb57d14551e6": "A path between two tall walls of climbing pea vines",
  "a6000c0e-33d0-4e24-b9ac-9ead0a32357b": "Two cupped hands holding rich garden soil",
  "a6b32564-5dc8-4149-9d72-e540b966ea45": "Rows of rainbow chard and greens in raised beds",
  "a79129e4-6b11-4ba1-b913-9961208d6a72":
    "A white pergola over a stone-paved garden of raised beds at sunset",
  "a888f0cb-4ad0-4b59-bced-8ff1a6450937":
    "A blue house behind a new wooden fence and a front yard of young drought-tolerant plants",
  "a97508e0-383a-4f1d-b5f9-b31de95d5b48":
    "A decomposed granite path leading to a patio, lined with drought-tolerant plants",
  "ac27fa65-b152-4e51-a541-bc823b3b0a5f": "A blue spade in a freshly planted bed of seedlings",
  "b0e506f5-7462-4be7-b0a1-c0a2c7ce12d0":
    "A narrow side garden with a raised bed and a loquat tree beside the house",
  "bb692cff-b8c5-4022-b978-6ab50d0e5937":
    "A tiled fountain in front of a white pergola framed by palm trees",
  "c1a631f2-aecb-4e1a-b22b-ddf572e7dcae":
    "Nicole holding an armful of chard harvested from her balcony tower garden",
  "c7bbc3e9-1ef7-4d12-9247-b9e8166ae90f":
    "Wicker patio chairs on decomposed granite in a fenced front garden of succulents",
  "c8567103-67f0-4afe-993f-e3c12018c8c9": "A passion fruit vine trained up a house wall",
  "c94417e4-e756-4aa8-87ce-1095bf7298fb": "Tomatoes ripening on tall stakes among herbs and greens",
  "cd953712-24b7-4f53-9ac4-8d0f65307ac2":
    "A hydroponic tower of chard and cherry tomatoes on a sunny balcony",
  "ce3a7d48-e72d-49c6-b4ed-f4505a08606c": "Close-up of a hand-coloured garden design plan",
  "ce827c7b-87f4-4716-9af0-60299f1be022":
    "A block-edged raised bed of squash and marigolds beside a wooden trellis",
  "d088b50c-f15b-44db-ad08-2c19fb3bd735": "Passion fruit hanging from a vine against a wall",
  "e0b1296d-fb18-4cd2-bf6b-3344bf9190a5":
    "New wooden raised beds on an open field under a blue sky",
  "e47d5861-8307-4459-86ff-0030f71de881":
    "A cedar compost bin with its lid open beside a narrow raised bed",
  "ec8acb1b-5a28-4420-b095-aacd94bb5cc2":
    "A hand holding a rainbow chard seedling with its roots showing",
  "edcc7378-0569-4341-9a52-59c4f69c6b04":
    "A backyard deck and dining area beside a pool, with a new bed of young plants",
  "f27a48b0-dae4-43df-b47b-64f1095088e1":
    "A community farm with lavender borders, gravel paths and rows of raised beds",
  "f48d49c2-2e5e-45fc-b2b1-685e8bbd5893": "A greenhouse beside beds of leafy greens and flowers",
  "f4cb7100-536c-4f8b-a315-14079d6b404d":
    "Four volunteers standing together in a grassy garden plot",
  "f8a75409-c8c5-454c-8e7c-787af1f7a7fd": "Buckets of freshly cut zinnias, statice and sunflowers",
  "fa534630-d67a-45ee-8e8c-e80abb23cba7":
    "Young trees, boulders and grasses in a gravel bed outside an orange-trimmed office building",
  "fc68e11f-57e8-4c5b-b664-ac87e296f24f": "Lavender growing in front of a wooden raised bed",
};

/** @param {...string} paragraphs */
const p = (...paragraphs) => paragraphs.map((text) => ({ type: "paragraph", text, spans: [] }));
/**
 * @param {number} level
 * @param {string} text
 */
const h = (level, text) => [{ type: `heading${level}`, text, spans: [] }];
/**
 * @param {string} slice_type
 * @param {Record<string, unknown>} primary
 */
const slice = (slice_type, primary) => ({ slice_type, variation: "default", primary, items: [] });

/**
 * @param {(file: string, alt: string | null) => unknown} img resolves a Blux
 *   original's file name to whatever the caller needs — an asset for the seed,
 *   a placeholder for the dev route.
 * @param {(target: string) => unknown} [link] resolves "page:<uid>" or
 *   "project:<uid>" to a link field.
 * @returns {Array<{type: string, uid: string, title: string, data: Record<string, unknown>}>}
 */
export function documents(img, link = webLink) {
  /** @param {string} file */
  const photo = (file) => img(file, ALT[file.replace(/\.[a-z]+$/, "")] ?? null);
  /**
   * @param {string} background
   * @param {string} [image]
   */
  const flourish = (background, image) =>
    slice("text_block", {
      heading: [],
      heading_style: "eyebrow",
      body: p("It's time for your garden to flourish."),
      size: "statement",
      align: "center",
      background,
      background_image: image ? photo(image) : {},
      buttons: [{ button_label: "Contact Us", button_link: link("page:contact-us") }],
    });
  const howItWorks = slice("steps", {
    heading: h(2, "How it Works"),
    background: "gold",
    cta_label: null,
    cta_link: { link_type: "Any" },
    steps: [
      {
        image: photo("a6000c0e-33d0-4e24-b9ac-9ead0a32357b.jpg"),
        icon: "visit",
        title: "Garden Visit",
        body: p("Schedule a quick garden visit where we can discuss your garden goals and dreams."),
      },
      {
        image: photo("ce3a7d48-e72d-49c6-b4ed-f4505a08606c.jpg"),
        icon: "plan",
        title: "Custom Plan",
        body: p("We will develop a custom design and plan to fit your home and budget."),
      },
      {
        image: photo("ac27fa65-b152-4e51-a541-bc823b3b0a5f.jpg"),
        icon: "plant",
        title: "Garden Install",
        body: p("Once you are ready, lets get planting!"),
      },
    ],
  });
  const caseStudies = slice("case_studies", { heading: [] });

  return [
    {
      type: "page",
      uid: "home",
      title: "Home",
      data: {
        title: h(1, "Mantis Landscaping"),
        meta_title:
          "Mantis Landscaping — Native, Drought Tolerant and Edible Gardens in Los Angeles",
        meta_description:
          "Mantis Landscaping designs, installs and maintains native, drought tolerant and edible gardens in Los Angeles, with organic and sustainable practices.",
        meta_image: {},
        slices: [
          slice("split_hero", {
            image: photo("ec8acb1b-5a28-4420-b095-aacd94bb5cc2.jpg"),
            kicker: null,
            heading: h(1, "Creating green spaces that bring beauty and substance into your life."),
            body: [],
            cta_label: "Contact Us",
            cta_link: link("page:contact-us"),
            tone: "dark",
          }),
          slice("feature_trio", {
            heading: [],
            background: "gold-deep",
            features: [
              { icon: null, label: "Professionally Designed" },
              { icon: null, label: "Gorgeously Grown" },
              { icon: null, label: "Beautifully Maintained" },
            ],
          }),
          slice("hero", {
            heading: [],
            body: [],
            background_image: photo("a6b32564-5dc8-4149-9d72-e540b966ea45.jpg"),
            cta_label: null,
            cta_link: { link_type: "Any" },
          }),
          slice("text_block", {
            heading: h(2, "Our Mission"),
            heading_style: "eyebrow",
            body: p(
              "Our mission is simple, we want to create green spaces that can feed our body and mind while creating community. We hope that our garden spaces encourage our neighbors to come together and share in the dialogue of food and in the harvest of course!",
              "By being mindful of the environment and native habitats, we can create gardens that enrich our lives while promoting local fauna. We push back against water hungry lawns and strive to create spaces that bring beauty and substance to your home through organic and sustainable practices.",
              "We specialize in native, drought tolerant, and edible gardens in Los Angeles, and offer installation and maintenance services. To get a personalized quote, contact us.",
            ),
            size: "body",
            align: "center",
            background: "dark",
            background_image: {},
            buttons: [
              { button_label: "Contact Us", button_link: link("page:contact-us") },
              { button_label: "Join Newsletter", button_link: link("page:contact-us") },
            ],
          }),
          slice("service_cards", {
            heading: h(2, "Select a service to learn more below:"),
            cards: [
              {
                icon: "water",
                title: "Water Wise Gardens",
                link: link("project:water-wise-gardens"),
              },
              { icon: "edible", title: "Edible Gardens", link: link("project:edible-gardens") },
            ],
          }),
          slice("text_block", {
            heading: h(2, "The Difference"),
            heading_style: "eyebrow",
            body: p(
              "With a background in urban farming and architecture, we understand the desire for a garden that can add beauty and function to your outdoor space.",
            ),
            size: "statement",
            align: "left",
            background: "image",
            background_image: photo("f8a75409-c8c5-454c-8e7c-787af1f7a7fd.jpg"),
            buttons: [],
          }),
          slice("steps", {
            heading: h(2, "Ready to save on water or grow your own food?"),
            background: "gold-deep",
            cta_label: "Contact Us",
            cta_link: link("page:contact-us"),
            steps: [
              {
                image: {},
                icon: "visit",
                title: "Schedule a consultation",
                body: p(
                  "Call or email us to schedule a site visit where we can take a look at exactly what we're working with.",
                ),
              },
              {
                image: {},
                icon: "plan",
                title: "Get an estimate",
                body: p(
                  "We'll offer our recommendations and prepare an estimate to accomplish your goals.",
                ),
              },
              {
                image: {},
                icon: "plant",
                title: "Start the transformation",
                body: p("When you're ready, we'll get planting for your dream garden."),
              },
            ],
          }),
          slice("project_list", { heading: h(2, "Projects") }),
          slice("text_block", {
            heading: h(2, "The Takeaway"),
            heading_style: "eyebrow",
            body: p(
              "It's not just plants, it's about a space for you to grow, relax, and be present.",
            ),
            size: "statement",
            align: "center",
            background: "dark",
            background_image: {},
            buttons: [{ button_label: "Let's Get Planting", button_link: link("page:contact-us") }],
          }),
          slice("feature_trio", {
            heading: [],
            background: "dark",
            features: [
              { icon: "design", label: "Thoughtfully Designed" },
              { icon: "sun", label: "California Friendly" },
              { icon: "edible", label: "Sustainable Produce" },
              { icon: "community", label: "For the Community" },
            ],
          }),
          flourish("image", "33aa34a6-890c-4faf-b2e8-737a265b4b6f.jpg"),
        ],
      },
    },
    {
      type: "page",
      uid: "projects",
      title: "Projects",
      data: {
        title: h(1, "Projects"),
        meta_title: "Projects",
        meta_description:
          "Water wise and edible gardens by Mantis Landscaping: rooftops, backyards, offices and community farms across Los Angeles.",
        meta_image: {},
        slices: [
          slice("page_title", {
            heading: h(1, "Projects"),
            heading_style: "eyebrow",
            body: p("It's not just plants, it's about a space for you to grow, relax, and escape."),
            background: "white",
          }),
          slice("project_list", { heading: h(2, "Select a project below to learn more:") }),
        ],
      },
    },
    {
      type: "page",
      uid: "contact-us",
      title: "Contact Us",
      data: {
        title: h(1, "Contact Us"),
        meta_title: "Contact Us",
        meta_description:
          "Have an idea for your garden? Send Mantis Landscaping a message or call 424-264-8944 to plan, plant or maintain your garden in Los Angeles.",
        meta_image: {},
        slices: [
          slice("page_title", {
            heading: h(1, "Contact Us"),
            heading_style: "display",
            body: [],
            background: "gold-deep",
          }),
          slice("text_block", {
            heading: h(2, "Have an idea for your garden?"),
            heading_style: "display",
            body: p(
              "Whether it's keeping up with what you're growing, or planting something new, we're here to help. Send us a message through the form below, or give us a call at 424-264-8944. We'll be glad to chat with you.",
            ),
            size: "body",
            align: "left",
            background: "light",
            background_image: {},
            buttons: [],
          }),
        ],
      },
    },
    {
      type: "project",
      uid: "water-wise-gardens",
      title: "Water Wise Gardens",
      data: {
        order: 1,
        title: h(1, "Water Wise Gardens"),
        kicker: "Design + Installation + Maintenance",
        intro: p("Drought tolerant landscapes that bring beauty and function to your home."),
        hero_image: photo("0f2a5cf3-65cb-49c6-804b-e6a639738e84.jpg"),
        card_image: {},
        services_heading: "Services provided",
        services: [
          { icon: "native", label: "Native Gardens" },
          { icon: "installation", label: "Installation" },
          { icon: "maintenance", label: "Maintenance" },
          { icon: "design", label: "Design" },
        ],
        case_studies: [
          {
            label: "Residential",
            title: "Roof Top Oasis",
            body: p(
              "This minimalist roof top garden incorporates smooth stucco planters with succulents and native grasses. The granite modern fireplace and outdoor kitchen give this space a sleek look. Once a hot roof, now a hot place to hang out.",
            ),
            photos: [
              { photo: photo("5acaeadb-a952-47ec-9d6f-21d1d3831905.jpg") },
              { photo: photo("8e85621c-29c1-4084-b16b-70aa0a584b9b.jpg") },
              { photo: photo("34d91322-5f9f-4099-b156-41fda1a02a3c.jpg") },
              { photo: photo("7a1b681f-efb3-42d1-bdac-39ce38f933ab.jpg") },
              { photo: photo("6058c356-2939-4c9e-a82b-b7b2ae42b460.jpg") },
              { photo: photo("1aa68442-3422-417b-b4a2-abdc6130f1b8.jpg") },
              { photo: photo("0e69c0a8-242e-49e1-af17-92d648ec7537.jpg") },
              { photo: photo("28bb9fce-2762-42f0-84f7-8045cf4565d3.jpg") },
              { photo: photo("813d9e94-38cf-4529-a003-74ea50125be3.jpg") },
            ],
          },
          {
            label: "Residential",
            title: "Simple and Sleek",
            body: p(
              "This a great space for a meal with the family any time of the day. Drought tolerant plants, large concrete pavers and composite decking give this garden a modern feel.",
            ),
            photos: [
              { photo: photo("5c7db569-0cda-4509-910d-f33970145195.jpg") },
              { photo: photo("edcc7378-0569-4341-9a52-59c4f69c6b04.jpg") },
              { photo: photo("9d31fc20-6f34-40c5-9cb0-3729db716757.jpg") },
            ],
          },
          {
            label: "Residential",
            title: "A Cozy Garden",
            body: p(
              "We went from a thirsty lawn to a luscious drought tolerant garden. The decomposed granite walkway allows for a nice sitting area to enjoy a nice morning tea.",
            ),
            photos: [
              { photo: photo("5e6b04aa-41cd-4bdf-8a3d-cc9bcfc9dcdb.jpg") },
              { photo: photo("c7bbc3e9-1ef7-4d12-9247-b9e8166ae90f.jpg") },
              { photo: photo("2c52b1dd-80b1-46a1-ba4c-4ff83d075d18.jpg") },
              { photo: photo("a888f0cb-4ad0-4b59-bced-8ff1a6450937.jpg") },
              { photo: photo("7fb16d89-7e65-414b-8c09-d4d2c3453080.jpg") },
              { photo: photo("a97508e0-383a-4f1d-b5f9-b31de95d5b48.gif") },
              { photo: photo("5c145d6c-7c5a-4a24-9857-dad53c28ff1d.jpg") },
            ],
          },
          {
            label: "Residential",
            title: "Garden Hide Away",
            body: p(
              "These intimate spaces became a great hide away. Large thick hedges muffle sound and neutral colors keep the mind calm. A custom water feature helps set the mood as well.",
            ),
            photos: [
              { photo: photo("79898adf-3524-466b-9d98-7b5fbc16a871.jpg") },
              { photo: photo("60992cab-7cf1-444d-bac6-78d10f330275.jpg") },
            ],
          },
          {
            label: "Commercial",
            title: "Office Colors",
            body: p(
              "Bringing an office space to life with textures, plant material and a pop of color. This is a modern space where people can take a break from the grind and get back in touch with themselves.",
            ),
            photos: [
              { photo: photo("fa534630-d67a-45ee-8e8c-e80abb23cba7.jpg") },
              { photo: photo("10b6ae09-5894-403e-83aa-f7818aaadd80.jpg") },
              { photo: photo("22635d1f-c4a8-4441-b466-7d31f937379d.jpg") },
              { photo: photo("2ee8d4fc-d8d6-4b84-ad6d-5a30644ded29.jpg") },
              { photo: photo("795f3fe9-ab7a-41b8-adf0-b8bcfe44edce.jpg") },
              { photo: photo("a0a785a5-2039-4abf-a518-4f081c121aa9.jpg") },
              { photo: photo("26b082b4-377c-4b83-8747-288afd38d385.jpg") },
            ],
          },
        ],
        meta_title: "Water Wise Gardens",
        meta_description:
          "Drought tolerant, native gardens designed, installed and maintained by Mantis Landscaping across Los Angeles: rooftops, backyards and offices.",
        meta_image: {},
        slices: [howItWorks, caseStudies, flourish("gold-deep")],
      },
    },
    {
      type: "project",
      uid: "edible-gardens",
      title: "Edible Gardens",
      data: {
        order: 2,
        title: h(1, "Edible Gardens"),
        kicker: "Design + Installation + Maintenance",
        intro: p(
          "Edible gardens don't have to look like a farm! No matter how much or little space you have, you can have a beautiful garden where organic produce, herbs and flowers are at your fingertips... all year round :)",
        ),
        hero_image: photo("7ac1fb23-ca45-48b4-a701-e65291a4cd5b.jpg"),
        card_image: {},
        services_heading: "Services provided",
        services: [
          { icon: "design", label: "Design" },
          { icon: "installation", label: "Installation" },
          { icon: "maintenance", label: "Maintenance" },
          { icon: "native", label: "Natives" },
          { icon: "edible", label: "Edibles" },
        ],
        case_studies: [
          {
            label: "Edible Garden",
            title: "Ann's Garden",
            body: p(
              "This completely edible garden offers both sustenance and aesthetic delight in every corner. Vibrant herbs and edible flowers carpet the ground, while artichokes and lemongrass add intriguing textures. Nutrient-rich organic vegetables thrive in raised beds, and a sprawling 50-foot passion fruit vine now adorns a wall once covered in ivy.",
            ),
            photos: [
              { photo: photo("3ed4ae9a-c9ce-43bf-b7bf-646ac6ffc348.jpg") },
              { photo: photo("5f73c753-180d-4a96-9ee2-ea885823dc8b.jpg") },
              { photo: photo("95d926cc-12d6-42ca-b445-d9da395c7444.jpg") },
              { photo: photo("fc68e11f-57e8-4c5b-b664-ac87e296f24f.jpg") },
              { photo: photo("054058c4-e73e-4803-9618-a453f966f45d.jpg") },
              { photo: photo("91a170c6-4ce4-411d-a780-16dedf336c63.jpg") },
            ],
          },
          {
            label: "Edible Garden",
            title: "John's Garden",
            body: p(
              "In this captivating formal garden, design seamlessly blends with function, directing attention to the raised beds and vibrant vegetation as the central features. This is where beauty not only delights the eye but serves a purpose.",
            ),
            photos: [
              { photo: photo("bb692cff-b8c5-4022-b978-6ab50d0e5937.jpg") },
              { photo: photo("edcc7378-0569-4341-9a52-59c4f69c6b04.jpg") },
              { photo: photo("a79129e4-6b11-4ba1-b913-9961208d6a72.jpg") },
              { photo: photo("37744df0-dc03-4682-856a-6e302a98def8.jpg") },
            ],
          },
          {
            label: "Edible Garden",
            title: "Kate's Garden",
            body: p(
              "Kate's beautiful garden thrives on high density planting and efficiency. This summer garden grows a variety of leafy greens, squash, tomatoes, herbs and even edible flowers!",
            ),
            photos: [
              { photo: photo("ce827c7b-87f4-4716-9af0-60299f1be022.gif") },
              { photo: photo("b0e506f5-7462-4be7-b0a1-c0a2c7ce12d0.jpg") },
              { photo: photo("713e0abe-d301-4fa4-90f5-050f7a79ac0c.jpg") },
              { photo: photo("e47d5861-8307-4459-86ff-0030f71de881.jpg") },
              { photo: photo("c8567103-67f0-4afe-993f-e3c12018c8c9.jpg") },
              { photo: photo("d088b50c-f15b-44db-ad08-2c19fb3bd735.jpg") },
            ],
          },
          {
            label: "Edible Garden",
            title: "Sanam's Garden",
            body: p(
              "This garden exudes the atmosphere of an urban orchard imbued with a tranquil homestead charm. Dotted with vibrant pollinators, this enchanting space yields a bounty of citrus fruits, figs, pomegranates, berries, and even chestnuts. And let's not overlook the raised beds brimming with lush greens and traditional herbs.",
            ),
            photos: [
              { photo: photo("2e0901bc-a4c2-4e7f-8015-17917da00a01.jpg") },
              { photo: photo("56cd8c6a-916b-45db-89b8-a55a34af9116.jpg") },
              { photo: photo("5f1d7d82-ff1b-4100-8811-b978ea03852c.jpg") },
            ],
          },
          {
            label: "Balcony Hydroponic Garden",
            title: "Nicole's Garden",
            body: p(
              "Nicole's smile says it all. Hydroponic towers maximize urban space, enabling year-round production of fresh, nutritious food with minimal water usage. Accessible and efficient, they empower individuals to cultivate their own sustainable food sources, promoting self-sufficiency and resilience. Nicole loves coming out to her balcony to harvest greens, tomatoes, herbs, squash and the occasional broccoli head.",
            ),
            photos: [
              { photo: photo("c1a631f2-aecb-4e1a-b22b-ddf572e7dcae.jpg") },
              { photo: photo("cd953712-24b7-4f53-9ac4-8d0f65307ac2.jpg") },
              { photo: photo("7e4107f4-c055-41b4-8db6-366718b9c4e4.jpg") },
              { photo: photo("516ba2f4-6cdf-4c57-b543-bca990fcc5a4.jpg") },
            ],
          },
          {
            label: "Green Girl Farms",
            title: "Green Girl",
            body: p(
              "We are a proud partner of this urban oasis where innovation meets sustainability. As pioneers in the movement, Green Girl Farms is dedicated to nurturing not just crops, but communities, empowering those around the Port of Los Angeles to embrace a greener, more inclusive future.",
            ),
            photos: [
              { photo: photo("89012397-6c92-44d7-b845-49f619de012f.jpg") },
              { photo: photo("8e597c3f-c8af-45cb-85fc-9bc62b44211a.jpg") },
              { photo: photo("2554f84c-a613-4364-9149-11072f63267f.jpg") },
              { photo: photo("f48d49c2-2e5e-45fc-b2b1-685e8bbd5893.jpg") },
            ],
          },
          {
            label: "Feed and Be Fed",
            title: "Feed and Be Fed",
            body: p(
              "Feed and be Fed is a non-profit urban garden dedicated to restoring food justice in the community of San Pedro by growing and distributing organic whole foods. We are proud to be able to take part in supporting their mission.",
            ),
            photos: [
              { photo: photo("f4cb7100-536c-4f8b-a315-14079d6b404d.jpg") },
              { photo: photo("33e8356e-82be-40f8-8346-0b3400424f92.jpg") },
              { photo: photo("8523f0af-a447-4c6e-be7a-78032ffdb727.jpg") },
              { photo: photo("e0b1296d-fb18-4cd2-bf6b-3344bf9190a5.jpg") },
            ],
          },
          {
            label: "Alma",
            title: "Alma Backyard Farms",
            body: p(
              "ALMA exists to re-claim lives of formerly incarcerated people, re-purpose land into productive urban farms, and re-imagine community as a place for people & plants to thrive. We are happy to have been part of their mission and grow out their farm from 2019-2021.",
            ),
            photos: [
              { photo: photo("a3011027-b63a-498a-becf-f95abe835021.jpg") },
              { photo: photo("f27a48b0-dae4-43df-b47b-64f1095088e1.jpg") },
              { photo: photo("c94417e4-e756-4aa8-87ce-1095bf7298fb.jpg") },
              { photo: photo("7f55caf6-b6c3-40d0-8399-5806b3e0fa38.jpg") },
              { photo: photo("a3a924f2-167f-4c3f-a61a-bb57d14551e6.jpg") },
              { photo: photo("28e49249-987c-41e7-b7d2-461fba6f37bc.jpg") },
              { photo: photo("9bfcd732-ca30-4d09-a540-89f851947cde.jpg") },
            ],
          },
        ],
        meta_title: "Edible Gardens",
        meta_description:
          "Organic edible gardens in Los Angeles, from balcony towers to community farms: Mantis Landscaping designs, installs and maintains them.",
        meta_image: {},
        slices: [howItWorks, caseStudies, flourish("gold-deep")],
      },
    },
  ];
}

/** @param {string} target */
function webLink(target) {
  const [type, uid] = target.split(":");
  const url = type === "project" ? `/projects/${uid}` : uid === "home" ? "/" : `/${uid}`;
  return { link_type: "Web", url };
}
