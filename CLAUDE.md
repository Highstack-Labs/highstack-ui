# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (auto-reloads)
npm run build      # Production build → dist/
npm run watch      # Dev build with watch mode
npm test           # Run unit tests with Vitest via Angular CLI
ng generate component <name>   # Scaffold a new component
ng generate service <name>     # Scaffold a new service
```

## Architecture

Angular 21 standalone component application with Tailwind CSS v4.

- **Entry point**: `src/main.ts` bootstraps `src/app/app.config.ts`
- **App config**: `src/app/app.config.ts` — registers providers (router, error listeners)
- **Routing**: `src/app/app.routes.ts` — add routes here; `<router-outlet>` is in the root `App` component
- **Styles**: `src/styles.css` imports Tailwind (`@import "tailwindcss"`); PostCSS is configured via `.postcssrc.json` using `@tailwindcss/postcss`
- **Testing**: Vitest (not Karma/Jest) with Angular's `TestBed`; spec files live alongside their source files

### Key conventions
- Components use the standalone API (`imports: [...]` in `@Component`) — no NgModules
- Angular signals (`signal()`) are used for reactive state (see `App.title`)
- Prettier is configured in `package.json` with `printWidth: 100`, `singleQuote: true`, and Angular HTML parser for `.html` files
