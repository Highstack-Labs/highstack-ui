# HighStack UI

Monorepo de **HighStack UI**: una librería de componentes premium para **Angular 21/22** + una app de showcase/documentación.

- **Librería** — [`@highstacklabs2026/ui`](./projects/highstack/ui/README.md) (`projects/highstack/ui`). Componentes standalone con **Angular Signals**, diseñados para **Tailwind CSS v4**. Publicada en npm.
- **App de showcase** — la aplicación raíz (`src/`) que documenta y muestra los componentes en vivo (incluye la página de instalación).

## Requisitos

- Node.js y npm
- Angular CLI 21+

## Comandos

```bash
npm start            # Servidor de desarrollo en http://localhost:4200 (recarga automática)
npm run build        # Build de producción de la app de showcase → dist/
npm run build:lib    # Compila la librería con ng-packagr y genera su CSS → dist/highstack/ui
npm run watch        # Build de desarrollo en modo watch
npm test             # Tests unitarios con Vitest (vía Angular CLI)
```

## Construir la librería

`build:lib` compila `@highstack/ui` (nombre del proyecto en `angular.json`) con ng-packagr y genera el `styles.css` precompilado vía Tailwind. Los artefactos publicables quedan en `dist/highstack/ui`.

```bash
npm run build:lib
```

## Publicar

Consulta la guía completa del proceso de release en **[PUBLISHING.md](./PUBLISHING.md)**.

```bash
npm run build:lib
npm publish dist/highstack/ui --access public
```

> El nombre del paquete en npm es `@highstacklabs2026/ui` (definido en `projects/highstack/ui/package.json`). Recuerda subir la versión antes de publicar.

## Documentación de la librería

Consulta el [README de `@highstacklabs2026/ui`](./projects/highstack/ui/README.md) para instalación, configuración de estilos, re-tematización y la API de componentes.
