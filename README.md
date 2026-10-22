# Peruvian Soul — Restaurant Website Concept

A cinematic, upscale website concept for **Peruvian Soul**, a modern Peruvian restaurant in Frederick, Maryland. The design is meant to feel like stepping into the restaurant itself: warm light, rich color and movement that brings the food and hospitality to life.

> **Concept / spec design.** Food, drink and interior photography and the hero video were generated with AI (Higgsfield: Nano Banana Pro stills and a Seedance 2.5 video) for this concept. A few slots still use styled placeholders: the cocktail pour video, the chef portrait and one gallery video. The menu, reviews, address and contact details are sample content, and the forms are demos that do not send data.

**Live demo:** https://westbrooksai.github.io/peruvian-soulv1/

## Highlights

**Design**
- Charcoal and deep-brown palette with cream type and copper/gold accents
- Cormorant Garamond headlines paired with Inter body text
- Andean step-motif textile pattern and a subtle film-grain texture

**Motion & effects** (GSAP + ScrollTrigger, Lenis smooth scrolling)
- Branded preloader with an SVG line-drawn Andean cross
- Full-screen video hero with a line-by-line headline reveal and Ken Burns movement
- Horizontal-scroll showcase of signature dishes with wipe reveals
- Pinned cocktail video that changes as the drink descriptions scroll past
- Parallax backgrounds, scroll-driven word highlighting, animated counters
- Masonry gallery with a keyboard-friendly lightbox, a draggable reviews rail and magnetic buttons

**Sections**
Hero · Signature dishes · Tabbed menu · Cocktail bar · Chef's story · Atmosphere gallery · Reviews · Plan your visit (hours, map, reservation form) · Closing call to action

## Accessibility (aimed at WCAG 2.2 AA)
- Skip link, logical heading order and a descriptive text alternative for every image and video
- Full keyboard support, with focus kept inside the menu and lightbox while open
- Labeled form fields with error messages that screen readers announce
- AA color contrast, a **Pause motion** button and a calm version for "reduce motion" users
- Tested at 320px, 390px and 1440px wide with no horizontal scrolling

## Privacy & security
- Cookie consent banner with per-category choices; the Google Map loads only after consent; respects Global Privacy Control
- Privacy policy, terms and conditions and an accessibility statement
- HTTPS enforcement and security headers (Content-Security-Policy, HSTS and more) for Apache, Netlify and Cloudflare hosts
- **Nothing loads from another company until the visitor accepts:** fonts and scripts are self-hosted, and any future analytics or pixel must go through a consent gate in `site.js`
- Spam protection: honeypot fields, minimum fill time, link filtering, rate limiting and email obfuscation

## Built with
HTML, CSS and vanilla JavaScript · [GSAP](https://gsap.com/) & ScrollTrigger · [Lenis](https://lenis.darkroom.engineering/) · Cormorant Garamond & Inter (all self-hosted; see `THIRD_PARTY_NOTICES.md`)

No build step: open `index.html` in a browser, or serve the folder with any static host.

## Files
| File | Purpose |
|---|---|
| `index.html` | Main one-page site |
| `privacy.html`, `terms.html`, `accessibility.html` | Legal and accessibility pages |
| `styles.css` | All styles, including responsive and reduced-motion rules |
| `script.js` | Scroll effects and interactions for the main page |
| `site.js` | Shared code: HTTPS redirect, cookie consent, map gate, email obfuscation |
| `.htaccess`, `_headers`, `_redirects` | Server configuration for HTTPS and security headers |
| `img/`, `video/` | Compressed WebP photos, the hero video and its poster frame |
| `fonts/`, `fonts.css`, `vendor/` | Self-hosted fonts and animation libraries |
