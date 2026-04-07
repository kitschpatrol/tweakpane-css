---
name: ksc
description: >-
  Rules and conventions for projects using @kitschpatrol/shared-config. Covers
  ESLint, Prettier, TypeScript, CSpell, Knip, Stylelint, and Perfectionist configuration to avoid
  lint failures. Relevant when writing or modifying TypeScript, JavaScript, CSS,
  Markdown, JSON, YAML, or configuration files.
user-invocable: true
---

# @kitschpatrol/shared-config Rules

This project uses `@kitschpatrol/shared-config` for linting, formatting, and type checking. All tools are orchestrated via the `ksc` CLI. Always use **pnpm** — never npm, npx, or yarn. After writing code, run `pnpm ksc fix` to auto-fix formatting, sorting, and other fixable issues.

## Critical Type Rules

These cause the most lint failures. Follow them strictly:

- **No `null`** — Use `undefined` instead. Both the value `null` and the type `null` are banned (`unicorn/no-null`, `ts/no-restricted-types`). When interfacing with APIs that return `null`, convert immediately: `apiResult() ?? undefined`
- **No `any`** — Use `unknown` instead (`ts/no-explicit-any`). Also enforced: `ts/no-unsafe-assignment`, `ts/no-unsafe-call`, `ts/no-unsafe-member-access`, `ts/no-unsafe-return`, `ts/no-unsafe-type-assertion`
- **No `Buffer`** — Use `Uint8Array` instead
- **No `object` type** — Use `Record<string, unknown>` instead
- **Handle all promises** — `ts/no-floating-promises` is an error. Async functions returning promises must use `await`. Use `void someAsyncFunction()` for intentionally fire-and-forget calls. Functions that return a promise must be declared `async` (`ts/promise-function-async`)
- **Strict template expressions** — Only strings and numbers are allowed in template literals (`ts/restrict-template-expressions` with `allowNumber: true`). Booleans, objects, nullish values must be converted explicitly: `` `flag: ${String(isReady)}` ``
- **Strict plus operands** — Cannot implicitly add string + number (`ts/restrict-plus-operands`)
- **Prefer nullish coalescing** — Use `??` not `||` for nullish checks (`ts/prefer-nullish-coalescing`). Use `?.` optional chains (`ts/prefer-optional-chain`)

## Naming Conventions

- **Default**: `camelCase` for variables, functions, parameters
- **Types**: `StrictPascalCase` for types, interfaces, enums, classes, type parameters
- **Constants**: `const` variables may be `UPPER_CASE` or `camelCase`
- **Booleans**: Variables typed as `boolean` MUST be prefixed with `is`, `has`, `can`, `should`, `will`, or `did` (e.g., `isReady`, `hasPermission`)
- **Unused variables/parameters**: MUST have a leading underscore prefix (`_unused`, `_error`)
- **Imports**: `camelCase` or `StrictPascalCase` (for component imports)
- **Destructured variables**: `camelCase` or `StrictPascalCase` allowed
- **File names**: `kebab-case` enforced by `unicorn/filename-case`
- **Prefer `type` over `interface`**: `ts/consistent-type-definitions` enforces `type Foo = { ... }` not `interface Foo { ... }`
- **Type imports**: Use inline style: `import { type Foo } from './bar'`
- **Array types**: Simple types use `string[]`, complex types use `Array<string | number>` (`ts/array-type` with `array-simple`)

## Sorting — Do Not Manually Sort

The **Perfectionist** plugin auto-sorts imports, object keys, type members, union/intersection types, and interfaces. All these rules have auto-fix. **Do not waste time manually sorting** — write code in any logical order, then run `pnpm ksc-eslint fix` or `pnpm ksc fix`.

Perfectionist sorts alphabetically (natural, ascending) with domain-specific exceptions that preserve semantic grouping:

- Coordinates: `x, y, z, w` and `x1, y1, x2, y2`
- Dimensions: `width, height`
- Colors: `r, g, b, a` / `red, green, blue, alpha` / `h, s, l, a`
- Ranges: `min, max` / `start, end` / `open, close` / `pre, post`

These patterns are matched by exact name, prefix, and suffix. If an object's keys all match one of these patterns, the domain order takes precedence over alphabetical.

Import sorting: alphabetical with no newlines between groups. Internal modules (`~/`, `@/`, `$`) are grouped together.

## Code Style

Formatting is handled by Prettier — do not fight it:

- No semicolons
- Single quotes
- Tabs for indentation (except `.md`, `.mdx`, `.yml` which use spaces)
- Trailing commas always
- Print width: 100 characters
- LF line endings

