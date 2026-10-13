# Pokémon Games

Two browser games, Memory and Hangman, built with vanilla HTML, CSS, and JavaScript (ES modules). Originally a WDD330 course project at BYU–Idaho (2022), rebuilt in 2026 with a modern architecture, a retro-modern design, automated tests, and accessibility built in.

**[Live demo](#)** <!-- TODO: replace with deployed URL -->

## Features

**Memory**

- Match six Pokémon pairs; tracks pairs found and moves
- Cards are real buttons: playable with a keyboard, mouse, or touch
- A live status message announces every flip and result

[memory game] (images/screenshot-memory.png)

**Hangman**

- Random Pokémon from the first 151, fetched from [PokéAPI](https://pokeapi.co/), with a 5-second timeout and an automatic offline fallback to local Pokémon
- Eight wrong guesses before Team Rocket captures Pikachu; the scene changes with each mistake
- On-screen keys plus physical keyboard support (disabled while typing your name)
- Correct and incorrect keys are distinguished by color, outline, and strikethrough, not color alone
- Streak scoring and a persistent top-10 high-score list (`localStorage`)

[hangman game] (images/screenshot-hangman.png)

## Tech stack

- HTML5, CSS3 (custom properties, grid, flexbox), JavaScript (ES modules, no framework)
- [Vitest](https://vitest.dev/) for unit tests, [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code quality, GitHub Actions for CI
- Self-hosted fonts: Press Start 2P and Manrope (SIL Open Font License, see `fonts/`)

## Architecture

Game rules are pure functions with no DOM, timers, or network access, so they are easy to test. The UI modules only render state and handle events.

```
index.html, memory.html, hangman.html   Pages
style.css                               Design tokens + all styles
memory-logic.js     Memory rules (pure functions)
memory.js           Memory UI (rendering + events)
hangman-logic.js    Hangman rules and scoring (pure functions)
hangman.js          Hangman UI (rendering, events, game flow)
pokeapi.js          PokéAPI request with timeout and error handling
scores.js           High-score sorting + guarded localStorage access
pokemon-data.js     Local Pokémon list (Memory cards, Hangman fallback)
tests/              Vitest unit tests for the modules above
```

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`), a skip link, and one `h1` per page
- Visible focus indicator on every control, and keyboard-operable games
- Memory cards and Hangman keys have descriptive labels (for example "Card 3, Snorlax" or "R, incorrect")
- Hangman keys use `aria-disabled` instead of `disabled`, so keyboard focus is not lost after a guess
- Live regions announce game events. The visible message stays short, while a visually hidden message adds the current word for screen reader users
- Text and interactive elements meet WCAG AA contrast on the dark theme
- `prefers-reduced-motion` is respected, and a `forced-colors` fallback restores borders in Windows High Contrast mode

<!-- TODO: after testing with a screen reader (VoiceOver, NVDA, or TalkBack), add a line here saying which one(s) you tested. -->

## Performance

Lighthouse 13.5.0, mobile emulation, served from a local static server (October 2026):

| Page    | Performance | Accessibility | Best Practices | SEO |
| ------- | ----------- | ------------- | -------------- | --- |
| Home    | 100         | 100           | 100            | 100 |
| Memory  | 100         | 100           | 100            | 100 |
| Hangman | 99          | 100           | 96             | 100 |

The Hangman Best Practices score reflects a failed request to the PokéAPI during the audit (the test environment had no internet access, which also exercised the offline fallback). Lab scores vary by machine, so re-run Lighthouse locally and update this table.

Notable optimizations: images losslessly compressed (about 3 MB down to under 100 KB), self-hosted fonts with preload, reserved layout space to avoid shifts, and no runtime dependencies.

## Getting started

```bash
npm install
npm start            # serve the site locally (ES modules need a server)
npm test             # run the unit tests
npm run lint         # ESLint
npm run format       # Prettier
```

Open the local address printed by `npm start`. Opening the HTML files directly from disk will not work, because browsers block ES modules on `file://`.

## From 2022 to 2026

| Then                                                  | Now                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| One script per page with globals and inline `onclick` | ES modules; rules separated from the UI; event delegation           |
| Memory cards were `<img>` elements                    | Real buttons with labels and live announcements                     |
| Two chained API calls, no error handling              | One request with timeout, fallback, and stale-response protection   |
| Unwinnable names such as `nidoran-f`; unsorted scores | Non-letters are free; numeric top-10 scoring                        |
| No tests or tooling                                   | 45 unit tests, ESLint, Prettier, CI                                 |
| Fixed-width layout, no focus styles, 3 MB of images   | Responsive, focus-visible, reduced-motion support, optimized images |

## Roadmap

- Advanced difficulty for Memory with more cards and sprites from PokéAPI
- Browser tests (Playwright) with automated accessibility checks (axe-core)
- Optional backend for a global leaderboard

## Credits and legal

This is an unofficial fan project for learning and portfolio purposes and is not affiliated with Nintendo, Game Freak, or Creatures Inc. Pokémon and related names are trademarks of their respective owners. Pokémon data and sprites come from [PokéAPI](https://pokeapi.co/). Fonts are licensed under the SIL Open Font License.

Built by Sheyla Norton.
