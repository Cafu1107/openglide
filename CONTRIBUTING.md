# Contributing to OpenGlide

Thanks for helping! Every contribution counts — drivers, translations, fixed driver links, bug reports and design polish.

## Development setup

```bash
git clone https://github.com/Cafu1107/openglide.git
cd openglide
npm install
npm run dev
```

Use a Chromium-based desktop browser (Chrome, Edge, Opera, Brave) — WebHID is required to connect real mice. The virtual demo mouse works everywhere.

Before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
```

## Ways to contribute

| I want to… | Where |
| --- | --- |
| Add support for my mouse | [docs/ADDING_A_DRIVER.md](docs/ADDING_A_DRIVER.md) |
| Fix or add a driver download link | `apps/web/src/data/drivers.ts` — official manufacturer URLs only |
| Translate the UI | Copy `apps/web/src/i18n/en.ts` to a new language file and register it in `i18n/index.ts` |
| Report a bug | [Open an issue](https://github.com/Cafu1107/openglide/issues/new/choose) and attach the Diagnostics report |

## Guidelines

- Keep protocol code in `packages/core` free of React and UI concerns.
- Match the surrounding code style: strict TypeScript, small functions, comments that explain *why*.
- Only claim device support you have tested. Start new drivers as `experimental`.
- Never commit vendor binaries, firmware or copyrighted assets.

## Safety

Writing to device firmware can brick hardware. Drivers must only use commands observed from the official software or documented by the vendor, and must never write to flash/bootloader regions.
