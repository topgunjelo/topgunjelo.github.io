# Markie Mojica — Portfolio

A single-page manga-noir portfolio for Markie Angelo S. Mojica, a frontend developer and Computer Science student specializing in Digital Forensics. The build generates static HTML and bundles GSAP, Lenis, and React Bits enhancements. All project information is available without live GitHub API requests.

## Run locally

Install Node.js 20 or later. Open a terminal in this directory.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The preview rebuilds the site when source files change. Refresh the browser to see the latest build.

```sh
npm run build
npm run preview
```

The build writes one HTML document and its assets to `dist/`. Publish that directory to a static host. Section and project links use fragments within the page.

## Update content

- `src/index.html` contains the opening, profile, portrait slot, and Contact. To add a portrait, replace the `.portrait-plate` inside `.portrait-slot` with an image that has descriptive alternative text. Put the approved image under `src/assets/` and add its path to the asset list in `scripts/build.mjs`.
- `src/expertise.html` contains the technology logos and skill disclosures. `src/profile.html` contains Experience, Education, and the Projects, Certificates, and Awards cards.
- `src/projects.json` stores the public GitHub profile, folder contents, contribution notes, technology lists, and available public links and media. Put approved project WebP captures in `src/assets/`, describe them in the screenshot `alt` field, and run the build. Use HTTPS for public repository and demo URLs. Private folders use high-level summaries and omit private assets and links.
- `src/styles.css` contains the layout, type, palette, and motion styles.
- `src/opening.js` uses GSAP to reveal the name with a bat flock and holds on Click to continue. The flock disperses on activation. Escape dismisses the opening, and Replay intro is in the footer. Direct links and reduced motion go straight to the profile or linked section.
- `src/motion.js` runs Lenis smooth wheel scrolling with GSAP ScrollTrigger. The ink smoke drifts behind the page, and chapter contents reveal behind the flock. Fragment links, touch scrolling, and keyboard scrolling use native browser behavior.
- `src/bits.jsx` lazily loads React Bits AnimatedContent for subtle reveals over folder covers. Folders and category disclosures work in static HTML.
- `src/bats.js` draws procedural bats and fragments with Canvas 2D. The opening uses a dedicated flock. The portfolio uses a separate layer for chapter transitions. Only one flock runs at a time. The static composition remains available when Canvas is unavailable.

## Artwork and type

The original `src/assets/ink-smoke.webp` was made with the built-in ImageGen tool. The prompt called for a wide manga-noir illustration of billowing black ink, crosshatched shadows, selective halftone, crimson smoke at the edges, and open dark space in the center. Bat silhouettes are drawn procedurally. Public project previews use screenshots and project assets. Technology marks include attribution in `src/expertise.html`.

Manrope and Barlow Condensed are hosted locally with their SIL Open Font Licenses in `src/assets/`. The build includes dependency notices in `dist/assets/licenses/`.

