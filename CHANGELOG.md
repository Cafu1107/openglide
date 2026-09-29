# Changelog

All notable changes to OpenGlide are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-09-29

First public release. Live at https://cafu1107.github.io/openglide/.

### Added
- WebHID core with a framework-free driver registry (`@openglide/core`) and a virtual **Glide One** demo mouse.
- Logitech HID++ 2.0 driver: DPI, polling rate (features 0x8060/0x8061), battery and firmware info.
- 40+ brands through the [OpenMouse](https://github.com/OpenMouse-Project/mouse-protocol) protocol drivers; button remapping on 11 brand families.
- Performance, sensor tuning, buttons and RGB pages; settings export/import as JSON.
- Hardware tests (polling-rate graph, chatter detector, scroll test, DPI analyzer) that work with any mouse.
- Driver hub with 27 verified official vendor links.
- Diagnostics report for device requests; English and Turkish UI; dark/light themes with 5 accents.

[Unreleased]: https://github.com/Cafu1107/openglide/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Cafu1107/openglide/releases/tag/v0.1.0
