---
name: Shared Ledger
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#b90538'
  on-tertiary: '#ffffff'
  tertiary-container: '#dc2c4f'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  metric-display:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.03em
  metric-display-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.025em
  tabular-amount:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter-xs: 0.25rem
  gutter-sm: 0.5rem
  gutter-md: 1rem
  gutter-lg: 1.5rem
  gutter-xl: 2rem
  gutter-2xl: 3rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
---

## Brand & Style

This design system delivers a calm, collaborative, and impeccably organized financial experience engineered specifically for couples managing intertwined domestic lives alongside autonomous personal budgets. The brand narrative balances mutual transparency with personal boundary respect, instilling confidence, emotional ease, and clear financial oversight without interpersonal friction.

The visual direction follows a **Modern Fintech / Precise Minimalist** approach. It is structured around tactile, card-oriented interfaces with generous whitespace, crisp structural separation, and clear contextual cues. The user experience pivots seamlessly between two primary environments:
- **Casa (Shared Domain):** Characterized by communal emerald and teal accents, stacked partner avatars, and joint responsibility indicators.
- **Pessoal (Individual Domain):** Characterized by focused indigo accents, individual telemetry, and the discreet, reassuring presence of the privacy security chip ("Só você vê isto").

The emotional tone avoids sterile spreadsheets and high-stress financial warnings. Instead, it offers calm clarity, rhythmic balance, and institutional precision.

## Colors

The palette establishes sharp operational boundaries between communal spaces, individual spaces, and critical financial statuses.

### Architectural Neutrals
- **Light Mode Ground:** Slate 50 (`#f8fafc`) serves as the base canvas, paired with pure White (`#ffffff`) for elevated interactive cards.
- **Dark Mode Ground:** Slate 950 (`#020617`) canvas with Slate 900 (`#0f172a`) container cards.
- **Content Hierarchy:** 
  - Primary text and prominent balances: Slate 900 (`#0f172a`) in light mode; Slate 50 (`#f8fafc`) in dark mode.
  - Secondary labels and table headers: Slate 700 (`#334155`) light; Slate 300 (`#cbd5e1`) dark.
  - Subdued metadata and helper notes: Slate 500 (`#64748b`) light; Slate 400 (`#94a3b8`) dark.
- **Dividers & Structural Borders:** Slate 200 (`#e2e8f0`) light; Slate 800 (`#1e293b`) dark.

### Domain Accents
- **Casa (Joint Hub):** Emerald 600 (`#059669`) with active teal highlights (`#10b981`). Surface washes use Emerald 50 (`#ecfdf5`) with Emerald 100 borders (`#d1fae5`) in light mode, and translucent emerald overlays (`rgba(5, 150, 105, 0.15)`) in dark mode.
- **Pessoal (Private Hub):** Indigo 600 (`#4f46e5`) with Indigo 500 highlights (`#6366f1`). Surface washes use Indigo 50 (`#eef2ff`) with Indigo 100 borders (`#e0e7ff`) in light mode, and translucent indigo overlays (`rgba(79, 70, 229, 0.15)`) in dark mode.

### Functional & Semantic Indicators
- **Surplus & Inflow:** Emerald 600 (`#059669`) / Emerald 500 (`#10b981`).
- **Deficit, Expense & Overspend:** Rose 500 (`#f43f5e`) / Rose 600 (`#e11d48`), balanced with Rose 50 (`#fff1f2`) surface tints.
- **Pending, Due & Warning:** Amber 500 (`#f59e0b`) / Amber 600 (`#d97706`), backed by Amber 50 (`#fffbeb`).

### Category Markers
- **Mercado (Groceries & Provisions):** Emerald 500 (`#10b981`).
- **Lazer (Leisure, Dining & Entertainment):** Violet 500 (`#8b5cf6`).
- **Moradia (Rent, Utilities & Supplies):** Sky 500 (`#0ea5e9`).
- **Outros (Miscellaneous & Uncategorized):** Slate 400 (`#94a3b8`).

## Typography

Typography centers on **Inter**, chosen for its neutral legibility, robust typographic weights, and comprehensive OpenType feature support.

### Numerical Data & Tabular Currency
To prevent misalignment across ledgers, transaction lists, and comparative balance sheets, all financial figures must use tabular figures:
- CSS declaration: `font-feature-settings: "tnum" 1, "cv05" 1;` or utility class `tabular-nums`.
- Major financial tiles utilize `metric-display` with tight tracking (`-0.03em`) to anchor the eye quickly to current liquid balances.

### Hierarchy Guidelines
- **Headlines (`headline-xl`, `headline-lg`):** Reserved for screen headers, month-year period selectors, and core space landing dashboards.
- **Section Headers (`headline-sm`):** Anchor individual card modules, such as upcoming invoices, category budget allocations, and account rosters.
- **Micro-labels (`label-sm`):** Set in semibold with positive letter-spacing (`0.025em`) for uppercase metadata headers, status pills, and the "Só você vê isto" indicator.

## Layout & Spacing

The system implements a responsive fluid grid with disciplined vertical rhythm based on an 8px base grid (subdivided into 4px increments for compact controls).

### Grid Structure
- **Desktop (≥ 1024px):** 12-column layout, max container width 1280px, auto-centered with `2.5rem` (`margin-desktop`) padding and `1.5rem` (`gutter-lg`) gutters.
- **Tablet (768px - 1023px):** 8-column layout with `1.5rem` margins and `1rem` gutters.
- **Mobile (< 768px):** 4-column single-column priority layout with `1rem` (`margin-mobile`) horizontal margins and `0.75rem` vertical card stacking.

