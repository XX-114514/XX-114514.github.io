# Deploy to GitHub Pages

This portfolio is a static site and can be hosted on GitHub Pages without keeping the current custom domain.

## Recommended address

For GitHub account `XX-114514`, create a public repository named `xx-114514.github.io`. The free address will be:

`https://xx-114514.github.io/`

A normal repository name also works, but the address includes the repository path, for example `https://xx-114514.github.io/portfolio/`.

## Publish

1. Create the public repository on GitHub.
2. Commit this directory and push it to the `main` branch.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. Wait for the `Deploy portfolio to GitHub Pages` workflow to finish.

The workflow is stored in `.github/workflows/pages.yml`. A `CNAME` file is intentionally not included, so deployment does not depend on `xiongxin.online`.

## Before the old domain expires

The portfolio assets and downloadable files are included in this repository. Links to `blog.xiongxin.online` are still external and will stop working if that subdomain is retired; migrate or remove those links separately.

GitHub Pages has repository and bandwidth limits. Keep the site under 1 GB and each Git object below GitHub's per-file limit.
