# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [2.6.4] - 2026-11-02

### Maintenance

- Refresh bundled dependency requirements, including qs `^6.17.1`, color-parse `^2.2.0`, Svelte `^5.57.3`, and Svelte Tweakpane UI `^1.6.3`.
- Update shared-config, Playwright, Vite, Svelte checking, and pnpm; align the development Node.js range and replace prepare-time skill synchronization with pnpm workspace integration.
- Schedule dependency-update PRs monthly, exclude loopback URLs and empty inputs from link checks, and refresh release and metadata actions.

## [2.6.3] - 2026-10-06

### Fixed

- Keep pane controls interactive when host-page styles disable pointer events, and isolate the pane from inherited styling.
- Mark the package as having side effects so bundlers preserve its initialization and injected interface.

### Documentation

- Correct the local installation example's script path and use the current Copy button label.

### Maintenance

- Add a Playwright regression test for dragging controls on pages with disabled pointer events.
- Add a scheduled workflow that prepares dependency-update pull requests.
- Refresh shared-config, Vite, and pnpm, add contributor-skill synchronization, and remove Node.js 20 from the declared engines range.

## [2.6.2] - 2026-09-29

### Fixed

- Keep controls associated with their CSS properties when sorting, filtering calculated values, or toggling automatic folders.

### Maintenance

- Add Playwright regression tests for control ordering and run them against the built bundle in CI.
- Refresh Svelte and development dependencies, migrate to pnpm 12, simplify lint scripts, and update pinned workflow actions.

## [2.6.1] - 2026-09-03

### Changed

- **Breaking:** Require native iterator-helper support for CSS-property discovery, which now uses iterator `filter()` and `toArray()` methods.

### Fixed

- Restore saved CSS values synchronously while the classic script blocks parsing, preventing a flash of the original styles.
- Initialize the Options folder's collapsed state under the correct persisted key.

### Documentation

- Require loading the script after styles that declare custom properties, update the demo's script placement, and correct package/license links.

### Maintenance

- Adopt stable Svelte Tweakpane UI 1.6 and refresh bundled Svelte, color-parse, and qs requirements.
- Upgrade shared configuration and TypeScript 6 tooling, consolidate Svelte preprocessing into Vite, and gate control initialization on store readiness.
- Add scheduled link checks, refresh CI actions, and tighten release-tag validation against the repository's default branch.

## [2.6.0] - 2026-06-10

### Added

- Support editing wide-gamut colors in the color widget through Svelte Tweakpane UI `1.6.0-preview.9`.

### Maintenance

- Refresh Svelte, shared configuration, Vite, Svelte checking, and pnpm requirements.

## [2.5.2] - 2026-05-17

### Documentation

- Expand contribution guidance with an issue-first policy and explain the shared linting, formatting, and README-generation tools.

### Maintenance

- Refresh bundled Svelte and qs requirements and advance Svelte Tweakpane UI to `1.6.0-preview.8`.
- Migrate to pnpm 11, update build approvals and CI installation, make cleanup portable, and correct publishing authentication and release-tag handling.
- Exclude Svelte Tweakpane UI from Vite dependency optimization to eliminate the development warning.

## [2.5.1] - 2026-04-07

### Maintenance

- Refresh bundled Svelte and qs requirements.
- Upgrade shared configuration to version 7 and Vite to version 8, refresh development dependencies, and declare the contributor Node.js runtime.
- Add build/lint CI on Linux, macOS, and Windows, enforce LF line endings, and update workflow actions and permissions.

## [2.5.0] - 2026-02-01

### Added

- Add a cubic Bézier curve editor for `cubic-bezier()` custom properties, preserving edited curves in saved values and copied CSS.
- Discover `:root` custom properties inside nested grouping rules such as `@layer`, `@media`, and `@supports`, and in comma-separated selector lists.

### Documentation

- Extend the demo with layered variables and an interactive transition controlled by Bézier timing properties.

### Maintenance

- Refresh Svelte, element-ready, shared configuration, and development-tool requirements.

## [2.4.0] - 2026-01-20

### Added

- Edit `light-dark()` values through separate Light and Dark folders while preserving both variants in saved state, applied styles, and copied CSS.

### Fixed

- Remove stale saved CSS properties by checking the persisted store's values rather than its store methods.

### Documentation

- Extend the demo with light/dark colors and content that responds to the selected color scheme.

### Maintenance

- Refresh bundled Svelte, qs, and element-ready requirements and advance Svelte Tweakpane UI to `1.6.0-preview.5`.
- Refresh development and release tooling and migrate lint/fix scripts from `kpi` to `ksc`.