Additional ESLint style rules:

- **Comments must be capitalized** (`capitalized-comments`) — exception for commented-out code patterns like `if`, `else`, `const`, `import`, etc.
- **No `Array.reduce()`** — Use `for...of` loops instead (`unicorn/no-array-reduce`)
- **No `Array.forEach()`** — Use `for...of` loops instead (`unicorn/no-array-for-each`)
- **Use `node:` protocol** for Node.js built-in imports: `import fs from 'node:fs'` (`unicorn/prefer-node-protocol`)
- **No abbreviations** (`unicorn/prevent-abbreviations`) except these allowed ones: `i`, `j`, `acc`, `arg`, `args`, `db`, `dev`, `doc`, `docs`, `env`, `fn`, `lib`, `param`, `params`, `pkg`, `prop`, `props`, `ref`, `refs`, `sep`, `src`, `temp`, `util`, `utils`
- **Explicit length checks** — Write `array.length > 0` not `array.length` (`unicorn/explicit-length-check`)
- **Catch variable naming** — Use `error` not `err` or `e` (`unicorn/catch-error-name`)

## JSDoc

- **Public exports require JSDoc** with a body description (`jsdoc/require-jsdoc` with `publicOnly: true`, `jsdoc/require-description`)
- **No types in JSDoc** — TypeScript provides the types. Do not write `@param {string} name`, just `@param name` (`jsdoc/no-types`)
- In `.ts` files, `@param` and `@returns` tags are not required — the TypeScript signature is sufficient

## ESLint Plugin Name Mappings

ESLint plugins are renamed in this config. Use these short names in `eslint-disable` comments:

- `@typescript-eslint` -> `ts` (e.g., `// eslint-disable-next-line ts/no-explicit-any`)
- `import-x` -> `import`
- `n` -> `node`
- `vitest` -> `test`
- `@eslint-community/eslint-comments` -> `eslint-comments`
- `jsonc` -> `json`
- `yml` -> `yaml`
- `@html-eslint` -> `html`
- `package-json` -> `json-package`

## Project Patterns and Tooling

**Package manager**: Always use `pnpm`. Never use `npm`, `npx`, or `yarn`. Dependencies are already available locally — use `pnpm exec` to run binaries, `pnpm add` to install packages, `pnpm dlx` instead of `npx`.

**Configuration files**: Each tool uses a typed factory function for configuration:

- `eslint.config.ts` — `eslintConfig({ type: 'lib' })` or `eslintConfig({ type: 'app' })`
  - Library projects use `type: 'lib'`, application projects use `type: 'app'`
  - Framework support via flags: `eslintConfig({ astro: true })`, `eslintConfig({ svelte: true })`, `eslintConfig({ react: true })`
  - Frameworks are auto-detected from installed packages, but can be explicitly enabled
- `prettier.config.ts` — `prettierConfig()` with optional overrides
- `cspell.config.ts` — `cspellConfig()` with optional custom words
- `knip.config.ts` — `knipConfig()` with optional ignore patterns
- `stylelint.config.js` — `stylelintConfig()`
- `.remarkrc.js` — `remarkConfig()`
- `tsconfig.json` — extends `@kitschpatrol/typescript-config`

**Linting commands**:

- `pnpm ksc lint` / `pnpm ksc fix` — Run ALL tools at once, usually mapped to the package.json "lint" and "fix" scripts.
- `pnpm ksc-eslint lint` / `pnpm ksc-eslint fix` — ESLint only
- `pnpm ksc-prettier lint` / `pnpm ksc-prettier fix` — Prettier only
- `pnpm ksc-typescript lint` — TypeScript type checking only
- `pnpm ksc-cspell lint` — Spell checking only
- `pnpm ksc-stylelint lint` / `pnpm ksc-stylelint fix` — CSS/style linting only
- `pnpm ksc-remark lint` / `pnpm ksc-remark fix` — Markdown linting only
- `pnpm ksc-knip lint` — Unused code/export detection

Use individual commands to focus on specific linter errors instead of running the full suite.

## TypeScript Configuration

- Target: `ES2023` with `DOM` and `DOM.Iterable` libs
- Module: `ESNext` with `bundler` module resolution
- `strict: true` — all strict checks enabled (strictNullChecks, strictFunctionTypes, etc.)
- `erasableSyntaxOnly: true` — no `const enum`, no runtime `namespace` blocks, no `enum` with computed values. Only type-level syntax that can be erased is allowed.
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `isolatedModules: true`
- JSON imports enabled (`resolveJsonModule: true`)
- `.ts` extensions allowed in imports (`allowImportingTsExtensions: true`)
