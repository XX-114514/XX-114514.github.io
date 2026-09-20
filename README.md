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
- blog.html and zh/blog.html — bilingual research-document indexes
- blog/ and zh/blog/ — document introduction and reading pages
- files/ — original PDFs and downloadable academic files
- assets/pdf-reader.js and assets/pdfjs/ — self-hosted PDF reader and PDF.js runtime
- styles.css — shared layout, responsive design, and effects
- app.js — language handling, reveal/count animations, interactive canvas, and card tilt
- output/playwright/ — browser-validation screenshots (not included in the delivery archive)

## Add a research document

1. Put the original PDF in `files/` with a stable, descriptive filename.
2. Add its English and Chinese reading pages under `blog/` and `zh/blog/`.
3. Add a card to both blog indexes with document type, version, date, and status.
4. Keep an explicit link to the original PDF for full-screen viewing and download.

## GitHub Pages

The site includes a GitHub Actions deployment workflow. See `DEPLOY_GITHUB_PAGES.md` for the recommended repository name and publishing steps.
