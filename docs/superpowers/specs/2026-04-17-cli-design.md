# highstack-ui CLI — Design Spec

## Purpose

A CLI tool that copies highstack-ui components into Angular projects, following the shadcn copy-paste philosophy. No npm package to install as a dependency — just files copied directly into the user's project.

## Commands

### `npx highstack-ui init`

Sets up a target Angular project to use highstack-ui components.

1. Verify `angular.json` exists (abort with error if not an Angular project)
2. Copy `tokens.css` to `src/styles/tokens.css`
   - If file already exists, skip and inform the user
3. Prepend `@import "./styles/tokens.css";` to `src/styles.css`
   - Only if the import doesn't already exist
4. Print summary of actions taken and next step (`npx highstack-ui add button`)

### `npx highstack-ui add <component> [component2...]`

Copies component files into the target project.

1. Verify `src/styles/tokens.css` exists — if not, print error suggesting `npx highstack-ui init` first
2. Look up each component in the registry
   - If not found, print error listing available components
3. For each component, copy files to `src/components/<category>/<name>/`
   - If destination files already exist, skip and warn (no overwrite by default)
4. Print summary with import path for each added component

### `npx highstack-ui list`

Prints all available components with their descriptions.

## Architecture

```
cli/
  package.json
  bin/
    index.mjs           # entry point, routes to command handlers
  src/
    init.mjs            # init command
    add.mjs             # add command
    registry.mjs        # component metadata map
    utils.mjs           # colored log helpers, file copy helper
  templates/
    tokens.css
    components/
      button/
        button.component.ts
        button.component.html
```

### Entry point — `bin/index.mjs`

- Shebang: `#!/usr/bin/env node`
- Reads `process.argv[2]` to determine command (`init`, `add`, `list`)
- Passes remaining args to the command handler
- Unknown command or no args prints usage help

### Registry — `src/registry.mjs`

```javascript
export const registry = {
  button: {
    name: 'button',
    category: 'atoms',
    description: 'Displays a button or a component that looks like a button.',
    files: ['button.component.ts', 'button.component.html'],
  },
};
```

Each entry contains:
- `name`: component name (used as CLI argument and directory name)
- `category`: subdirectory under `src/components/` (`atoms`, `molecules`, `organisms`)
- `description`: one-line description shown in `list` output
- `files`: array of filenames to copy from `templates/components/<name>/`

### Utils — `src/utils.mjs`

- `log.success(msg)` — green checkmark prefix
- `log.error(msg)` — red X prefix
- `log.info(msg)` — blue info prefix
- `copyFile(src, dest)` — copies file, creates directories as needed, returns boolean (true = created, false = already existed)

### Templates

Exact copies of the source component files. No templating or variable substitution — files are copied as-is. This means the component code in `templates/` must be identical to the source in `src/components/`.

## CLI package.json

```json
{
  "name": "highstack-ui",
  "version": "0.1.0",
  "description": "Copy-paste Angular component library inspired by shadcn",
  "type": "module",
  "bin": {
    "highstack-ui": "./bin/index.mjs"
  },
  "files": ["bin/", "src/", "templates/"],
  "keywords": ["angular", "components", "ui", "tailwind", "shadcn"],
  "license": "MIT"
}
```

Zero external dependencies. Uses Node.js built-in `fs`, `path`, and `process`.

## Destination paths

Components are copied to the target project at:
```
src/components/<category>/<name>/<file>
```

Example for button:
```
src/components/atoms/button/button.component.ts
src/components/atoms/button/button.component.html
```

Tokens are copied to:
```
src/styles/tokens.css
```

## Output format

All output uses simple colored text with emoji-free checkmarks/X:

```
$ npx highstack-ui init

✓ Created src/styles/tokens.css
✓ Updated src/styles.css

Ready! Run: npx highstack-ui add button
```

```
$ npx highstack-ui add button

✓ Created src/components/atoms/button/button.component.ts
✓ Created src/components/atoms/button/button.component.html

Import it:
  import { ButtonComponent } from './components/atoms/button/button.component';
```

```
$ npx highstack-ui list

Available components:
  button    Displays a button or a component that looks like a button.
```

## Error handling

- No `angular.json` → `"Error: Not an Angular project. Run this command from the root of an Angular project."`
- `add` without `init` → `"Error: highstack-ui not initialized. Run: npx highstack-ui init"`
- Unknown component → `"Error: Unknown component '<name>'. Run: npx highstack-ui list"`
- No command given → print usage help
- File already exists → `"⊘ Skipped <path> (already exists)"` and continue

## Scaling: adding new components

To add a new component (e.g., `input`):

1. Create source files in `src/components/atoms/input/`
2. Copy those files to `cli/templates/components/input/`
3. Add entry to `cli/src/registry.mjs`

No build step required.
