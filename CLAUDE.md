# petrahelebrantova.com — handoff

Petra's personal design portfolio. Static HTML/CSS/JS, hosted on GitHub Pages
(custom domain via `CNAME`). No build step, no framework, no package.json —
edit the files directly.

**Nothing from this project's work so far is committed.** Everything below
reflects the current working tree, not `HEAD`. Check `git status` before
assuming anything is saved, and ask before committing or pushing.

## Files

- **11 case studies**, one HTML file each, same template:
  `fruitopia-parade.html · 2nd-wind.html · florette.html · wavia.html ·
  fractul-variable.html · circadian-lamp.html · cookies.html ·
  there-is-no-finish-line.html · green-roots.html · beyond-the-address.html ·
  weapon-of-mass-distraction.html`
- `index.html` — homepage / project grid. `about.html` — bio + contact.
  `cv.html` — orphaned, no longer linked from anywhere (superseded by the
  direct resume PDF link in the footer). Safe to ignore or delete; confirm
  with Petra first.
- `styles.css` — the only stylesheet, ~390 rules, single file, no preprocessor.
- Seven scripts, each one concern: `cursor.js` (custom cursor), `dark-mode.js`
  (theme toggle + header-height var + mobile menu), `media.js` (video
  autoplay keeper), `reveal.js` (card stagger, wordmark cursor-gradient, CTA
  wave marquee), `screensaver.js` (idle eyes), `script.js` (homepage rotating
  word), `typography.js` (widow/orphan prevention).
- `img/` — all assets, one subfolder per project. **235 MB of it is currently
  unreferenced** (old slide decks, source PNG masters, a 42 MB GIF, two .mov
  screen recordings). Left in place deliberately as masters/backups; don't
  delete without asking. Full list obtainable by cross-referencing every
  `src=`/`href=` in `*.html`/`.css`/`.js` against everything under `img/`.
- `2nd-wind-site/`, `cookies/` — standalone sub-sites embedded as case-study
  demos, each with their own HTML/CSS/JS, separate from the main site's.
- `img/Helebrantova_Resume.pdf` — the live resume, linked from the footer on
  every page, opens in a new tab. `img/cv-preview.jpg` is a rendered fallback
  image of it (regenerate from the PDF with `qlmanage -t` if the PDF changes
  and the fallback goes stale — it has before).

## Hard rules (apply to all future edits)

- **No em dashes anywhere in site copy.** Standing instruction, repeated and
  confirmed multiple times. Check before adding any new text.
- **One easing curve:** `var(--ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`),
  defined in `:root`. Don't add bare `ease`/`ease-out` keywords to new
  transitions — use the token. (Inline JS styles can read `:root` vars too;
  see `cursor.js`.)
- **Respect `prefers-reduced-motion`** on any new animation — every existing
  motion system (cursor, wave, screensaver, card reveal, rotating word)
  checks it.
- **Xanh Mono** is the body/UI monospace (italic project names everywhere:
  card titles, case-study `<h1>`s, and inline mentions in body copy are
  wrapped in `<em>`). **gyst-variable** (Typekit) is the display serif, used
  for the homepage hero and section headers only.
- **Image/video weight matters.** Multiple rounds of this session were spent
  converting oversized source PNGs/GIFs to optimized JPEG/MP4 (sometimes
  90%+ smaller) before wiring them into pages. Do the same for any new asset
  a visitor will actually download — check file size before linking it in.
- **`width`/`height` attributes on every `<img>`/`<video>` must match the
  real file dimensions.** Mismatches cause layout shift; this has bitten
  every image swap this session. Verify after any asset replacement.
- Prev/next project navigation is a closed ring matching the homepage order
  (`index.html` card order = source of truth). Labels read
  `Previous: [Title]` / `Next: [Title]`, no arrows (arrows were removed
  sitewide on request — don't reintroduce `.arrow-circle`/`.go` or bare
  arrow glyphs).
- Footer: `CONTACT` (mailto-linked icons, label text is literally "Email",
  not the raw address), `NAVIGATE`, `ELSEWHERE` (location + availability —
  Petra flagged this heading as possibly wrong but hasn't approved a
  replacement, see below).