## [2.3.3] - 2025-12-08

### Maintenance

- Refresh Svelte, Vite, shared-config, and pnpm requirements.
- Fix contributor-tool dependency hoisting by moving publicHoistPattern settings into pnpm-workspace.yaml.

## [2.3.2] - 2025-12-02

### Maintenance

- Refresh bundled Svelte and element-ready requirements and advance Svelte Tweakpane UI to `1.6.0-preview.4`.
- Upgrade development tooling to Vite 7 and TypeScript 5.9, refresh pnpm, and move build-script approvals into pnpm-workspace.yaml.

## [2.3.1] - 2025-11-04

### Documentation

- Document the known rerender loop involving multiple page instances, hidden tabs, and shared local storage.

### Maintenance

- Refresh bundled Svelte and Svelte Tweakpane UI requirements, advancing the UI dependency to `1.6.0-preview.3`.
- Refresh development tooling, switch local publishing to npm-token authentication, and simplify repository-metadata synchronization.

## [2.3.0] - 2025-05-31

### Added

- Recognize and edit CSS Color 4 values, including OKLCH, using the ColorPlus widget instead of limiting color controls to hexadecimal strings.

### Documentation

- Update the demo to exercise an OKLCH color.

### Maintenance

- Refresh bundled Svelte and development-tool requirements.

## [2.2.5] - 2025-05-11

### Maintenance

- Refresh bundled Svelte, Svelte Tweakpane UI, and element-ready requirements.
- Update shared configuration, TypeScript, Vite, pnpm, and release tooling, and allow the resolver dependency's installation build.

## [2.2.4] - 2025-03-04

### Maintenance

- Refresh bundled Svelte and Svelte Tweakpane UI requirements.
- Update shared-config and include Svelte type checking in the lint command.

## [2.2.3] - 2025-03-03

### Documentation

- Correct wording and code-block labeling in the script-query configuration instructions.

### Maintenance

- Correct the package repository URL to use HTTPS.
- Refresh bundled Svelte, Svelte Tweakpane UI, qs, and persisted-store requirements.
- Migrate to shared-config 5, ESLint flat configuration, Vite 6, and pnpm 10, and update TypeScript checks and contributor configuration.

## [2.2.2] - 2024-10-21

### Fixed

- Restore color widgets for hexadecimal CSS colors in both folders and top-level controls.

### Maintenance

- Migrate the bundled application to Svelte 5 and its mount API, update Svelte Tweakpane UI to 1.4, and refresh development dependencies.

## [2.2.1] - 2024-09-15

### Documentation

- Clarify the options reference and correct its heading hierarchy.

### Maintenance

- Replace the renamed `svelte-local-storage-store` dependency with `svelte-persisted-store`.
- Refresh bundled Svelte, Svelte Tweakpane UI, and qs requirements together with development and release tooling.
- Allow manual invocation of the repository-metadata synchronization workflow.

## [2.2.0] - 2024-06-09

### Added

- Add an `exclude` prop for ignoring selected CSS custom properties, with normalized, case-insensitive names.
- Accept configuration through script-URL query parameters, supporting comma-separated exclusions and dotted option names.

### Documentation

- Document component props, display options, and script-query configuration examples.

### Maintenance

- Extract shared naming, parsing, comparison, and clipboard helpers into a utility module.
- Refresh bundled and development dependencies, update contributor requirements to Node.js 20 and pnpm 9, and adjust clean/release scripts.
- Switch release and repository-metadata workflows to maintained forked actions.

## [2.1.0] - 2024-05-20

### Added

- Add an Options panel for automatic folders, alphabetical sorting, readable names, unit labels, and including `calc()` values, which are hidden by default.
- Persist display options and folder expansion states, including the Options folder, and provide a Reset Options action.

### Maintenance

- Refresh Svelte Tweakpane UI and shared development configuration.

## [2.0.5] - 2024-05-15

### Documentation

- Add contribution and license information and keep the example screenshot separate from generated banner content.

### Maintenance

- Refresh bundled Svelte and Svelte Tweakpane UI dependencies.
- Update shared configuration, Vite, TypeScript, and release tooling, and pin the development package manager to pnpm 9.
- Add a workflow that synchronizes GitHub repository metadata from package.json and refresh release-workflow actions.
- Reload the development page after the bundled script finishes rebuilding.

## [2.0.4] - 2023-12-27

### Documentation

- Correct the link to the Tweakpane documentation.

### Maintenance

