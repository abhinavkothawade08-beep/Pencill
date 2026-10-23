---
name: Academic Editorial
colors:
  surface: '#faf8ff'
  surface-dim: '#d5d9ed'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e3e7fb'
  surface-container-highest: '#dee2f5'
  on-surface: '#161b29'
  on-surface-variant: '#43474c'
  inverse-surface: '#2b303f'
  inverse-on-surface: '#eef0ff'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4e6073'
  primary: '#162839'
  on-primary: '#ffffff'
  primary-container: '#2c3e50'
  on-primary-container: '#96a9be'
  inverse-primary: '#b5c8df'
  secondary: '#7c572d'
  on-secondary: '#ffffff'
  secondary-container: '#fecb97'
  on-secondary-container: '#79542a'
  tertiary: '#00274c'
  on-tertiary: '#ffffff'
  tertiary-container: '#003d71'
  on-tertiary-container: '#66a9fd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4fb'
  primary-fixed-dim: '#b5c8df'
  on-primary-fixed: '#091d2e'
  on-primary-fixed-variant: '#36485b'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#efbd8a'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#614018'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#faf8ff'
  on-background: '#161b29'
  surface-variant: '#dee2f5'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies scholarly rigor, intellectual clarity, and contemporary curation. It balances the timeless gravitas of classic academic institutions with the functional, frictionless utility of modern knowledge software. 

The visual style merges **Editorial Minimalism** with **Systematic Utility**:
- **Clarity over ornament:** Interfaces prioritize deep focus, legibility, and distraction-free cognitive flow. Visual noise is systematically reduced.
- **Paper & Ink tactile sensibility:** The digital workspace references archival print culture—soft paper-like surfaces, sharp ink contrast, and structured typographical hierarchy—without resorting to nostalgic skeuomorphism.
- **Architectural structure:** Grids and modules convey stability, intentionality, and academic authority, organizing disparate internet resources into coherent pedagogical journeys.

## Colors

The color palette establishes an environment of focused study through disciplined, purposeful application:

- **Primary (`#2C3E50` - Deep Navy):** Anchors navigation, structural headers, high-emphasis interactive surfaces, and core brand assets.
- **Secondary (`#D4A574` - Warm Sand):** Infuses warmth, human craftsmanship, and refined editorial accenting into milestone badges, curated callouts, and progress highlights.
- **Tertiary (`#4A90E2` - Academic Blue):** Communicates active focus, selected states, link affordances, and dynamic syllabus interactions.
- **Canvas & Surface Architecture:** 
  - Canvas Base: `#F7F8FC` (calm, paper-soft off-white to eliminate optical fatigue).
  - Elevated Container / Cards: `#FFFFFF` (crisp white for distinct reading modules).
- **Ink & Typography Hierarchy:**
  - Ink Primary: `#1D2230` (high-contrast, deep neutral ink for prolonged reading).
  - Ink Secondary: `#6D7280` (balanced mid-tone for metadata, syllabus node counters, and captions).
- **Hairlines & Dividers:**
  - Hairline Border: `#E1E4ED` (1px low-contrast boundaries that organize content without boxing it in).
- **Semantic Feedback:**
  - Success: `#5C9275` (sage green for completed modules and mastered skills).
  - Warning: `#D99B62` (subdued amber for pacing notices and prerequisite flags).
  - Error: `#C95C5C` (restrained crimson for validation and interrupted paths).

## Typography

The typographic system utilizes a dual-font structure designed to reconcile narrative immersion with dense programmatic data:

- **Editorial Headings (Source Serif 4):** Reserved for syllabus titles, curated milestone introductions, learning objectives, and hero anchors. Its classical character brings academic rigor and deliberate pacing.
- **Interface & Mechanics (Inter):** Deployed across functional UI, data-dense curriculum trees, time-to-read tags, interactive forms, and navigation controls. Its neutral clarity ensures effortless processing during intense study sessions.
- **Optical Hierarchy:** Large display headings use tighter negative tracking for editorial cohesion. Small labels and metadata leverage expanded tracking (`+0.02em` to `+0.04em`) to maintain sharp legibility at 11px and 12px.

## Layout & Spacing

The layout is constructed on an intentional 8pt spatial grid with generous breathing room to reduce cognitive load:

- **Grid Architecture:**
  - **Desktop (1024px+):** 12-column structured layout with an asymmetric content flow (e.g., 4-column persistent curriculum navigation alongside an 8-column reading and resource canvas). Outer margin: `2.5rem` (`40px`), gutter: `1.5rem` (`24px`). Max-width container capped at `1280px` for optimal ocular span.
  - **Tablet (768px - 1023px):** 8-column layout. Margin: `2rem` (`32px`), gutter: `1rem` (`16px`). Navigation shifts into collapsible side panels.
  - **Mobile (< 768px):** Single-column stacked vertical progression. Margin: `1rem` (`16px`), gutter: `1rem` (`16px`).
