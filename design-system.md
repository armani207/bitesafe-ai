# BiteSafe Design System

You are building a diabetes-friendly meal scanner with a **professional, clinical health UI** and a **dark blue** visual identity. Theme follows system preference (light/dark); both modes are defined below.

Use this doc as the single source of truth. When the UI drifts, point to a reference: e.g. "Match the buttons on the Scan page" or "Use the same card style as History list items."

---

## Color Palette

Colors are implemented as CSS variables in `src/index.css` using HSL (no space after comma: `hsl(var(--primary))`). **Never introduce colors outside these tokens.**

### Light mode (`:root`)

| Role | Token | HSL | Use |
|------|--------|-----|-----|
| Background | `--background` | 210 20% 98% | Main canvas |
| Surface | `--card` | 0 0% 100% | Cards, modals, elevated elements |
| Primary | `--primary` | 210 35% 28% | Main actions, key UI, CTAs |
| Secondary | `--secondary` | 210 18% 95% | Supporting elements, secondary buttons |
| Text primary | `--foreground` | 215 25% 17% | Headings, body |
| Text secondary | `--muted-foreground` | 215 12% 42% | Captions, placeholders, helper text |
| Border | `--border` | 210 18% 89% | Dividers, input outlines |
| Input fill | `--input` | 210 18% 92% | Input backgrounds |
| Ring / focus | `--ring` | 210 35% 28% | Focus rings |
| Success | `--success` | 160 30% 40% | Success states |
| Warning | `--warning` | 35 75% 48% | Warnings |
| Error / destructive | `--destructive` | 0 60% 50% | Errors, destructive actions |
| Accent | `--accent` | 188 35% 38% | Links, accents |
| Suggestion | `--suggestion` | 210 20% 96% | Suggestion cards |
| Risk high | `--risk-high` | 0 55% 52% | High risk badge |
| Risk medium | `--risk-medium` | 35 70% 48% | Medium risk |
| Risk low | `--risk-low` | 162 35% 42% | Low risk |

### Dark mode (`.dark`)

| Role | Token | HSL | Use |
|------|--------|-----|-----|
| Background | `--background` | 218 32% 7% | Main canvas |
| Surface | `--card` | 218 28% 10% | Cards, modals |
| Primary | `--primary` | 212 70% 58% | Main actions, CTAs |
| Secondary | `--secondary` | 218 28% 14% | Supporting elements |
| Text primary | `--foreground` | 212 25% 95% | Headings, body |
| Text secondary | `--muted-foreground` | 212 18% 55% | Captions, placeholders |
| Border | `--border` | 218 22% 18% | Dividers, outlines |
| Input fill | `--input` | 218 22% 16% | Input backgrounds |
| Ring / focus | `--ring` | 212 70% 58% | Focus rings |
| Success | `--success` | 162 40% 45% | Success states |
| Warning | `--warning` | 35 70% 50% | Warnings |
| Error / destructive | `--destructive` | 0 55% 52% | Errors, destructive actions |
| Accent | `--accent` | 198 50% 48% | Links, accents |
| Suggestion | `--suggestion` | 218 26% 16% | Suggestion cards |
| Risk high/medium/low | `--risk-high`, etc. | (see `index.css`) | Risk badges |

