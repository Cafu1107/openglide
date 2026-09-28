# Roadmap

## Web app

- [x] WebHID transport, driver registry, draft → apply workflow
- [x] Logitech HID++ 2.0: DPI (0x2201), polling rate (0x8060 / 0x8061), battery (0x1000 / 0x1004), firmware (0x0003)
- [x] Virtual demo mouse, hardware tests, driver hub, diagnostics
- [x] Dark / light themes, 5 accents, English + Türkçe
- [ ] Logitech onboard profiles (0x8100): read/write DPI stages, buttons and report rate stored on the mouse
- [ ] Razer (Chroma protocol), SteelSeries, Compx / PixArt-based mice (VGN, ATK, Lamzu, …)
- [ ] Macros and key sequences
- [ ] Installable PWA with offline support
- [ ] More languages (community translations in `apps/web/src/i18n/`)

## Desktop app (planned)

The protocol layer was designed for this from day one: `packages/core` is plain
TypeScript that only depends on the `HidTransport` interface.

**Stack:** [Tauri 2](https://tauri.app/) — small binaries (~10 MB vs ~100 MB for Electron), native tray and auto-start.

```
apps/
├─ web/        # unchanged, also the desktop UI
└─ desktop/    # Tauri shell
   ├─ src-tauri/          # Rust: hidapi commands (open, write, read, enumerate)
   └─ src/transport.ts    # TauriHidTransport implements HidTransport via invoke()
```

What the desktop app adds on top of the web app:

| Feature | Why it needs a desktop app |
| --- | --- |
| Tray icon with battery level | Runs in the background |
| Per-game profiles | Watches the foreground process and switches DPI / polling |
| Apply settings at login | Host-mode settings are lost when the mouse is re-plugged |
| Works in any browser / no browser | Uses hidapi instead of WebHID |
| Firmware updates | Needs raw access some browsers block |

Milestones:

1. `TauriHidTransport` + Rust `hidapi` commands; reuse the web UI unchanged.
2. Tray icon, auto-start, apply-on-connect.
3. Per-game profiles.
4. Signed installers for Windows / macOS / Linux via GitHub Releases.

An Electron build is also possible with zero driver changes, because Electron supports WebHID natively (`session.setDevicePermissionHandler`).