- Refresh Svelte Tweakpane UI and shared development configuration, and rename the formatting script to `fix`.
- Validate release tags against the main branch and generate GitHub release notes with documentation and license attachments.

## [2.0.3] - 2023-12-18

### Documentation

- Replace the GitHub-redacted drag-and-drop bookmarklet link with a copyable bookmark URL.

### Maintenance

- Update the bundled Svelte Tweakpane UI requirement to `^1.1.3`.
- Add automatic GitHub release creation for version tags.

## [2.0.2] - 2023-12-17

### Documentation

- Fix the demo to load the built `dist/main.js` script.

### Maintenance

- Update bundled Svelte Tweakpane UI to the 1.1 release series.
- Migrate shared development configuration to version 4 and automatically open the development demo in Chromium.

## [2.0.1] - 2023-12-16

### Documentation

- Correct the jsDelivr URL in the CDN and bookmarklet examples.

## [2.0.0] - 2023-12-16

### Changed

- **Breaking:** Replace the published Svelte/Astro source components with a self-contained `dist/main.js` classic-script bundle that mounts its own pane; existing component imports must migrate.

### Documentation

- Replace component integration examples with local-script, CDN, and bookmarklet instructions, explain classic-script loading requirements, and add a gradient demo.

### Maintenance

- Reimplement the pane with Svelte Tweakpane UI and bundle its runtime dependencies.
- Introduce Vite build/watch scripts, pnpm release tooling, and shared linting and formatting configuration.

## [1.0.3] - 2023-07-08

### Removed

- **Breaking:** Remove the Copy JSON action when migrating away from Tweakpane's preset API.

### Fixed

- Resolve the Astro development-time module export incompatibility by migrating to Tweakpane 4 beta.

### Documentation

- Document the Tweakpane 4 beta dependency and remove the obsolete Astro dependency-optimization workaround.

### Maintenance

- Update Tweakpane core and essentials-plugin requirements and adapt pane bindings to the Tweakpane 4 API.

## [1.0.2] - 2023-07-08

### Documentation

- Document the Astro development-time `Pane` export error and the `vite.optimizeDeps.exclude` workaround.

### Maintenance

- Move `@tweakpane/core` from development dependencies to runtime dependencies.

## [1.0.1] - 2023-07-08

### Documentation

- Correct the npm badge and package link to reference tweakpane-css.

## [1.0.0] - 2023-07-08

### Added

- Provide `src/Tweakpane.svelte` and `src/Tweakpane.astro` components that discover `:root` custom properties and generate live, unit-aware Tweakpane controls.
- Persist CSS edits across reloads and restore saved values before rendering, with a `setCssVarsBeforePageRender` prop controlling the Svelte preload script.
- Support dragging, resizing, and double-click collapse of the pane, with persistent position, width, and expansion state.
- Copy edited variables as CSS or JSON, and reset saved edits to the stylesheet defaults.

### Documentation

- Document npm installation and Svelte/Astro integration, including CSS examples, a screenshot, and persistence behavior.

### Maintenance

- Establish source-package distribution, TypeScript checks, linting, formatting, and editor configuration.

[1.0.0]: https://github.com/kitschpatrol/tweakpane-css/releases/tag/v1.0.0
[1.0.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/kitschpatrol/tweakpane-css/compare/v1.0.2...v1.0.3
[2.0.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v1.0.3...v2.0.0
[2.0.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.0...v2.0.1
[2.0.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.1...v2.0.2
[2.0.3]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.2...v2.0.3
[2.0.4]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.3...v2.0.4
[2.0.5]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.4...v2.0.5
[2.1.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.0.5...v2.1.0
[2.2.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.1.0...v2.2.0
[2.2.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.0...v2.2.1
[2.2.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.1...v2.2.2
[2.2.3]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.2...v2.2.3
[2.2.4]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.3...v2.2.4
[2.2.5]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.4...v2.2.5
[2.3.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.2.5...v2.3.0
[2.3.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.3.0...v2.3.1
[2.3.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.3.1...v2.3.2
[2.3.3]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.3.2...v2.3.3
[2.4.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.3.3...v2.4.0
[2.5.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.4.0...v2.5.0
[2.5.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.5.0...v2.5.1
[2.5.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.5.1...v2.5.2
[2.6.0]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.5.2...v2.6.0
[2.6.1]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.6.0...v2.6.1
[2.6.2]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.6.1...v2.6.2
[2.6.3]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.6.2...v2.6.3
[2.6.4]: https://github.com/kitschpatrol/tweakpane-css/compare/v2.6.3...v2.6.4
