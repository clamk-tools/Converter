# CLAUDE.md

Public tool repo in the `clamk-tools` org, published on GitHub Pages. Everything committed here is public, forever.

## Privacy: publish nothing personal

Never let any of these reach a commit, a commit message, a PR, a log or a reply:
a personal email address, an absolute path on the owner's machine (a Windows drive path or a macOS home folder path),
the owner's OS user name or machine name, the name of a private project, a token or key.

- Identity: commits are authored **and** committed as `Clément R <64958567+Clamk@users.noreply.github.com>`.
- Paths: write relative paths, config or environment variables, never a path from this machine.
  Do not copy paths out of terminal output, stack traces, error messages or editor settings into files.
- Do not print the output of `git config user.email`, `git log` author fields, or a hook's findings beyond
  `file:line`. If a hook blocks something, say that it blocked and where, not what it found.
- Never use `git config --global`, `--no-verify`, or a force push to hide something that was already pushed.

At the start of a session, before any commit:
1. If `git config core.hooksPath` is empty, run `git config core.hooksPath .githooks`.
2. If `git config --local user.email` is not the noreply address above, set it (and `user.name`) locally.

The hooks in `.githooks/` (`check-privacy.sh`) block a commit or push that carries a non-noreply email, a
private path or a secret, in the identity, the message or the content. CI runs the same check before deploying.
Private terms (user name, machine name, private project names) go in `~/.git-privacy-terms` or
`.git/privacy-terms`, one per line, never in the repo.
Before a first push: `sh .githooks/check-privacy.sh --tree` and `sh .githooks/check-privacy.sh HEAD`.
If something is already in pushed history, tell the user instead of rewriting it.

## The tool

Molarity Calculator: React + TypeScript + Vite, tests with Vitest and Playwright. Before a change read
`doc/ARCHITECTURE.md` (structure, how to change it) and `doc/CALCULATIONS.md` (the science); visual changes follow
`doc/LLM feed for visual/LLMfeed_VISUAL-IDENTITY.md`. Checks: `npm test`, `npm run lint`, `npm run build`, `npm run e2e`.
