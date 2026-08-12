# Xin Xiong Portfolio — Optimized Homepage

A bilingual static academic portfolio recovered from the current live site and redesigned around projects, evidence, and experience.

## Preview locally

1. Change directory: cd /home/ubuntu/xiongxin-portfolio
2. Start the server: python3 -m http.server 4173 --bind 127.0.0.1
3. Open: http://127.0.0.1:4173/

The language switch links between English and Chinese.

## Main files

- index.html — English homepage
- zh/index.html — Chinese homepage
- styles.css — shared layout, responsive design, and effects
- app.js — language handling, reveal/count animations, interactive canvas, and card tilt
- output/playwright/ — browser-validation screenshots (not included in the delivery archive)

## GitHub Pages

The site includes a GitHub Actions deployment workflow. See `DEPLOY_GITHUB_PAGES.md` for the recommended repository name and publishing steps.
