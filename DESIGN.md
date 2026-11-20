# Design rules

From Markie's rebuild brief (2026-11-20). Read before changing layout or motion. These replace the earlier manga-noir rules.

## Direction

- **Apple-inspired and mostly white.** About 80–90% of the page is white or near-white. Color comes from objects (the lens, logos, gradients, hover glows), not from backgrounds.
- **One visual object: the orb.** It's one persistent particle system (`src/orb/`) that travels the page, not a repeated decoration. It starts as a dot-matrix sphere in the hero, dissolves into small black particles that stream down and fill the About statement word by word, re-forms as a companion beside "Where my curiosity lives" (a window, cube, shield or play button for rows 01–04), and assembles into a 3D telephone in Contact. The cursor scatters particles anywhere; springs bring them home. Don't add a second decorative system.
- **The intro is the orb's first act.** Scattered particles gather into a small dot-matrix orb. The orb pours into MARKIE MOJICA left to right, and each letter sharpens as its dots land (the same idea as the About text). Then the name glides into the hero heading while the particles become the hero sphere. The scenes are driven by `orbStore.setIntroStage('gather' | 'name' | 'hero' | null)`. While a scene plays, the canvas sits above the intro's white stage, and ending a scene hands the particles to the page formation as spring displacement, so nothing jumps.
- **Fallback.** With reduced motion or no WebGL, or if the engine isn't ready within 1.5 s, the intro uses the classic CSS glass lens. Every orb spot shows the static lens (`Lens.tsx`), and Contact shows a phone on the lens.
- **Headline:** "I build what you see. I study what's hidden." It ties frontend work to digital forensics.
- **Every chapter has its own composition.** About is a scroll-lit statement plus an editorial list. Skills is a floating logo constellation. Projects alternate between a feature window, a flow diagram, a pair, splits and a lab grid. Experience is a timeline with a drawing rail. Contact is a centered close. Avoid repeated card grids.

## Tokens

All values live in `src/styles/tokens.css`. Use the tokens; don't add raw hex values to new UI.

- Ink `#1D1D1F`. Secondary `#6E6E73` (body-safe). `#86868B` is for large text and decoration only.
- Accents: blue `#0071E3`, cyan, lavender, and the `--spectrum` gradient. Use them sparingly.
- Type: Inter Variable with optical sizing. Large text gets negative tracking and tight leading. Body text stays near 0 tracking.

## Motion

- Use transforms and opacity only. Springs have no bounce unless a gesture carried momentum.
- Scroll-linked values go through `useRange` (`src/lib/hooks.ts`), not plain range `useTransform`. Motion otherwise hands them to the browser's native ViewTimeline, which froze after the intro's scroll lock.
- The intro's name and the hero name share `.name-type` and per-glyph spans (`NameGlyphs`), so the intro copy lands on the hero copy exactly. Keep them identical. The glide aims at the letters (`glyphBox`/`flipOnto` in `Name.tsx`), never at the element box: the hero heading is a full-width block, and aiming at its box made the name land oversized and off-center, then jump.
- Looping CSS animations sit under `usePauseOffscreen` so they stop when out of view.
- Pointer effects (tilt, parallax, magnetic buttons) only run with a fine pointer and without reduced motion. Hover is never the only way to reach information.

### Orb engine notes

- Each particle keeps its identity and has a target in every station (hero, text, companion, contact). Scroll progress per leg is staggered per particle, so the orb dissolves and re-forms instead of sliding, and it reverses exactly when scrolling back up.
- About text dots use the same timing as the word fade in `ScrollLitText`. Change one, change both.
- Anchors are plain elements with `data-orb="hero|text|zone|companion|contact"`. The engine reads their rects each frame, so layout changes need no engine changes.
- 5,200 particles on desktop, 2,600 on small or low-core devices. Nothing is drawn while no particle is on screen.

## Content

- **Concise and factual.** No invented metrics, titles, dates or achievements. Collaborator access alone doesn't prove someone authored a feature.
- Private projects show high-level summaries only, with no links or screenshots.
- No portrait is published until an approved photo exists. Don't use generated people.
- The GWA (95.69) appears with the LMI Highest Honors. The 2026-11-20 rebuild brief asked for it, which overrides the earlier "GWA never appears" rule.
- Logos come from Devicon (MIT). Lightroom and Premiere Pro are drawn in Adobe's tile style, and Microsoft Word and Teams as simplified Microsoft 365-style tiles; none of these is official artwork. CapCut has no openly licensed mark, so it gets a neutral tile.
