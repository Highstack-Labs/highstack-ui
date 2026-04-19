# Atom Showcase Routing — Design Spec

**Date:** 2026-04-19

## Goal

Each atom in the design system has its own dedicated route so it can be viewed in isolation by navigating to its URL (e.g., `/atoms/button`). No navigation shell — routes only.

## Approach

Option A: one standalone page component per atom, living under `src/app/pages/atoms/<name>/`.

## File Structure

```
src/
  app/
    app.ts                            ← remove ButtonComponent import; only <router-outlet>
    app.html                          ← only <router-outlet>
    app.routes.ts                     ← register all atom routes here
    pages/
      atoms/
        button/
          button.page.ts              ← standalone component, imports ButtonComponent
          button.page.html            ← current app.html content (moved as-is)
```

## Routes

```ts
export const routes: Routes = [
  { path: '',             redirectTo: 'atoms/button', pathMatch: 'full' },
  { path: 'atoms/button', component: ButtonPage },
];
```

## Extensibility

When adding a new atom (e.g., `label`):
1. Create `src/app/pages/atoms/label/label.page.ts` and `label.page.html`
2. Add `{ path: 'atoms/label', component: LabelPage }` to `app.routes.ts`

No other files need to change.

## Out of Scope

- Navigation shell or sidebar
- Lazy loading (not needed at this scale)
- Wildcard / 404 route (deferred until needed)