- **Vertical Rhythm:** Content modules adhere strictly to vertical increments of `0.5rem` (8px), `1rem` (16px), `1.5rem` (24px), and `2.5rem` (40px). Generous space separates distinct thematic syllabus sections, preventing dense lists of academic resources from feeling overwhelming.

## Elevation & Depth

Depth in the system is tactile, flat-academic, and paper-derived, avoiding high-gloss or heavily blurred treatments:

- **Structural Outlines:** Hierarchy is primarily defined by crisp 1px hairline borders (`#E1E4ED`) rather than heavy drop shadows. Surfaces feel like distinct cards resting neatly on an archival study desk.
- **Ambient Paper Shadows:**
  - **Level 0 (Resting Cards & Modules):** `box-shadow: none; border: 1px solid #E1E4ED; background: #FFFFFF;`
  - **Level 1 (Hovered Pathways / Active Nodes):** `box-shadow: 0px 2px 8px -1px rgba(29, 34, 48, 0.05), 0px 1px 3px 0px rgba(29, 34, 48, 0.03); border-color: #D4A574;`
  - **Level 2 (Dropdowns, Overlays, Path Selectors):** `box-shadow: 0px 8px 24px -4px rgba(44, 62, 80, 0.08), 0px 2px 6px -1px rgba(44, 62, 80, 0.04); border: 1px solid #E1E4ED;`
- **Surface Layering:** Content resting directly on the canvas (`#F7F8FC`) utilizes solid `#FFFFFF` cards to denote actionable units of study.

## Shapes

The geometric signature is grounded, tailored, and strictly non-juvenile:

- **Standard Elements (`rounded-md`, 8px):** Form inputs, action buttons, curriculum nodes, and code snippets adopt an 8px radius for a clean, architectural finish.
- **Container Surfaces (`rounded-lg`, 12px):** Primary study cards, pathway containers, reading frames, and modal dialogs use a 12px radius, providing a softened edge while preserving structural clarity.
- **Tags & Status Badges (`rounded-full`):** Category tags and completion indicators utilize fully circular pill geometries strictly for compact contextual labels, ensuring instant differentiation from structural rectangular modules.

## Components

### Buttons
- **Primary:** Solid Deep Navy (`#2C3E50`) with white text, 8px border radius, 12px/20px padding. Hover: `#1F2C3A`. Active: subtle 0.98 scale transition.
- **Secondary / Outline:** Background `#FFFFFF`, 1px border (`#E1E4ED`), text `#2C3E50`. Hover: background `#F7F8FC`, border `#2C3E50`.
- **Tertiary / Ghost:** No border, text `#4A90E2`. Hover: background `rgba(74, 144, 226, 0.08)`.

### Chips & Metadata Badges
- **Curated / Warm Accent:** Background `rgba(212, 165, 116, 0.15)`, text `#8A5C2B`, 1px border `rgba(212, 165, 116, 0.3)`. Used for difficulty, milestone, and AI-curated indicators.
- **Resource Format Chips:** Background `#F7F8FC`, border `#E1E4ED`, text `#6D7280`. Compact 4px/8px padding with label-sm font.

### Form Inputs & Goal Search
- **Input Fields:** Background `#FFFFFF`, 1px border `#E1E4ED`, 8px border radius, font-body-md, text `#1D2230`. Focus: border `#4A90E2`, subtle ring `0 0 0 3px rgba(74, 144, 226, 0.15)`.
- **Prompt / Path Generator Bar:** Large single-line or multi-line area with `#FFFFFF` background, elevated with Level 1 shadow, featuring an embedded Warm Sand or Deep Navy generation trigger.

### Checkboxes & Progress Indicators
- **Curriculum Checkbox:** 18px square, 4px border radius, 1px border `#E1E4ED`. Checked: background `#5C9275`, border `#5C9275` with sharp white checkmark.
- **Progress Line / Step Node:** Connecting hairline paths in `#E1E4ED`. Active steps highlighted in `#4A90E2`, completed in `#5C9275`.

### Resource & Pathway Cards
- White `#FFFFFF` base, 1px border `#E1E4ED`, 12px radius, `1.5rem` internal padding. 
- Top row: source badge (e.g., "MIT OpenCourseWare", "ArXiv") and estimated reading time. 
- Middle: headline-sm in `#1D2230`.
- Bottom: completion status, key takeaways, and action trigger. Hover state subtly highlights the border in Academic Blue or Warm Sand.