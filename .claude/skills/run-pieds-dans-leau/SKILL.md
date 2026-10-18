---
name: run-pieds-dans-leau
description: Run, preview, and drive the Pieds dans l'eau restaurant website (static HTML/CSS/JS + Supabase). Use when asked to start or serve the site, take a screenshot of a page (desktop or mobile), test the menu/cart/WhatsApp order flow, check the admin page, or verify a change in a real browser.
---

Plain static site (no build, no package.json): `*.html` + `site.js` (public pages) + `admin.js` (`/admin`) + `contenu.js` (config & fallback content). Drive it with `.claude/skills/run-pieds-dans-leau/driver.mjs`: it serves the repo on a random local port, opens headless Chromium (Playwright), and runs one command per stdin line.

All paths are relative to the repo root.

## Prerequisites

Node 22 and the globally installed `playwright` (Chromium in `/opt/pw-browsers`) — already present in the Claude Code cloud container. The driver falls back to `$(npm root -g)/playwright`.

Optional, only for `/admin` (jsdelivr is blocked by the container proxy, npm is not):

```bash
mkdir -p /tmp/supabase-js && cd /tmp/supabase-js && npm pack @supabase/supabase-js@2.45.4 --silent && tar xzf supabase-supabase-js-2.45.4.tgz
```

The driver auto-serves `/tmp/supabase-js/package/dist/umd/supabase.js` in place of the CDN script (override with `SUPABASE_UMD=`).

## Run (agent path)

```bash
node .claude/skills/run-pieds-dans-leau/driver.mjs --offline <<'EOF'
nav /
shot accueil
nav /carte.html
wait #carte .plat
click #carte [data-ajouter="Ndolè"]
click #carte [data-plus="Ndolè"]
text .barre-panier-texte
click .barre-panier-bouton
fill #cmd-nom Test Agent
click .form-commande button[type=submit]
sleep 500
shot carte-panier
errors
EOF
```

Expected: `2 plats`, then `popup: https://wa.me/237691256821?text=...Ndol%C3%A8...Nom%20%3A%20Test%20Agent` (the order message), screenshots in `/tmp/shots/` (override with `SHOTS=`). **Open the PNGs and look at them.**

Mobile + admin login screen:

```bash
node .claude/skills/run-pieds-dans-leau/driver.mjs --mobile --offline <<'EOF'
nav /galerie.html
view galerie-mobile
EOF
node .claude/skills/run-pieds-dans-leau/driver.mjs <<'EOF'
nav /admin
wait #form-connexion
fill #cx-email test@example.com
fill #cx-mdp nope
click #form-connexion button[type=submit]
sleep 1500
shot admin-login
EOF
```

| flag / command | what it does |
|---|---|
| `--mobile` | iPhone 13 viewport/UA |
| `--offline` | abort Supabase requests → site uses `contenu.js` data (deterministic, fast) |
| `nav <path>` | go to path, wait for network idle (`/admin` → `admin.html` like Vercel clean URLs) |
| `click <sel>` / `fill <sel> <text>` / `press <key>` | input (8 s timeout) |
| `wait <sel>` / `text <sel>` / `eval <js>` / `sleep <ms>` | observe |
| `shot [name]` / `view [name]` / `shotel <sel> [name]` | full-page / viewport-only / element screenshot → `/tmp/shots/<name>.png` |
| `errors` | console errors+warnings since last call, then clear |

Popups (WhatsApp links) are printed as `popup: <url>`; wa.me is stubbed, never contacted.

## Run (human path)

```bash
python3 -m http.server 8000   # -> http://localhost:8000/ ; Ctrl-C to stop. /admin needs /admin.html here.
```

## Test

No test suite. The driver flow above is the check; `errors` should show only the Supabase/`Carte en ligne indisponible` lines in this container.

## Gotchas

- **Duplicate buttons:** every dish's `[data-ajouter="…"]` also exists hidden in the header mega-menu, and it comes first in the DOM. Always scope: `#carte [data-ajouter="Ndolè"]` (or `.grille` on the homepage). Unscoped click = 8 s timeout.
- **Blank bands in full-page shots:** `.revele` blocks are `opacity:0` until an IntersectionObserver sees them. The driver emulates `prefers-reduced-motion: reduce`, which the CSS/JS treat as "show everything". Don't remove that.
- **Supabase is unreachable here** (proxy 403). `site.js` waits up to 8 s then falls back to `contenu.js` and warns `Carte en ligne indisponible, version locale affichée` — expected. Use `--offline` to skip the wait. Live menu data / real admin features can't be exercised from this container.
- **`/admin` without supabase-js shows "La base n'est pas encore branchée"** — that's the CDN being blocked, not a config problem. Do the npm-pack prerequisite.
- **Admin login with no network says "Email ou mot de passe incorrect."** — it's really `TypeError: Failed to fetch` (see `errors`). The management view (`#gestion`) is unreachable without a live Supabase admin account.
- **`html { scroll-behavior: smooth }`**: after an anchor click or `scrollTo`, `sleep 800` before `view`.
- **Mobile full-page `shot` is huge** (iPhone DPR 3, tens of thousands of px tall). Use `view` (viewport) or `shotel`.
- **Edit content in `contenu.js`**, not the HTML: the menu, gallery, phone numbers and opening hours all come from there.

## Troubleshooting

- **`page.click: Timeout 8000ms exceeded`** on an add-to-cart button: unscoped selector hit the hidden mega-menu copy — see above.
- **`popup: chrome-error://chromewebdata/`**: wa.me wasn't stubbed (old driver); the current driver routes it to a stub page.
- **`net::ERR_TUNNEL_CONNECTION_FAILED` / `ERR_FAILED`** in `errors`: blocked Supabase / CDN; harmless for public pages.
