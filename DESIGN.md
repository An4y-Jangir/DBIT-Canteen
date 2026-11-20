---
name: Byte Canteen
colors:
  surface: '#faf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#faf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ef'
  surface-container: '#efeee9'
  surface-container-high: '#e9e8e3'
  surface-container-highest: '#e3e3de'
  on-surface: '#1b1c19'
  on-surface-variant: '#434933'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#747a60'
  outline-variant: '#c4caac'
  surface-tint: '#4f6600'
  primary: '#4f6600'
  on-primary: '#ffffff'
  primary-container: '#c8ff00'
  on-primary-container: '#597300'
  inverse-primary: '#a8d700'
  secondary: '#2d4fcf'
  on-secondary: '#ffffff'
  secondary-container: '#4b69ea'
  on-secondary-container: '#fffbff'
  tertiary: '#5e5e62'
  on-tertiary: '#ffffff'
  tertiary-container: '#edebef'
  on-tertiary-container: '#6a6a6d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0f500'
  primary-fixed-dim: '#a8d700'
  on-primary-fixed: '#161f00'
  on-primary-fixed-variant: '#3b4d00'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c3ff'
  on-secondary-fixed: '#001355'
  on-secondary-fixed-variant: '#0736ba'
  tertiary-fixed: '#e3e2e6'
  tertiary-fixed-dim: '#c7c6ca'
  on-tertiary-fixed: '#1b1b1f'
  on-tertiary-fixed-variant: '#46464a'
  background: '#faf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e3e3de'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  token-display:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.05em
  token-display-mobile:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.04em
  price-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-2xs: 0.25rem
  space-xs: 0.375rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system blends **Editorial Neo-brutalism** with high-velocity **Clean-Tech utilitarianism**, tailored for rapid campus food ordering, live kitchen queues, and student access. It rejects the sterile, homogenized SaaS aesthetic in favor of high-energy tactile interactions, bold graphic framing, and structural legibility. 

The aesthetic communicates urgency, efficiency, and youthful energy. Core elements include:
- Structural framing via crisp 1.5px deep obsidian ink borders.
- Tactile physical presence via hard 4px offset drop-shadows with zero blur radius.
- Kinetic hyper-contrast accents against a warm, grounded oat canvas.
- Editorial typographical hierarchy: high-impact geometric monospace/grotesque numbers for live order tokens paired with surgical Swiss-style body text.

## Colors

The palette establishes an aggressive visual hierarchy built for loud campus environments and fast mobile scanning:

- **Primary Accent (`#C8FF00`)**: Electric Cyber Lime. Reserved strictly for primary action vectors: checkout CTAs, "Add to Cart" triggers, active order collection states, and primary quantity confirms. Must always pair with `#121316` ink text for AA/AAA contrast.
- **Secondary Accent (`#3B5BDB`)**: Electric Cobalt. Powers real-time kitchen tracking, active queue token IDs, ETA counters, and authenticated status highlights.
- **Dark Brand & Ink (`#121316`)**: Deep Midnight Obsidian. Used for all primary borders, brutalist hard drop shadows, high-emphasis text, and inverted pill tags.
- **Canvas Base (`#F6F5F0`)**: Warm Alabaster / Oat Cream. Softens harsh screen glare while maintaining an editorial print-sheet backdrop.
- **Surface Elevation (`#FFFFFF`)**: Pure White. Applied to card containers, interactive tiles, sheets, and modal viewports.
- **System Indicators**:
  - Pure Veg: `#059669` (Emerald Green)
  - Non-Veg / Alert: `#DC2626` (Crimson)
  - Pending / Warning: `#F59E0B` (Amber Ochre)

## Typography

The type system balances technical punch with high-density data parsing:
- **Headings, Prices, & Live Token Digits**: Powered by **Space Grotesk**. Its sharp cuts and monospace-adjacent geometric architecture make pickup token numbers (e.g., `#B-108`) instantly identifiable across a crowded cafeteria.
- **Body & Functional Microcopy**: Powered by **Inter**. Provides clinical legibility for nutritional labels, ingredient notes, payment subtexts, and kitchen progress details.
- **Labels & Metadata**: Set in Space Grotesk Bold uppercase (`label-caps`) with deliberate wide tracking (+0.08em) to evoke boarding passes and production line telemetry.

## Layout & Spacing

