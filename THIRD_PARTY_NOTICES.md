# Third-party notices

## @openmouse/protocol

- Project: https://github.com/OpenMouse-Project/mouse-protocol
- npm: https://www.npmjs.com/package/@openmouse/protocol (version 0.18.0, pinned)
- Authors: the OpenMouse project and its contributors
- Used for: vendor protocol codecs and WebHID drivers for 40+ mouse brands
  (`packages/core/src/drivers/openmouse/` adapts them to OpenGlide).

The package is used unmodified as an npm dependency and is bundled into the
web build. At the time of writing the package does not declare a licence; its
README states that its codecs can be used independently by browser, Node.js and
TypeScript projects. An explicit licence is being requested from the OpenMouse
maintainers. If they object to this use, the dependency will be removed.

OpenGlide's MIT licence covers OpenGlide's own code only, not this package.

## Solaar

Logitech HID++ 2.0 details in `packages/core/src/drivers/logitech/` were
verified against https://github.com/pwr-Solaar/Solaar. No Solaar code is included.