Use semantic tokens in Tailwind: `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, etc.

---

## Typography

- **Font family:** DM Sans (Google Fonts). Fallbacks: system-ui, -apple-system, sans-serif.
- **Headings:** `font-semibold`, `tracking-tight`, letter-spacing -0.02em.
- **Body:** Regular weight. Base font size 15px in `html`; use Tailwind text scale for components.
- **Size scale (Tailwind):** 12px (text-xs), 14px (text-sm), 16px (text-base), 18px (text-lg), 20px (text-xl), 24px (text-2xl), 30px (text-3xl), 36px (text-4xl). Extra: 11px (text-2xs) for tight UI.
- **Line height:** 1.5 default; headings use `leading-none` or default.

---

## Spacing Scale

4px base. Use only these step values (Tailwind: 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 6 = 24px, 8 = 32px, 12 = 48px, 16 = 64px).

**Use:** 4, 8, 12, 16, 24, 32, 48, 64px. Prefer `p-4`, `gap-3`, `space-y-4`, etc. **No arbitrary values** (e.g. avoid `p-5`, `gap-7`) unless the scale is extended in this doc.

---

## Border Radius

- **Small (inputs, chips):** `rounded-md` — calc(var(--radius) - 4px) ≈ 8px
- **Medium (buttons, cards):** `rounded-lg` — var(--radius) = 0.75rem (12px)
- **Large (modals, containers):** `rounded-xl` / `rounded-2xl` — 16px / 20px
- **Full (avatars, pills, FAB):** `rounded-full` — 9999px

Base token: `--radius: 0.75rem` (12px).

---

## Shadows

Use Tailwind classes; do not add new shadow values.

- **Subtle:** `shadow-soft` — 0 2px 8px -2px rgba(0,0,0,0.08)
- **Medium:** `shadow-medium` — 0 4px 16px -4px rgba(0,0,0,0.12)
- **Strong:** `shadow-strong` — 0 8px 32px -8px rgba(0,0,0,0.16)
- **Semantic:** `shadow-risk`, `shadow-success` for risk/success cards

Cards use `shadow-sm` by default and `hover:shadow-md` (or `shadow-soft` via `.card-hover`).

---

## Transitions & Motion

- **Easing:** cubic-bezier(0.32, 0.72, 0, 1) — soft deceleration.
- **Classes:** `transition-smooth` (300ms), `transition-smooth-fast` (200ms). Use on interactive elements.
- **Card hover:** `.card-hover` — hover: lift 2px + shadow-soft; active: scale 0.99.
- **Card entrance:** `.card-enter` — fade + translateY(10px) + scale(0.98) → 0.45s.
- **Buttons:** `active:scale-[0.97]`; use `transition-smooth-fast`.
- **Framer Motion:** Prefer shared variants from `@/lib/animations` (e.g. `pageTransition`, `springMicro`, `tapScaleLight`, `staggerContainer`, `staggerItem`). Keep motion subtle and consistent.

---

## Component Patterns

### Buttons

- **Default size:** height 40px (h-10), padding 16px horizontal (px-4), vertical (py-2). `rounded-md`, `text-sm font-medium`.
- **Sizes:** `sm` h-9 px-3; `lg` h-11 px-8; `icon` h-10 w-10.
- **States:** Focus ring 2px using `ring-ring`; hover per variant (e.g. primary: `hover:bg-primary/90`); active scale 0.97. Use `transition-smooth-fast`.
- **Variants:** default (primary), outline, secondary, ghost, destructive, link. Use `Button` from `@/components/ui/button` and `buttonVariants` for consistency.

### Inputs

- **Height:** 40px (h-10). Padding 12px horizontal (px-3), 8px vertical (py-2).
- **Border:** 1px `border-input`. **Focus:** 2px ring `ring-ring`, `ring-offset-background`. Use `transition-smooth-fast`.
- **Placeholder:** `text-muted-foreground`. Use `Input` from `@/components/ui/input`.

### Cards

- **Container:** `rounded-lg`, `border border-border`, `bg-card`, `shadow-sm`, `transition-smooth`, `hover:shadow-md`. For interactive cards add `card-hover` for lift + shadow on hover.
- **Padding:** CardHeader / CardContent use `p-6` (24px). CardFooter `p-6 pt-0`.
- **Titles:** `text-2xl font-semibold tracking-tight`. Descriptions: `text-sm text-muted-foreground`.

### Suggestion / tip cards

- **SuggestionCard:** `rounded-xl`, `bg-suggestion`, `px-4 py-3`, `gap-3`, `transition-smooth card-enter card-hover`, `hover:bg-suggestion/80`. Icon container: `rounded-lg bg-primary/10 text-primary`, 32px (h-8 w-8).

---

## Rules

1. **Never introduce colors outside this palette.** Use only the CSS variables / Tailwind semantic colors (background, foreground, primary, muted, etc.).
2. **Always use the spacing scale** — 4, 8, 12, 16, 24, 32, 48, 64px. No arbitrary spacing (e.g. p-5, gap-7) unless added to this doc.
3. **Consistent border radius** — small for inputs/chips (rounded-md), medium for buttons/cards (rounded-lg), large for modals (rounded-xl/2xl), full for avatars/pills.
4. **When in doubt, add more whitespace.** Prefer `space-y-4`, `gap-4`, `p-6` over tighter layouts for a calm, clinical feel.

---

## Reference Components

- **Primary CTA:** Scan page — main "Take Photo" / "Demo Analysis" buttons (Button size lg, primary and outline).
- **Cards:** History list meal cards; Scan result cards; Profile health profile block. Use `Card` + `card-hover` where interactive.
- **Form:** Onboarding steps (inputs, labels, primary submit button).
- **Navigation:** Bottom nav uses primary for center FAB, muted-foreground for icons; active state uses `text-primary` and layout indicator.

Keep new UI consistent with these screens. If something looks off, compare to this doc and the reference components above.
