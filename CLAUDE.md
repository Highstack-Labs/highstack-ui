# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (auto-reloads)
npm run build      # Production build → dist/
npm run watch      # Dev build with watch mode
npm test           # Run unit tests with Vitest via Angular CLI
npm run build:lib  # Compile styles.css + ng-packagr → dist/highstack/ui (publishable)
ng generate component <name>   # Scaffold a new component
ng generate service <name>     # Scaffold a new service
```

## Architecture

Angular 22 standalone component application with Tailwind CSS v4.

### Two component trees — keep them in sync

Every component exists **twice**, byte-identical:

- `src/components/atoms/<name>/` — what the showcase app renders
- `projects/highstack/ui/src/lib/atoms/<name>/` — what ships in `@highstacklabs2026/ui`

A change to one must be copied to the other, and a **new** component also needs an
export in `projects/highstack/ui/src/public-api.ts`. Nothing enforces this — they
drift silently.

The same applies to `AI-USAGE-GUIDE.md`: edit the root copy, then `cp` it to
`public/` (the showcase's `/ai-guide` page fetches the `public/` one).

- **Entry point**: `src/main.ts` bootstraps `src/app/app.config.ts`
- **App config**: `src/app/app.config.ts` — registers providers (router, error listeners)
- **Routing**: `src/app/app.routes.ts` — add routes here; `<router-outlet>` is in the root `App` component
- **Styles (showcase)**: `src/styles.css` imports Tailwind (`@import "tailwindcss"`); PostCSS is configured via `.postcssrc.json` using `@tailwindcss/postcss`
- **Styles (library)**: `projects/highstack/ui/styles/index.css` is the source; `scripts/build-css.mjs` compiles it to `projects/highstack/ui/styles.css` (generated, gitignored) which ng-packagr ships as an asset. Global CSS that consumers need — anything that can't be expressed as a utility class on the component — goes in **both** stylesheets.
- **Testing**: Vitest (not Karma/Jest) with Angular's `TestBed`; spec files live alongside their source files. `src/test-setup.ts` runs first (wired via `setupFiles` in `angular.json`) and stubs browser APIs jsdom lacks, e.g. `IntersectionObserver`.

### Key conventions
- Components use the standalone API (`imports: [...]` in `@Component`) — no NgModules
- Angular signals (`signal()`) are used for reactive state (see `App.title`)
- Prettier is configured in `package.json` with `printWidth: 100`, `singleQuote: true`, and Angular HTML parser for `.html` files
