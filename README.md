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

- `src/index.html` contains the opening title, hero, About, and Contact sections.
- `src/expertise.html` contains the skills panels. `src/profile.html` contains Experience, Education, and Learning.
- `src/projects.json` stores the public GitHub profile, project scenes, contribution notes, technology lists, and available public links and media. Put approved project WebP captures in `src/assets/`, describe them in the screenshot `alt` field, and run the build. Use HTTPS for public repository and demo URLs. A project without approved media renders a title card.
- `src/styles.css` contains the layout, type, palette, and motion styles.
- `src/opening.js` uses a GSAP timeline for the name reveal and the fade into the portfolio. Skip intro and Escape end it early. Replay intro is in the homepage footer. Direct section links and reduced motion bypass the opening.
- `src/motion.js` runs Lenis smooth wheel scrolling with GSAP ScrollTrigger. The backdrop drifts through the story while project visuals and copy reveal as you scroll. The desktop layout briefly holds each project visual beside its text using CSS sticky positioning. Fragment links, touch scrolling, and keyboard scrolling use native browser behavior.
- `src/bits.jsx` lazily loads the React Bits AnimatedContent component for decorative reveals over the project captures. Project links and images render in static HTML.
- `src/bats.js` draws procedural bats and fragments with Canvas 2D. The opening uses a dedicated flock. The portfolio uses a separate layer for chapter transitions. Only one flock runs at a time. The static composition remains available when Canvas is unavailable.

## Artwork and type

The original `src/assets/ink-smoke.webp` was made with the built-in ImageGen tool. The prompt called for a wide manga-noir illustration of billowing black ink, crosshatched shadows, selective halftone, crimson smoke at the edges, and open dark space in the center. The artwork contains smoke and ink marks. Bat silhouettes are drawn procedurally. Project visuals show the live AngelSam interface, MarineAtlas rendered locally from public source, and the public Network Guardian evaluation chart.

Manrope and Barlow Condensed are hosted locally with their SIL Open Font Licenses in `src/assets/`. The build includes dependency notices in `dist/assets/licenses/`.

