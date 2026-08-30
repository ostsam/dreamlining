# Dreamlining visual system

## Direction

**A thoughtful host’s table:** crisp white surfaces, an ink-like indigo anchor, coral invitations, and small moments of citrus warmth. The visual language should feel made for this room—not like a generic project-management app.

The working direction is the room-first prototype: the current phase and the next generous action lead; the gallery and guided queue remain supporting patterns. This is a design contract for the prototype round and remains subject to human-use iteration.

## Color tokens

Use OKLCH only. The body surface is pure white so the indigo and coral carry the identity.

```css
:root {
  --bg: oklch(1 0 0);
  --surface: oklch(0.985 0.008 270);
  --surface-raised: oklch(0.975 0.012 270);
  --ink: oklch(0.19 0.035 270);
  --ink-soft: oklch(0.39 0.045 270);
  --line: oklch(0.89 0.018 270);
  --line-strong: oklch(0.79 0.035 270);
  --primary: oklch(0.42 0.18 270);
  --primary-dark: oklch(0.32 0.15 270);
  --primary-soft: oklch(0.94 0.035 270);
  --accent: oklch(0.66 0.17 35);
  --accent-dark: oklch(0.52 0.16 35);
  --accent-soft: oklch(0.94 0.045 35);
  --success: oklch(0.52 0.14 160);
  --success-soft: oklch(0.93 0.04 160);
  --warning: oklch(0.65 0.15 78);
  --warning-soft: oklch(0.95 0.05 78);
  --danger: oklch(0.56 0.18 25);
  --danger-soft: oklch(0.94 0.045 25);
  --focus: oklch(0.7 0.16 270);
}
```

Primary is used for the current phase, primary actions, and links. Coral is reserved for invitations, human warmth, and “your turn” moments. Status always pairs color with text/icon. Body text must maintain at least 7:1 contrast against `--bg`; muted text must maintain at least 4.5:1.

## Typography

Use one familiar system sans family: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Token | Size | Line height | Use |
|---|---:|---:|---|
| `text-xs` | 0.75rem | 1rem | metadata, timestamps |
| `text-sm` | 0.875rem | 1.3rem | supporting copy, controls |
| `text-md` | 1rem | 1.5rem | body and input copy |
| `text-lg` | 1.25rem | 1.55rem | panel headings |
| `text-xl` | 1.75rem | 1.1 | page headings |
| `text-display` | 3.25rem | 0.98 | room welcome / key moment |

Headings use `font-weight: 720` and letter spacing no tighter than `-0.03em`. Use sentence case. Avoid repeated eyebrow labels and all-caps tracking; a short named phase label is enough.

## Shape, spacing, and elevation

- 4px base spacing unit; primary gutters are 24px desktop and 16px mobile.
- Content max width 1180px; prose max width 68ch.
- `border-radius: 8px` for fields, `12px` for panels, `16px` only for a hero surface, and full pills for status tags.
- Default panels use a single 1px border. Floating surfaces may use `box-shadow: 0 4px 8px rgb(24 21 45 / 10%)` without a decorative border.
- Prefer open sections, dividers, and a single focal panel over grids of identical cards.

## Core components

- **Room header:** wordmark, named phase, timer, and one primary action. On mobile the timer and action remain visible without a hamburger-only state.
- **Phase rail:** a compact horizontal sequence with current phase text and progress; collapses to a vertical step list on narrow screens.
- **Dreamline panel:** person identity, category labels, generous line-height, and one contribution composer. No popularity score is shown to participants.
- **Visibility control:** a real checkbox, checked by default, labelled “Visible to everyone in this session.” Private state gets an inline lock icon and sentence, never color alone.
- **Router nudge:** a small coral “Your next useful thing” callout that explains the recommendation without exposing ranking math.
- **Admin table/list:** readable rows, dense enough for operations, with clear text status and a single action per row. No metric-card wall.
- **QR panel:** a calm white panel with a high-contrast code, join URL, copy, and full-screen actions.
- **Commitment panel:** a single highlighted “This month I will…” sentence with first action and date; celebration is typographic, not confetti.

## Interaction and motion

Use 180ms ease-out transitions for buttons, tabs, panel reveals, and save-state changes. Motion communicates phase changes, saved state, and confirmation only. Respect `prefers-reduced-motion: reduce` by removing transforms and reducing transitions to instant opacity changes. Never hide primary content behind an entrance animation.

Every control has visible hover, focus, active, disabled, loading, and error states. Focus uses a 3px `--focus` ring with a 2px offset. Touch targets are at least 44px.

## Responsive behavior

- Desktop: two-column room layout with a focused contribution panel and a slim context rail.
- Tablet: collapse the rail beneath the contribution panel; keep the room header in one row where space permits.
- Mobile: stack content, keep phase/timer/action sticky at the top, turn tabs into a horizontally scrollable native tablist, and never require horizontal scrolling for prose or forms.
- Admin: use a single-column control flow on mobile; QR and session controls remain above operational detail.

## Voice

Speak like a generous host: direct, warm, lightly playful, never salesy. Prefer “Your next useful thing” over “Recommended item,” “Keep this private” over “Visibility: private,” and “You’re ready when you are” over “Submit.” Explain why the router is nudging without making participants feel managed.
