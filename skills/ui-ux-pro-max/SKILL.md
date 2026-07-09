---
name: ui-ux-pro-max
description: Use this skill when designing, building, reviewing, or refactoring UI/UX for web and mobile apps — pages (landing, dashboard, admin, SaaS, e-commerce, portfolio, blog, mobile), components (buttons, modals, navbars, sidebars, cards, tables, forms, charts), or making decisions about color schemes, typography, spacing, layout, navigation, animation, accessibility, or visual consistency. Also trigger when the user asks to plan, create, implement, fix, improve, optimize, enhance, or check UI/UX code. Provides 50+ styles (glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design), 161 color palettes, 57 font pairings, 161 product types, 101 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, HTML/CSS). Integrates with shadcn/ui MCP for component search and examples.
---

# UI/UX Pro Max

Use this skill for UI/UX design decisions across web and mobile: pages, dashboards, admin tools, SaaS, ecommerce, forms, tables, charts, navigation, accessibility, color, typography, responsive layout, and visual consistency.

## Load References

Use the bundled data files and scripts for concrete palette, typography, component, and UX research; inspect the target project's design system before choosing an implementation pattern.

Use the `data/` CSV files as the source of detailed options and recommendations:

- `styles.csv`, `colors.csv`, `typography.csv`, `products.csv` for visual direction.
- `ux-guidelines.csv` for usability rules.
- `charts.csv` for chart selection.
- Stack-specific files such as `react.csv`, `nextjs.csv`, `tailwind.csv`, `shadcn.csv`, `swiftui.csv`, `react-native.csv`, `flutter.csv`, `vue.csv`, `svelte.csv`, `html-css.csv` when implementation details matter.

## Apply When

Use this skill when the task involves interface structure, interaction patterns, visual quality, accessibility, or user experience. Skip it for pure backend, infrastructure, non-visual scripts, or performance work unrelated to UI.

## Core Workflow

1. Identify product type, audience, platform, and task frequency.
2. Choose layout density and information hierarchy before choosing aesthetics.
3. Select style, palette, and typography based on product context, not novelty.
4. Design the key states: loading, empty, error, success, disabled, hover/focus/active, responsive breakpoints.
5. Validate accessibility, scanability, affordances, spacing, and touch targets.
6. Check visual coherence against the rest of the project.

## Generated Visual Assets

When the interface would materially benefit from original imagery and no suitable project assets exist, consider using ChatGPT image generation to create bitmap assets.

Use generated images for hero backgrounds, editorial visuals, empty states, onboarding illustrations, abstract or product-adjacent backgrounds, textures, mockups, and non-branded placeholder imagery that should feel custom.

Do not use generated images when the task requires an accurate real product, real person, real venue, official logo, trademarked asset, or inspectable factual image. Use provided assets, verified sources, or ask the user instead.

Save generated assets in the appropriate project asset/public directory, use descriptive filenames, optimize dimensions/format, and add meaningful alt text when the image conveys content.

## Non-Negotiables

- Prioritize clarity, task completion, and scannability over decoration.
- Use restrained hierarchy for operational tools; avoid marketing-style composition in dashboards/admin apps.
- Do not use one-note palettes or generic gradients as the whole design system.
- Preserve readable contrast, focus states, keyboard access, and responsive behavior.
- Make components feel complete: states, errors, loading, empty content, and sensible defaults.
- When using shadcn/ui, pair this skill with `$shadcn` for component-specific implementation.

## Delivery Checklist

- The first screen is the actual useful experience unless a landing page is explicitly requested.
- Typography scale matches the component density.
- Controls use familiar UI patterns and icons where appropriate.
- Text fits containers on mobile and desktop.
- Color, motion, and spacing support the product's job instead of overwhelming it.
