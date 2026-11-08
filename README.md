# Markie Mojica — After Dark

A cinematic personal portfolio for Markie Angelo S. Mojica, a frontend-focused Computer Science student specializing in Digital Forensics. It uses static HTML, CSS, and browser JavaScript. The project has no runtime packages or GitHub API requests.

## Run locally

Install Node.js 20 or later. Open a terminal in this directory.

```sh
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
- `src/projects.json` stores the public GitHub profile, projects, case studies, technology lists, and verified live links. Edit the dataset and run the build to update the site. Use an HTTPS repository URL and omit `demo` when a live link cannot be verified.
- `src/styles.css` contains the layout, type, palette, and motion styles.
- `src/opening.js` coordinates the short opening, its title reveal, and the fade into the portfolio. Skip intro and Escape end it early. Replay intro is in the homepage footer. Direct section links and reduced motion bypass the opening.
- `src/bats.js` draws procedural bats and fragments with Canvas 2D. The opening uses a dedicated flock. The portfolio uses a separate layer for scroll and case-study transitions. Only one animation runs at a time. The static composition remains available when Canvas is unavailable.

## Artwork and type

The original smoke plate lives at `src/assets/smoke.webp`. It was created with the built-in ImageGen tool using a brief for volumetric crimson and oxblood smoke in a lightless studio, a clean black left side, and luminous wisps on the right. The bat silhouettes and motion are drawn in SVG and JavaScript. Case-study artwork is atmospheric illustration. The linked live sites show the actual projects.

Barlow Condensed and Manrope are hosted locally. Their SIL Open Font License files are in `src/assets/`.

