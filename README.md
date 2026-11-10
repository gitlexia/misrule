# MISRULE — DRIFT + LIVING EDITIONS

**v0.5 / Gallery Edition — a redesigned creative art direction and campaign studio**

The white/indigo visual identity is intentionally different from the black/acid-green RESONANCE application. Both pages have **identical header typography, alignment, navigation and spacing**, and a simple flow: **Reference → Designs → Review → Campaign**.

## Get started (Mac / Windows / Linux)

1. Install Node.js 20 or later.
2. Open Terminal in the `DRIFT-LIVING-EDITIONS` folder.
3. Run `node server.mjs`.
4. Open **http://localhost:4317** in your browser.

No npm dependencies or build step. Keep Terminal running. If the old DRIFT server is still using port 4317, stop it with **Control-C** before opening the new version. A different label in the header alone will not fix an old server running on that port. To change ports, set `PORT=4319` in `.env` and restart, then visit the matching URL.

## What visitors can do

**DRIFT**
- **Choose a reference.** Upload an image or browse a curated collection of eight original artwork samples.
- **Explore designs.** Generate two reference-guided AI images (with a configured key), try free procedural studies, upload a design, or add an existing library artwork as a design without making an API call.
- **Review.** Select a study, compare it with the reference, approve or reject it, and optionally provide feedback to guide two new variations. Similarity metrics and version details are tucked away under optional disclosures.
- **Continue.** Approved designs become sources in LIVING EDITIONS.

**LIVING EDITIONS**
- Choose any approved design, enter headline, brand and event details, adjust layout style and accent colour, preview three distinct formats, export poster/story/banner PNG files, and download a manifest with creative lineage information.

Changes are stored **locally in this browser** using localStorage and IndexedDB. Existing v0.3/v0.4 decisions are preserved when you use the same origin and port. To start fresh, clear this site's browser storage. There is no cloud account or cross-device sync in this prototype.

## Enable paid AI image generation

Copy `.env.example` to a new `.env` file **in the same folder as `server.mjs`**. Paste your current OpenAI API key in the file; do not put it into frontend JavaScript:

```dotenv
OPENAI_API_KEY=YOUR_OWN_KEY
OPENAI_IMAGE_MODEL=gpt-image-2.6-sunburst
OPENAI_IMAGE_QUALITY=medium
OPENAI_VISION_MODEL=gpt-6-luna
DRIFT_MAX_GENERATIONS=10
PORT=4317
```

Restart `node server.mjs`. The page will say **AI READY** when the local API is configured. An API key alone does not guarantee model access or successful generation; check your provider account if the API reports an error. **Each batch requests two paid images**, and the Experimental option also runs reference-image analysis. No API requests occur when selecting existing library art or importing your own designs.

The three generation modes let you choose how the reference guides the artwork:

- **Connected:** recognisably related aesthetic, different composition.
- **Reimagined (default):** shared visual character, substantially new composition.
- **Experimental:** vision model extracts abstract visual qualities, then the image generator uses that text instead of the actual image.

The model is guided to produce new artworks, but originality is not guaranteed. Use artwork you own or have permission to adapt; review the outputs before publication.

## Privacy and safety

**Do not upload `.env` or your API key to GitHub or share it inside a ZIP.** `.gitignore` excludes it from Git, but ZIP files must also be checked separately. The application sends reference and revision images to the OpenAI API only when you request AI generation. Artworks and history remain in browser storage on the local app.

The backend binds to localhost and is **not ready for unrestricted public hosting**. It lacks user authentication and persistent billing controls. Its session limits reset when the server restarts.

## Test without spending anything

From the project folder run:

```bash
node tests/smoke.mjs
node tests/ui-flow.mjs
node tests/generation.mjs
```

The UI flow test validates choosing reference art, adding designs, approving and passing to campaign. Generation integration tests use mocked API responses; **no paid AI image requests are made**. The mock test starts its own local server on a separate port.

## v0.6 — Night School redesign

A shared gallery/editor visual language across DRIFT and LIVING EDITIONS: warm white surfaces, editorial black type, ultraviolet/violet accents, sharper zine-style borders, and a scrolling slash-separated marquee. The creative-distance selector is immediately visible (Connected / Reimagined / Experimental), no expandable control. Functional AI generation, feedback-driven review, asset library, approval and exports remain in place.

The scrolling marquee respects reduced-motion preferences. This package includes **no API keys or local `.env` files**. Use `.env.example` to configure credentials on your own computer. To check the new version, open the website and look for the purple marquee and the three always-visible creative-distance choices.
