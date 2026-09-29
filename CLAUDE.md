# OpenGlide

Browser-based gaming-mouse control panel over WebHID. npm-workspaces monorepo, Node ≥ 20.

## Layout

- `packages/core`: framework-free TypeScript. Drivers in `src/drivers/<vendor>/` over the `HidTransport` interface (`src/transport/`). Registry order in `src/index.ts` matters: `genericDriver` must stay last.
- `apps/web`: Vite + React UI, hash routing, i18n in `src/i18n/{en,tr}.ts` (`tr` is typed against `en`, so a missing key fails typecheck).
- `docs/ADDING_A_DRIVER.md`: driver contract. `docs/ROADMAP.md`: desktop app plan (Tauri 2 in `apps/desktop` with a `TauriHidTransport`, reusing the web UI).

## Commands

```bash
npm run dev
npm test          # Vitest, packages/core
npm run typecheck
npm run build
```

CI runs typecheck + test + build. Pages deploys from `main` via `.github/workflows/deploy.yml`.

## Rules

- Only expose capabilities a driver can both read and write. Never guess packet bytes; they must come from a capture or an open-source reference. Never send firmware or flash commands.
- Keep packet builders/parsers pure and unit-tested.
- Any user-visible text goes through i18n in both `en.ts` and `tr.ts`.
- When adding a device, update both `README.md` and `README.tr.md`, plus `CHANGELOG.md` under `[Unreleased]`.
- Code, comments and commits are in English. The owner reads Turkish, so explain changes to them in Turkish.
- Commit identity: `Cafu1107 <179776180+Cafu1107@users.noreply.github.com>`.