The layout is anchored to an architectural, fluid grid with modular vertical rhythm:
- **Mobile (<768px)**: 4-column layout with 16px margins and 16px gutters. Compact vertical spacing to keep item scanning rapid and the sticky bottom checkout drawer immediately reachable.
- **Tablet (768px–1024px)**: 8-column layout with 24px margins and 24px gutters. Dual-pane layout separating the menu grid from active kitchen queue tickets.
- **Desktop (>1024px)**: 12-column layout max-width bounded at 1280px, center-aligned, with 40px margins. Three-column workspace split: Categories & Fast Filters (3 cols), Menu Matrix (6 cols), Real-time Campus Cart & Token Ledger (3 cols).

All element spacing follows a strict 4px/8px modular base scale (`space-2xs` to `space-2xl`). Spacing between nested interactive components must remain tight (4px–8px) to retain the dense, brutalist poster look.

## Elevation & Depth

This design system avoids blurred drop shadows and subtle gradients. Visual hierarchy is established via **physical hard-offset depth**:

- **Default Surface**: `#FFFFFF` background with a crisp `1.5px solid #121316` stroke and a `4px 4px 0px #121316` offset shadow.
- **Interactive Hover**: Translates `-2px -2px` with the shadow expanding to `6px 6px 0px #121316`.
- **Active / Pressed**: Translates `+2px +2px` with the shadow collapsing to `1px 1px 0px #121316` or `0px 0px 0px #121316`, delivering direct physical feedback.
- **Floating Overlays & Sticky Sheets**: `1.5px solid #121316` border with an emphasized `6px 6px 0px #121316` shadow.
- **Badge Depth**: Badges and status pills use a solid `1px` or `1.5px` border with a minimal `2px 2px 0px #121316` drop shadow.

## Shapes

The design system uses a controlled soft-brutalist radius (`roundedness: 1`):
- **Base Components (Cards, Buttons, Inputs, Dialogs)**: `4px` (`0.25rem`) radius. Retains an edgy, engineered feel without the pain points of razor-sharp 0px mobile corners.
- **Status Pills, Floating Badges, Dietary Chips**: Fully rounded pill shapes (`9999px`) to create high-contrast juxtaposition against the boxy grid.
- **Boarding-Pass Cutouts**: Ticket and order token components feature inward semi-circle cutouts (radius `8px`) positioned along the divider line to reinforce the physical meal voucher metaphor.

## Components

### Buttons
- **Primary Action (Cyber Lime)**: `#C8FF00` fill, `1.5px solid #121316`, text `#121316` (Space Grotesk, 700 wt, uppercase), `4px 4px 0px #121316` hard shadow.
- **Secondary Action (Inverted Obsidian)**: `#121316` fill, `#FFFFFF` text, `4px 4px 0px rgba(18, 19, 22, 0.3)`.
- **Tertiary Action (Outline)**: `#FFFFFF` fill, `1.5px solid #121316`, text `#121316`.

### Cards & Menu Items
- `#FFFFFF` background, `1.5px solid #121316` stroke, `4px 4px 0px #121316` offset.
- Contain food preview imagery bounded by a `1.5px` bottom border, clear category metadata, price rendered in `price-lg`, and an inline quantity stepper.

### Quantity Stepper
- Compact inline widget composed of three segmented blocks bound by `1.5px solid #121316`:
  - Decrement `[-]`: `#FFFFFF` hover to `#F6F5F0`.
  - Value Display: Space Grotesk bold, centered, `#FFFFFF` background.
  - Increment `[+]`: `#C8FF00` fill with `#121316` icon.

### Dietary Badges
- **Pure Veg**: White square container (`16x16px`, `1.5px solid #059669`) enclosing an `#059669` filled circle (`8x8px`).
- **Non-Veg**: White square container (`16x16px`, `1.5px solid #DC2626`) enclosing an `#DC2626` filled equilateral triangle.

### Boarding-Pass Pickup Token
- Two-section card divided by a dashed `1.5px` stroke with bilateral inward punch-holes.
- **Top Section**: Live token code (e.g., `A-42`) in `token-display`, counter pickup station number, and real-time prep progress bar.
- **Bottom Section**: Compact item summary, timestamp, and a scannable dynamic QR verification code.

### Status Indicators & Live Prep Badges
- Live state chips use the `#3B5BDB` Cobalt container or `#C8FF00` Lime container with an internal pulsating dot (`6x6px`) indicating live kitchen activity ("Preparing", "Ready for Pickup", "Overdue").

### UPI & Payment Quick Tiles
- High-density selectable tiles with `1.5px solid #121316` borders. Selected state switches background to `#C8FF00` with hard inset outline styling.