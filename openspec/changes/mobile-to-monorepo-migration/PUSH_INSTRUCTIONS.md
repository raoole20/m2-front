# Push & PR Instructions — mobile-to-monorepo-migration

> The migration is fully committed on branch `feat/monorepo-migration` in `c:/Users/ramse/OneDrive/Documents/vacas/motomoto/`. The agent did **not** push. You execute the commands below manually.

---

## 1. Commits on the branch (8 total)

| # | SHA | Subject |
|---|---|---|
| C1 | `90e2a96` | chore(repo): scaffold pnpm+turbo monorepo and relocate mobile to apps/mobile |
| C2 | `13f3686` | feat(types): extract src/types to @m2/types workspace package |
| C3 | `a231462` | feat(design): extract src/design to @m2/design workspace package |
| C4 | `cf4ff69` | refactor(mobile): rewrite @/types and @/design imports to @m2/* packages |
| C5 | `23b0921` | feat(mobile): wire tsconfig base, metro workspace config, @m2/* workspace deps |
| C6 | `57ccbd8` | chore(repo): swap npm for pnpm; delete package-lock.json, commit pnpm-lock.yaml |
| FIX | `881e875` | fix(design): rewrite @/types imports to @m2/types; add @m2/types workspace dep |
| C7 | `3e2c541` | docs: rewrite root docs for monorepo + add apps/mobile/README |

All authored by `Ramsesdb <rdbriceno5@urbe.edu.ve>`. Zero `Co-Authored-By:` trailers.

Pre-migration base: `1425285` (Batch 4 — Luminous Executive visual direction).

---

## 2. Configure dual-remote `origin` (one-time setup)

The agent added `m2front` as a named remote. You still need to configure `origin` with two push URLs so a single `git push` fans out to both repos.

Run from `c:/Users/ramse/OneDrive/Documents/vacas/motomoto/`:

```bash
# Set origin's first push URL (Ramsesdb mirror)
git remote set-url --push origin https://github.com/Ramsesdb/motomoto.git

# Add the second push URL (raoole20 authoritative)
git remote set-url --add --push origin https://github.com/raoole20/m2-front.git

# Verify: origin should show TWO (push) URLs + a separate m2front remote
git remote -v
```

Expected output:

```
m2front  https://github.com/raoole20/m2-front.git (fetch)
m2front  https://github.com/raoole20/m2-front.git (push)
origin   https://github.com/Ramsesdb/motomoto.git (fetch)
origin   https://github.com/Ramsesdb/motomoto.git (push)
origin   https://github.com/raoole20/m2-front.git (push)
```

---

## 3. Push the branch (fans out to both remotes)

```bash
git push -u origin feat/monorepo-migration
```

If either remote fails silently, retry the laggard explicitly:

```bash
git push m2front feat/monorepo-migration
```

Verify both GitHub UIs show the branch at the same HEAD SHA.

---

## 4. Open the PR on `raoole20/m2-front`

```bash
gh pr create --repo raoole20/m2-front \
  --base main \
  --head feat/monorepo-migration \
  --title "chore(repo): migrate to pnpm + Turborepo monorepo (mobile -> apps/mobile)" \
  --body-file PR_BODY.md
```

Save the body below to `PR_BODY.md` first, or pass it inline with `--body "$(cat <<'EOF' ... EOF)"`.

### PR body

```markdown
## Summary

Migrates the Motomoto repository from a single-package Expo app to a pnpm + Turborepo monorepo. The mobile app moves to `apps/mobile/`; `src/types/` and `src/design/` are extracted to workspace packages `@m2/types` and `@m2/design`. No visual, feature, or runtime-dependency changes.

Proposal: `openspec/changes/mobile-to-monorepo-migration/proposal.md` (in `raoole20/m2-web`).

## What's new

- `apps/mobile/` — the existing Expo app, unchanged in behavior.
- `packages/types/` — `@m2/types` (shared TypeScript interfaces).
- `packages/design/` — `@m2/design` (color/spacing/typography tokens).
- Root: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, monorepo `package.json`, `.npmrc` (targeted hoisting), `pnpm-lock.yaml`.

## Reviewer guide — 8 commits, 3 with content changes

| # | SHA | Kind | What to review |
|---|---|---|---|
| C1 | `90e2a96` | rename+scaffold | Massive but boring: git-mv of mobile files into `apps/mobile/` + new root configs. Verify `git diff -M` shows 100% renames. |
| C2 | `13f3686` | rename+scaffold | `src/types/*` -> `packages/types/src/*`. No content changes. |
| C3 | `a231462` | rename+scaffold | `src/design/*` -> `packages/design/src/*`. No content changes. |
| **C4** | `cf4ff69` | **content** | Codemod: `@/types` and `@/design` imports rewritten to `@m2/*` across 47 files. 92 insertions / 92 deletions — pure symbol swap. |
| **C5** | `23b0921` | **content** | Mobile wiring: `tsconfig.json` extends base, new `metro.config.js`, `package.json` renamed to `@m2/mobile` with `workspace:*` deps. |
| C6 | `57ccbd8` | scaffold | `package-lock.json` deleted, `pnpm-lock.yaml` added. |
| FIX | `881e875` | **content** | `@m2/design` depends on `@m2/types` (colors.ts references ChannelType / UserStatus). Two imports rewritten; `@m2/types` added to design deps. |
| **C7** | `3e2c541` | **content** | Docs: root `README.md`, `CLAUDE.md`, new `apps/mobile/README.md`, `.gitignore` adds `.turbo/`. |

Focus review on C4, C5, FIX, C7.

## Verification performed pre-push

- [x] `pnpm install` at root succeeds; `pnpm-lock.yaml` committed
- [x] `pnpm -w typecheck` — all 3 workspaces green, 0 TS errors
- [x] `git log --follow apps/mobile/src/components/ui/GlassCard.tsx` shows pre-migration history
- [x] `git log --follow packages/types/src/user.ts` shows `src/types/user.ts` era
- [x] No `package-lock.json`, `yarn.lock`, or `bun.lockb` anywhere
- [x] `pnpm-lock.yaml` at root only
- [x] Every commit authored `Ramsesdb <rdbriceno5@urbe.edu.ve>`, zero `Co-Authored-By:` trailers

## Verification still needed (manual / on-device)

- [ ] Android dev client E2E boot (REQ-I-001)
- [ ] Hot reload when editing `packages/design/src/colors.ts` (REQ-I-002)
- [ ] EAS `--dry-run` from `apps/mobile/` (REQ-I-001 companion)
- [ ] Cold boot time within 120% of baseline (REQ-NFR-001)

## Rollback

Branch-only migration — revert the PR merge commit to roll back.

Details in `openspec/changes/mobile-to-monorepo-migration/design.md §8`.

**No `Co-Authored-By:` trailers were added to any commit**, per project convention (REQ-N-002).
```

---

## 5. Post-merge (for you, after the PR merges)

```bash
git switch main
git pull --ff-only origin main           # fans from both remotes
git branch -d feat/monorepo-migration
git push origin --delete feat/monorepo-migration
```

Verify both mirrors match:

```bash
gh repo view Ramsesdb/motomoto --json defaultBranchRef -q .defaultBranchRef.target.oid
gh repo view raoole20/m2-front --json defaultBranchRef -q .defaultBranchRef.target.oid
# Both should print the same SHA.
```

---

## 6. Verification checklist (spec.md §5 abridged)

Topology:
- [x] `pnpm-workspace.yaml` lists `apps/*` and `packages/*`
- [x] Root `package.json` pins `pnpm@9.15.0`, `"private": true`, turbo-backed scripts
- [x] `turbo.json` declares `build`, `typecheck`, `lint`, persistent `dev`
- [x] Root is clean (no `App.tsx`, `index.ts`, `app.json`, etc.)

Mobile app:
- [x] `apps/mobile/` has `app/`, `src/`, `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `package.json`, `README.md`
- [x] `apps/mobile/src/types/` and `apps/mobile/src/design/` do NOT exist
- [x] `apps/mobile/package.json` name `@m2/mobile`, `@m2/types` + `@m2/design` `workspace:*` deps
- [x] `apps/mobile/tsconfig.json` extends `../../tsconfig.base.json`, keeps `"@/*": ["./src/*"]`

`@m2/types`:
- [x] `name: "@m2/types"`, `main: "src/index.ts"`, `private: true`, no build script
- [x] 7 source files present (user, channel, message, conversation, api, websocket, index)

`@m2/design`:
- [x] `name: "@m2/design"`, `main: "src/index.ts"`, `private: true`, no build script
- [x] 4 source files present (colors, typography, spacing, index)
- [x] Depends on `@m2/types` (needed for ChannelType/UserStatus in colors.ts)

Imports:
- [x] Zero `from '@/types'` or `from '@/design'` under `apps/mobile/`
- [x] 92 occurrences of `from '@m2/types'` / `from '@m2/design'` across 47 files
- [x] In-mobile `@/components`, `@/hooks`, etc. untouched

Metro + .npmrc:
- [x] `metro.config.js` has `watchFolders` with both shared packages
- [x] `resolver.nodeModulesPaths` includes app + workspace-root node_modules
- [x] Built from `getDefaultConfig()` (`expo/metro-config`)
- [x] `.npmrc` has `public-hoist-pattern[]` for `*react*`, `*expo*`, `metro*` (+ more)
- [x] No `.npmrc` outside root

Commits:
- [x] All 8 commits authored by `Ramsesdb <rdbriceno5@urbe.edu.ve>`
- [x] Zero `Co-Authored-By:` trailers

Docs:
- [x] Root `README.md` describes monorepo, packages, commands, `core.longpaths`
- [x] `apps/mobile/README.md` is 39 lines (≤40)
- [x] `CLAUDE.md` updated for pnpm, `@m2/*`, `pnpm -w typecheck` cadence
- [x] `BEST_PRACTICES.md` and `PHASES.md` preserved at root