- Homepage grid (`.projects-grid`) is a **hand-tessellated 12-col × 8-row
  CSS Grid** (`grid-template-areas`, blocks `a`–`k`) sized for exactly 11
  cards. Adding/removing a project means redesigning the block map by hand
  (every block must stay a rectangle, 96 cells must stay fully covered) —
  don't just add a 12th `nth-child` rule.
- Mobile breakpoints in use: `900px`, `768px`, `560px`. `--page-margin: 16px`
  is the shared inset for media; text blocks add extra padding on top of it
  on phones (see the comment above the relevant rule in `styles.css`).
- Known environment quirk: this machine's headless Chrome (156.0.8078.48)
  floors any `--window-size` width under ~500px to exactly 500px for
  `--dump-dom`/JS measurement (not for `--screenshot`, which is accurate).
  If testing small-viewport behavior, know you're actually getting ~500px
  layout, not true 390px — still exercises every breakpoint used on this
  site, but don't report it as a true 390px test.

## Open items — not resolved, don't guess

1. **Social links Petra described don't match what's live.** She gave these
   as "correct, do not change" values, but the live `href`s are different
   usernames, not just formatting:
   - LinkedIn: she said `.../in/petra-helebrantova-8a7809249/`, live is
     `.../in/petra-helebrantová-684729240`
   - Instagram: she said `instagram.com/petrahlbrnt/`, live is
     `instagram.com/phelebrantova`
   - Behance: she said `behance.net/petrahelebrant`, live is
     `behance.net/petrahelebra1`

     Flagged, never resolved. **Ask her which is correct before touching
     any of the three** — don't silently pick one.
2. **Chronological order proposal, never approved.** Current homepage order
   is correct except Weapon of Mass Distraction (Spring 2025) sits last
   (11th) instead of 9th (it should slot right after There Is No Finish
   Line, both Spring 2025, before the two Fall 2024 projects). She asked to
   be told, not have it changed. Don't reorder without her OK.
3. **Three About-page phrases flagged as "could be improved," no replacement
   approved:** "Most of my work sits in branding and UX/UI", "step away
   from my specialization", "ordinarily extraordinary moments". Leave as-is
   unless she approves specific new wording.
4. **Footer heading "ELSEWHERE"** — she agrees it's an odd label for a
   location+availability column but hasn't picked a replacement. Options
   floated: "LOCATION & AVAILABILITY", "WHERE & WHEN", "DETAILS".
5. **Homepage caption typography complaint, unresolved.** She said project
   titles look inconsistent card-to-card (different kerning/weight). I
   checked computed styles (all identical: `400 13px italic Xanh Mono`, no
   per-card override anywhere) and pixel-zoomed two titles side by side —
   found no actual difference. Left it alone rather than guess at a fix. If
   she raises it again, ask for a tighter screenshot/crop of the specific
   two words that look wrong before changing anything.
6. **`img/Helebrantova_Resume.pdf` content changes periodically** (she
   replaces it in place via Finder/Figma export). Whenever that happens,
   `img/cv-preview.jpg` (the no-PDF fallback image) goes stale and needs
   regenerating — nothing currently automates this.

## Working style notes

- Petra pastes screenshots and image references by file path a lot
  (`/private/tmp/.../images/N.png` or `N.gif`) — always open and actually
  look at them before acting, don't infer from the text description alone.
- She corrects herself mid-task often ("actually do X instead") — the most
  recent message in a back-and-forth wins over earlier ones in the same
  exchange.
- She's caught real bugs by eye multiple times (broken CSS selectors,
  cropped images, wrong aspect ratios) that weren't caught by automated
  checks — take her visual reports seriously even when stylesheet
  inspection says everything should be fine.
- Verify everything after editing: tag balance, `href`/`src` resolution,
  CSS brace balance, `node --check` on touched `.js` files. This session
  caught several self-introduced bugs (orphaned CSS selectors swallowing
  whole rules, regex replacements matching the wrong scope) only through
  this kind of pass — don't skip it.
