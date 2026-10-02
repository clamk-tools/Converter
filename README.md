# Tool name

What it does in one line.

**Open it:** https://clamk-tools.github.io/REPO-NAME/

---

## Starting a new tool from this template

1. On GitHub: **Use this template → Create a new repository**, owner `clamk-tools`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Repo page, gear next to **About**: description, Website `https://clamk-tools.github.io/<repo>/`, topic `tool`.
   The tool then appears on the [hub](https://clamk-tools.github.io/).
4. Clone it, then **before the first commit**: `git config core.hooksPath .githooks`
   and `git config user.email "<id>+<user>@users.noreply.github.com"` (see [Privacy](#privacy)).
5. Replace this section and the placeholders above.

## Privacy

This repo is public, so nothing personal may reach it. `.githooks/check-privacy.sh` blocks, in the commit
identity, the commit message and the content of the changes:

- an email address that is not a GitHub noreply address,
- a private path on a local machine (a Windows drive path or a macOS home folder path),
- tokens and private keys,
- any private term listed in `~/.git-privacy-terms` (all repos) or `.git/privacy-terms` (this repo, never pushed):
  one per line, e.g. an OS user name, a machine name or a private project name.

It never prints what it found, only `file:line`. It runs as a `pre-commit`, `commit-msg` and `pre-push` hook (turned
on by `git config core.hooksPath .githooks`, once per clone) and in CI before every deploy. The CI run cannot
prevent a leak, because the commits are already on GitHub by then: the hooks and the two GitHub account
settings (**Keep my email addresses private**, **Block command line pushes that expose my email**) do.

A line that holds an invented example (a fake path in a test, say) can carry the marker `privacy-ok` in a comment.

Audit an existing repo: `sh .githooks/check-privacy.sh --tree` (files now) and `sh .githooks/check-privacy.sh HEAD`
(the whole history). To add this to another repo, copy `.githooks/`, `.gitattributes` and the `privacy-guard` job
of `pages.yml`.

## Deploying

`.github/workflows/pages.yml` runs on every push to `main`, after the privacy check:

- **Plain HTML** (no `package.json` build script): the repo root is published.
- **With a build** (`npm run build` exists): it runs `npm ci && npm run build` and publishes `dist/`.
  The site lives under `/<repo>/`, so set the bundler's base path to it
  (Vite `base: "/<repo>/"`, Expo `experiments.baseUrl: "/<repo>"`).
  Any other stack: change the build step in the workflow.