### Reflow Rules
- **Dashboard Modular Cards:** Split into a 2/3 primary ledger column and a 1/3 quick-actions/targets sidebar on desktop, collapsing to an interleaved single stack on mobile screens.
- **Space Header Bar:** Contains the dual-avatar module or privacy badge alongside space toggles. On desktop, it aligns horizontally across the main header; on mobile, it anchors as a sticky pill bar immediately below the app bar.

## Elevation & Depth

Visual depth is achieved through quiet, flat layering combined with hairline borders and light-absorbing ambient drop shadows. Floating layers feel grounded rather than disconnected.

### Layer Hierarchy
1. **Base Surface (Level 0):** The app background (Slate 50 / Slate 950).
2. **Elevated Card Canvas (Level 1):** Pure white in light mode (`#ffffff`) and Slate 900 in dark mode (`#0f172a`), outlined by a 1px border (`border-slate-200` / `border-slate-800`). Card shadow uses a soft, dual-stop spread:
   `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px 0 rgba(15, 23, 42, 0.02);`
3. **Interactive & Hover States (Level 2):** Raised buttons, interactive transaction rows, and open flyouts subtly elevate:
   `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 10px 20px -2px rgba(15, 23, 42, 0.04);`
4. **Modals & Bottom Drawers (Level 3):** Highest elevation, overlaid on top of a 20% slate backdrop blur (`backdrop-blur-sm`):
   `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08);`

### Domain Lighting Tints
- When navigating the **Casa** view, key focus cards and active outlines receive an emerald-tinted rim highlight (`rgba(5, 150, 105, 0.1)`).
- When navigating the **Pessoal** view, focus borders and shadows receive an indigo glow (`rgba(79, 70, 229, 0.08)`).

## Shapes

The design uses a balanced rounded geometry to soften financial data density while maintaining structural order:

- **Core Cards & Modular Panels:** Set to `rounded-2xl` (`1rem` / 16px). This curvature defines the core visual character of the app.
- **Buttons, Field Inputs, & Selectors:** Set to `rounded-xl` (`0.75rem` / 12px), creating a nested proportional balance when placed inside `rounded-2xl` parent containers.
- **Pills, Chips, Avatars, & Segmented Switchers:** Fully rounded (`rounded-full` / 9999px) to signal micro-interactivity and state toggles.
- **Progress Trackers & Metric Bars:** Built with `rounded-full` caps to preserve smooth edge continuity.

## Components

### Space Segmented Control
The central navigation switch toggling between "Casa" and "Pessoal":
- Encased in a `rounded-full` container with Slate 100 (`#f1f5f9`) background and Slate 200 border.
- Active slide pill utilizes pure White background with `shadow-sm`.
- **Casa Active:** Emerald 700 text paired with a mini dual-avatar circular badge (18px diameter each, overlapping by 6px).
- **Pessoal Active:** Indigo 700 text paired with a discreet lock icon and privacy cue.

### Privacy Chip ("Só você vê isto")
- Placed in the top right of personal cards, balances, and individual transaction lists.
- Built using an ultra-compact `rounded-full` pill: Indigo 50 background, Indigo 200 border, Indigo 700 text, accompanied by a 12px closed-padlock SVG icon.
- In dark mode: Indigo 950/60 background with Indigo 800 border and Indigo 300 text.

### Stat Tiles
- Housed within `rounded-2xl` cards.
- Contains a muted label (`label-sm` in Slate 500), prominent balance (`metric-display` with `tabular-nums`), and a trend indicator pill (Emerald for positive delta, Rose for negative delta).
- Casa stat tiles incorporate subtle top-right dual-avatar markers displaying contribution breakdowns.

### Category Progress & Bar Lists
- Shows category name, spent amount, and allotted limit in a clean horizontal flex line.
- Background track is a 6px `rounded-full` bar in Slate 100 (`#f1f5f9`).
- Foreground fills use dynamic category tokens: Mercado (Emerald), Lazer (Violet), Moradia (Sky), Outros (Slate 400).
- Exceeded budget tracks automatically switch to a Rose 500 bar with a pulsed warning badge.

### Checklist & Bills (Paid / Unpaid)
- Item rows with leading custom rounded checkboxes (Emerald checkfill for Casa, Indigo checkfill for Pessoal).
- **Status Pills:** 
  - *Pago:* Emerald 50 background, Emerald 700 text, `rounded-full`, 11px font size.
  - *Pendente:* Amber 50 background, Amber 700 text.
  - *Atrasado:* Rose 50 background, Rose 700 text.
- Amounts styled with `tabular-nums` in `body-md` weight.

### Bank Account Cards
- Nested cards displaying institution monogram, linked account nickname, mask (`•••• 4821`), and synchronized balance.
- Accented with a 2px left border accent corresponding to space ownership (Emerald for joint joint-checking; Indigo for personal savings).

### Form Inputs & Buttons
- **Inputs:** `rounded-xl`, Slate 100/50 background, 1px Slate 200 border. Focus state replaces border with domain accent (Emerald 600 or Indigo 600) with a 3px ring blur of corresponding 15% opacity tint.
- **Buttons:** 
  - *Primary Casa:* Emerald 600 surface, White text, hover state Emerald 700.
  - *Primary Pessoal:* Indigo 600 surface, White text, hover state Indigo 700.
  - *Secondary:* Pure White surface, Slate 200 border, Slate 800 text, hover state Slate 50.