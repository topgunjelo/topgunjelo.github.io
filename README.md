# Markie Mojica — Portfolio

A personal portfolio for Markie Angelo S. Mojica, a frontend developer and Computer Science student specializing in Digital Forensics. The build generates static HTML and bundles GSAP, Lenis, and React Bits enhancements. Project data is available without live GitHub API requests.

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

The build writes the home page and case-study pages to `dist/`. Publish that directory to a static host. Keep the case-study directories intact and enable directory index pages. The provided preview server supports them.

## Update content

- `src/index.html` contains the opening title, hero, About, and Contact sections.
- `src/profile.html` contains Expertise, Experience, Education, and Learning.
- `src/projects.json` stores the public GitHub profile, projects, case studies, technology lists, live links, and screenshot filenames. Put project WebP captures in `src/assets/`, describe them in the screenshot `alt` field, and run the build. Use an HTTPS repository URL and omit `demo` when a live link cannot be verified.
- `src/styles.css` contains the layout, type, palette, and motion styles.
- `src/opening.js` uses a GSAP timeline for the name reveal and the fade into the portfolio. Skip intro and Escape end it early. Replay intro is in the homepage footer. Direct section links and reduced motion bypass the opening.
- `src/motion.js` runs Lenis smooth wheel scrolling with GSAP ScrollTrigger. Fragment links, touch scrolling, and keyboard scrolling use native browser behavior.
- `src/bits.jsx` lazily loads the React Bits AnimatedContent component for decorative reveals over the project captures. Project links and images render in static HTML.
- `src/bats.js` draws procedural bats and fragments with Canvas 2D. The opening uses a dedicated flock. The portfolio uses a separate layer for scroll and case-study transitions. Only one animation runs at a time. The static composition remains available when Canvas is unavailable.

## Artwork and type

The original smoke plate lives at `src/assets/smoke.webp`. It was created with ImageGen from a brief for volumetric crimson smoke in a lightless studio. Bat silhouettes are drawn procedurally. The project images are captures of the linked live interfaces.

Manrope is hosted locally with its SIL Open Font License in `src/assets/`. The build includes dependency notices in `dist/assets/licenses/`.

