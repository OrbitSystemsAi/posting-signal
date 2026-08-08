---
name: compare-interface-fidelity
description: Compare an implemented interface with an approved visual reference using reproducible browser captures, measured geometry, typography, color, content, and interaction checks. Use for mockup-to-build fidelity reviews, annotated side-by-side comparisons, responsive validation, and visual sign-off.
---

# Compare interface fidelity

Treat the user's real route and browser render as the implementation source of truth. Never substitute a separately styled preview, generated reconstruction, or stale screenshot.

## Required inputs

Record these before comparing:

- Reference image and its native pixel dimensions.
- Exact implementation URL and route.
- Browser, CSS viewport, device-pixel ratio, browser zoom, and scroll position.
- Authentication, data, selected filters, interaction state, feature flags, and commit SHA.
- Known intentional deviations approved by the user. Keep these visible in the report; label them `intentional`, not `matched`.

If any required input is unknown, measure it or state the limitation. Do not silently infer a matching environment.

## Capture protocol

1. Open the exact route the user will inspect.
2. Set browser zoom to 100% unless the reference specifies otherwise.
3. Capture at the reference viewport first. Also capture the user's reported viewport when different.
4. Wait for fonts, images, authentication, and application data to settle.
5. Reset scrolling to the same position and reproduce the same selected and hover states.
6. Save the unmodified screenshots and capture metadata.

The reference and implementation captures used for sign-off must have the same
CSS viewport, device-pixel ratio, zoom, scroll position, and deterministic
application state. If the reference viewport cannot be established, the review
cannot pass. A best-fit side-by-side image is diagnostic evidence only.

Use this metadata block beside every review:

```text
reference: <absolute path>, <width>x<height>
implementation: <URL>, <browser>
viewport: <CSS width>x<CSS height>, DPR <value>, zoom <percent>
state: <auth/data/filter/selection/scroll>
revision: <git SHA>
captured: <ISO timestamp and timezone>
```

## Normalize without hiding differences

- Preserve each screenshot's aspect ratio.
- Never stretch, non-uniformly resize, or crop content to manufacture a match.
- Compare at equal CSS-pixel scale whenever possible.
- For the primary sign-off image, require `1 reference CSS px = 1
  implementation CSS px = 1 report px`. Do not independently resize panels to
  make them occupy similar areas.
- A uniformly reduced overview is allowed only after the two source captures
  have identical dimensions and only when the same scale factor is applied to
  both. Include 1:1 crops for every region whose detail is not legible in the
  overview.
- When aspect ratios differ, letterbox the shorter capture on a neutral field and label both dimensions.
- Produce an additional reference-viewport capture before declaring fidelity if the user's viewport differs from the reference.
- Never add a viewport-height breakpoint merely to fit an entire desktop composition above the fold. Preserve the accepted scale and hierarchy; allow document scrolling unless the accepted reference explicitly shows a compact-height variant.

## Preserve geometric invariants

- Represent circles with a square layout box plus `aspect-ratio: 1`; do not rely on `border-radius: 50%` to correct unequal width and height.
- Represent squares, circular masks, avatars, selected navigation discs, and source image frames with explicit aspect-ratio invariants.
- Audit the computed width and height after every responsive transform. A uniformly scaled circle must still satisfy `abs(width - height) <= 1 CSS px`.
- Avoid independently overriding width and height across media queries. Override one dimension and preserve the declared aspect ratio.
- Treat masked PNG and SVG marks the same way: validate the CSS box ratio in addition to the asset's intrinsic ratio.

## Measure before judging

Measure bounding boxes and deltas for:

- Header, logo, utility controls, and page controls.
- Page title, supporting copy, and decorative geometry.
- Lead card, image, copy column, metadata, and supporting rows.
- Action bar and bottom navigation.
- Repeated-item spacing, gutters, margins, and responsive breakpoints.
- Every decorative asset: motif identity, intrinsic and computed aspect ratio,
  bounding box, clipping boundary, stacking order, and content occlusion.
- Identify the asset and the containment defect separately. A correct mark in
  the wrong containing block must be repositioned or clipped by its approved
  region; do not replace it with an older motif merely because that older motif
  appeared in an earlier reference.

Inventory computed typography for every distinct role: font family, size, weight, line height, letter spacing, wrapping, and alignment. Sample foreground, background, border, accent, and state colors. Compare exact copy, capitalization, labels, icon family, image source, crop, and state.

Create a machine-readable mismatch ledger before editing. Give every visible
region its own row with reference and implementation bounding boxes, computed
styles, content/state values, pixel-difference result, status, and resolution.
Do not merge unrelated failures into one row.

Use these default tolerances unless the accepted specification says otherwise:

- Anchor position, width, height, gap, radius, and line height: `0 CSS px` for
  exact references; at most `1 CSS px` for rasterization rounding.
- Circles and squares: absolute width/height delta at most `1 CSS px`.
- Font family, weight, wrapping, copy, icon inventory, imagery, state, and
  decoration identity: exact.
- Color channels: exact for tokens; at most one 8-bit channel step for captured
  antialiasing.
- Pixel difference: every remaining cluster must map to an approved intentional
  deviation. An unexplained cluster is a failure regardless of its area.

Freeze dates, seeded records, filters, selections, authentication display, and
feature flags before capture. A layout cannot pass against a reference that
shows different calendar dates, event counts, selected days, or sidebar data.

## Annotated comparison format

Create one side-by-side image containing:

- `ORIGINAL REFERENCE` and `ACTUAL IMPLEMENTATION` labels.
- Native dimensions and capture route/viewport.
- Numbered red outlines on the implementation, with the corresponding reference region apparent beside it.
- A numbered written legend in the same image.
- Separate labels for `intentional deviation` and `unresolved mismatch`.
- A prominent overall `PASS`, `FAIL`, or `REFERENCE MISSING` label. Never use a
  green check, “verified,” “final,” or equivalent success language while a
  mismatch ledger row remains unresolved.
