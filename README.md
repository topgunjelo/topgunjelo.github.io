# Markie Mojica — Portfolio

The portfolio of Markie Angelo S. Mojica, frontend developer and Computer Science student specializing in Digital Forensics at National University Manila. It's a single page built with React, TypeScript, Vite and Motion.

## Run locally

Install Node.js 22.18 or later, then:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4173>.

```sh
npm run check     # lint, type-check, tests and a production build
npm run build     # type-check, then build to dist/
npm run preview   # serve dist/
```

`dist/` is a static site with relative paths, so any static host works.

## Deploy

The site is live at <https://topgunjelo.github.io/>. Every push to `main` runs `.github/workflows/deploy.yml`, which checks and builds the site and publishes `dist/` to GitHub Pages.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content/site.ts` | Name, headline, intro, contact details, nav sections, About copy |
| `src/content/projects.json` | Project data: summaries, roles, technologies, links, screenshots |
| `src/content/projects.ts` | Page order and layout of each project, the KilosUnlad flow |
| `src/content/stack.ts` | Tech-stack logos, categories, notes, capabilities |
| `src/content/journey.ts` | Education, experience, credentials |
| `src/components/` | One component per chapter, plus the shared pieces (Lens, Intro, Nav, CommandPalette, CaseStudy) |
| `src/orb/` | The particle orb: Three.js engine, formations (sphere, text, window, cube, shield, play, phone), shared state |
| `src/styles/tokens.css` | Every color, size, radius, shadow and timing |
| `src/assets/logos/` | Technology logos (Devicon, MIT — see `LICENSE-devicon.txt`) |
| `src/assets/projects/` | Project screenshots (WebP, 1200×750) |

To add a project, add it to `projects.json`, put its screenshot in `src/assets/projects/`, and list its slug in `showcase` or `lab` in `projects.ts`. Private projects get no `repository`, `demo` or `screenshot`; the tests enforce it.

## How it behaves

- **Intro.** On a plain first visit in a browser session, particles gather into a small orb, pour into the letters of the name (each letter sharpens as its dots land), then the name glides into the hero heading while the particles become the hero sphere. It's skipped for deep links (`#work`, `#project-…`), Back/Forward, and later visits in the same session. **Skip intro**, Escape, or resizing the window ends it early. Reduced motion gets an opacity-only version. **Replay intro** in the footer plays it again.
- **Case studies.** Every project opens in a sheet with a shareable `#project-<slug>` URL.
- **Quick navigation.** ⌘K / Ctrl+K (or the search button in the nav) opens a palette for sections, projects and actions.
- **Motion.** Animations use transforms and opacity. Looping effects pause off-screen. Pointer effects run only for a mouse or trackpad. `prefers-reduced-motion` turns off movement.

`DESIGN.md` records the design rules.

## Test

```sh
npm test
```

The tests cover when the intro plays and the project data rules: no excluded repositories, no links or screenshots for private projects, captioned screenshots that exist, HTTPS links, and unique slugs.
