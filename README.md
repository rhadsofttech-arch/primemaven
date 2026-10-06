# Primemaven — Adewunmi Adeniji

Personal portfolio of **Adewunmi Erijide Adeniji (Primemaven)**: full stack developer, TEDx speaker and CEO/Founder of MyPropifyNG.

Static site, no build step. Open `index.html` or deploy the folder as-is (GitHub Pages, Netlify, Vercel, cPanel).

## Pages
| File | Page |
|---|---|
| `index.html` | Home |
| `mypropify.html` | MyPropifyNG case study |
| `rhadsoft.html` | Rhadsoft Tech case study |
| `speaking.html` | Speaker page and booking form |
| `blog.html` + `blog-*.html` | Blog and articles |
| `gallery.html` | Event gallery |

## Before going live
Search all `.html` files and replace:
- `https://primemaven.dev` → your real domain (also in `sitemap.xml` and `robots.txt`)
- `YOUR_FORM_ID` → your Formspree form ID (contact and booking forms)
- `G-XXXXXXXXXX` → your Google Analytics 4 ID
- `YOUR_SEARCH_CONSOLE_TOKEN` → your Google Search Console verification code

## Gallery photos
Add photos to `images/events/` and fill in each `src` in the `EVENTS` list inside `gallery.html`.