- A pixel-difference overlay and 1:1 detail crops for typography, controls,
  decoration, and navigation when the overview cannot reveal the mismatch.

Every marker must map to one legend item. Do not combine unrelated differences merely to reduce the count. Do not invent a percentage fidelity score.

## Review categories

Evaluate each category as `match`, `intentional deviation`, `unresolved mismatch`, or `not comparable`:

1. Viewport and responsive mode
2. Information architecture and content
3. Global header and controls
4. Geometry and spatial composition
5. Typography and wrapping
6. Imagery and crop
7. Decorative brand elements
8. Cards, borders, radii, and surfaces
9. Icons and metadata
10. Actions and interaction states
11. Bottom navigation
12. Overflow, clipping, and accessibility
13. Deterministic date, data, count, and selection state
14. Decoration identity, clipping, stacking, and content occlusion
15. Absolute scale and density at 1:1 CSS-pixel scale

## Responsive matrix

At minimum verify:

- Exact reference viewport.
- User's actual reported viewport.
- Desktop 1440x900.
- Tablet 1024x768.
- Mobile 393x852.

Do not let a compact-height breakpoint redefine the desktop composition unless the reference demonstrates that behavior.

## Multi-page projects

1. Inventory every user-visible route, modal, editor state, and navigation destination before implementation.
2. Identify the accepted reference for each surface. Never assume one page's screenshot is a complete specification for another page.
3. Extract shared tokens and primitives first: header, logo, decoration, typography, controls, cards, icons, and navigation.
4. Fix shared primitives before route-specific CSS. Re-capture every consumer after a shared change.
5. Keep a route matrix containing reference path, URL, required state, viewport, interaction proof, and final comparison path.
6. Create one final side-by-side comparison per surface. If no accepted reference exists, label the left side `baseline implementation`; never mislabel it as an original mockup.
7. Do not use a preview-only route as evidence for the production route unless both renders are captured and verified equivalent.
8. A shared design language is not an accepted page reference. Pages without an
   accepted reference may receive shared-token fixes, but their comparison must
   remain `REFERENCE MISSING`; do not call them visually final.
9. After any shared primitive changes, invalidate every prior page pass and
   recapture every consumer.

## Fail-closed inspection sequence

For every page, perform these passes in order. A failure stops sign-off but does
not stop remediation.

1. **Provenance:** confirm the accepted reference, actual route, revision, and
   browser state.
2. **Capture equivalence:** confirm identical viewport, DPR, zoom, scroll, font
   readiness, and deterministic data.
3. **Inventory:** compare all text, icons, images, controls, events, labels,
   decorative marks, and navigation destinations.
4. **Geometry:** measure outer chrome, regions, anchors, boxes, gaps, alignment,
   responsive mode, and density.
5. **Computed style:** compare typography, color, border, radius, shadow,
   clipping, object fit/position, and stacking.
6. **Pixel evidence:** inspect a difference overlay plus 1:1 crops. Record every
   visible cluster in the mismatch ledger.
7. **Interaction:** verify selected, hover, focus, open, empty, loading, and
   populated states required by the reference.
8. **Occlusion:** verify decoration and fixed chrome do not cover labels, dates,
   cards, controls, or scrollable content.
   Confirm that marks specified as navigation decoration are descendants of, or
   clipped to, the navigation region and have no painted pixels in the content
   region.
9. **Responsive regression:** repeat at the required matrix sizes.
10. **Independent recount:** perform a final top-left-to-bottom-right visual
    sweep without relying on the existing ledger. Add anything newly observed.

Only issue `PASS` when every pass is complete and every ledger row is `match` or
an individually documented, user-approved `intentional deviation`.

## Lessons from prior fidelity failures

- A screenshot generated from a separately calibrated preview can conceal defects present in the browser route the user actually sees.
- Matching screenshot dimensions is not sufficient when CSS viewport, device-pixel ratio, zoom, or responsive mode differs.
- Compressing typography, cards, imagery, and navigation to fit a short viewport changes hierarchy rather than solving responsiveness.
- `border-radius: 50%` produces an ellipse when the element's computed box is not square.
- A global CSS file with repeated late overrides makes fixes fragile. Consolidate each shared primitive into one authoritative rule or documented layer.
- Functional success and a passing build do not constitute visual fidelity. Require an actual-route screenshot and direct reference inspection.
- Equal-sized report panels can conceal different native scale. The source
  captures—not the report boxes—must be dimensionally equivalent.
- A narrow geometry check cannot justify a page-level success badge. Verification
  is conjunctive: every region, state, asset, and interaction must pass.
- Decorative marks are functional layout participants when they overlap the
  content plane. Treat a wrong motif or an occluding motif as a blocking defect.

## Sign-off gate

Do not call the implementation complete until all of these are true:

- The actual user-facing route was captured in the named browser.
- Reference and implementation were visually inspected at original resolution.
- No unexplained viewport, zoom, state, font, or data difference remains.
- All unresolved mismatches are fixed or explicitly accepted by the user.
- A fresh side-by-side comparison uses the post-fix capture.
- The comparison includes the complete mismatch ledger, a pixel-difference
  overlay, and 1:1 detail crops.
- Every row is matched or explicitly accepted by the user; absence of an
  accepted page reference is reported as `REFERENCE MISSING`, never a pass.
- Layout is also checked at the responsive matrix sizes without overlap or clipping.

If the implementation only resembles a separately generated preview, report that as a failure of the sign-off gate.
