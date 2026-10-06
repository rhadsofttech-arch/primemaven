# Primemaven: portfolio + admin dashboard

Personal website of **Adewunmi Erijide Adeniji (Primemaven)**, with a built-in admin dashboard to edit every part of the site.

- Clean URLs: `/`, `/mypropify`, `/rhadsoft`, `/speaking`, `/gallery`, `/blog`, `/blog/<post>`. Old `.html` / `.php` links redirect automatically.
- Admin dashboard at **`/admin`**: edit text, projects, case studies, blog posts, gallery photos, testimonials, SEO and integrations, and upload images.
- All content lives in `content/site.json`. Saving in the dashboard updates the live site instantly and commits the change to this GitHub repo, so nothing is lost on redeploy.
- No dependencies. Plain Node.js 18+.

## Run locally
```bash
ADMIN_PASSWORD=choose-a-password node server.js
# open http://localhost:3000 and http://localhost:3000/admin
```

## Environment variables
| Variable | Required | What it does |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | Password for `/admin`. The dashboard stays locked until this is set. |
| `SESSION_SECRET` | Yes | Long random string used to sign admin logins. |
| `GITHUB_TOKEN` | Recommended | Fine-grained GitHub token with **Contents: Read and write** on this repo. Lets dashboard saves and uploads be committed to GitHub. |
| `GITHUB_REPO` | No | Defaults to `rhadsofttech-arch/primemaven`. |
| `GITHUB_BRANCH` | No | Defaults to `main`. |
| `PORT` | No | Set automatically by most hosts. Defaults to `3000`. |

## Deploying on ZevCloud
- Build pack: Nixpacks (Node.js is detected from `package.json`).
- **Static site: OFF.** This is now a Node app.
- Start command: `npm start` (or leave empty).
- Add the variables above in the service's **Variables** tab.

## Project layout
```
server.js          web server, routes, admin API
lib/render.js      page templates
lib/md.js          Markdown for blog posts and bios
lib/store.js       content loading/saving (disk + GitHub)
content/site.json  all site content
admin/             admin dashboard
public/            CSS, JS, images
```

## Heading highlights
In any heading field: `==word==` blue block, `~~word~~` underline swoosh, `__word__` soft shape.
