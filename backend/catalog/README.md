# Tartarus app catalog

This folder is the app portfolio shown on Tartarus's **Explore** page.

```
catalog/
  apps.json                  the list of apps
  icons/                     one icon per app (png or svg)
  apps/<id>/tartarus/        the Tartarus launcher for each app
```

## Tartarus apps

A Tartarus app is a git repository with a launcher that tells Tartarus how to
install, start and update it. Tartarus looks for the launcher in this order:

1. `tartarus.js` at the repo root
2. `tartarus/tartarus.js`
3. `pinokio.js`, then `pinokio/pinokio.js` (older launchers still load)

The launcher exports a title, a description, an icon and a `menu`. The menu
lists the scripts (`install.js`, `start.js`, ...) shown on the app's page.
Scripts use the same steps as before (`shell.run`, `fs.copy`, `local.set`,
`filepicker.open`, `input`, ...); see `extras/docs/README.md` for the full
reference.

## Adding an app

1. Add an entry to `apps.json`:

   | Field | Meaning |
   | --- | --- |
   | `id` | Folder name it installs into. Lowercase letters, digits, `.`, `_`, `-`. |
   | `name`, `tagline`, `description` | What Explore shows. |
   | `repo` | `https://github.com/<owner>/<repo>` |
   | `branch` | Branch to install. Omit for the repo's default branch. |
   | `private` | `true` if the repo is private. Users sign in to GitHub first (Explore offers it when a clone is refused). |
   | `launcher` | `apps/<id>/tartarus`, the launcher kept in this catalog. |
   | `icon` | `icons/<file>` |
   | `status` | `ready`, `beta` or `in-development` (shown as a badge). |
   | `category`, `tags`, `license`, `platforms`, `featured` | Shown on the card. |

2. Put the launcher in `apps/<id>/tartarus/` (or in a `tartarus/` folder in the
   app's own repository, which then takes precedence).
3. Run `node --test backend/test/tartarus-apps.test.js`. It checks every entry
   has a valid repo, launcher and icon.

When Explore installs an app it clones the repo (and branch) into the apps
folder. If the repo has no `tartarus/` launcher of its own, the catalog's
launcher is copied into `<app>/tartarus/` and excluded from the app's git
status, so updates with `git pull` stay clean.

## Current apps

- **Bident** (`mosnin/Bident`, its default branch; `main` there is the
  unmodified upstream project): starts Bident's local server and opens the
  globe. This catalog launcher reuses Bident's own setup scripts, which keep
  their state in Bident's `pinokio/` folder. Once mosnin/Bident#2 merges, the
  repo ships its own `tartarus/` launcher with separate Tartarus state, and
  that one is used instead.
- **E2E Testing OS** (`mosnin/e2e-testing-os`, `agent-coverage-and-ux`): builds
  only the `e2e` package with pnpm 12. Its menu uses that CLI for `init` and
  `login`, and the picked project's own `e2e` to run tests or `explore` (bugs
  or UX). The same launcher is proposed for the repo in mosnin/e2e-testing-os#3.
