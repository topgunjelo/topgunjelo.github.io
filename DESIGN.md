# Design rules

From Markie's rebuild brief (2026-11-20). Read before changing layout or motion. These replace the earlier manga-noir rules.

## Direction

- **Apple-inspired and mostly white.** About 80–90% of the page is white or near-white. Color comes from objects (the lens, logos, gradients, hover glows), not from backgrounds.
- **One visual object: the lens.** A glass sphere of slow blue/cyan/lavender light. It's the intro's point of light, the hero sculpture, and the closing image in Contact. It stands for looking closer, at interfaces and at evidence. Don't add a second decorative system.
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
- The intro's name and the hero name share `.name-type` and per-glyph spans (`NameGlyphs`), so the intro copy lands on the hero copy exactly. Keep them identical.
- Looping CSS animations sit under `usePauseOffscreen` so they stop when out of view.
- Pointer effects (tilt, parallax, magnetic buttons) only run with a fine pointer and without reduced motion. Hover is never the only way to reach information.

## Content

- **Concise and factual.** No invented metrics, titles, dates or achievements. Collaborator access alone doesn't prove someone authored a feature.
- Private projects show high-level summaries only, with no links or screenshots.
- No portrait is published until an approved photo exists. Don't use generated people.
- The GWA (95.69) appears with the LMI Highest Honors. The 2026-11-20 rebuild brief asked for it, which overrides the earlier "GWA never appears" rule.
- Logos come from Devicon (MIT). Lightroom and Premiere Pro are drawn in Adobe's tile style. CapCut has no openly licensed mark, so it gets a neutral tile.
