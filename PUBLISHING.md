# Publicar `@highstacklabs2026/ui`

Guía del proceso de release. Sigue estos pasos **cada vez** que quieras publicar una versión nueva del paquete a npm.

> El paquete en npm se llama **`@highstacklabs2026/ui`**. El nombre del proyecto en `angular.json` es **`@highstack/ui`** (se usa solo para `ng build`). No los confundas.

---

## TL;DR

```bash
# 1. Sube la versión en projects/highstack/ui/package.json
# 2. Compila
npm run build:lib
# 3. Verifica el contenido (opcional)
npm pack dist/highstack/ui --dry-run
# 4. Confirma sesión
npm whoami            # => highstacklabs2026
# 5. Publica
npm publish dist/highstack/ui --access public
# 6. Versiona en git
git tag v1.1.1 && git push && git push --tags
```

---

## 1. Sube la versión

Edita el campo `version` en `projects/highstack/ui/package.json`.

npm **no permite republicar** una versión que ya existe, así que siempre debe ser una versión nueva siguiendo [semver](https://semver.org/lang/es/):

| Tipo  | Ejemplo           | Cuándo                                              |
| ----- | ----------------- | --------------------------------------------------- |
| patch | `1.1.1` → `1.1.2` | Corrección de bugs, sin cambios de API              |
| minor | `1.1.1` → `1.2.0` | Componentes o props nuevos, sin romper nada         |
| major | `1.1.1` → `2.0.0` | Cambios que rompen la API existente                 |

## 2. Compila la librería

```bash
npm run build:lib
```

Esto hace, en orden:

1. `node scripts/build-css.mjs` — compila `projects/highstack/ui/styles/index.css` con Tailwind y genera `projects/highstack/ui/styles.css` (archivo generado, está en `.gitignore`).
2. `ng build @highstack/ui` — ng-packagr compila la librería y copia `styles.css` (declarado como asset en `ng-package.json`) a la salida.

> ⚠️ El CSS se genera **antes** de `ng build` a propósito: ng-packagr limpia `dist/` en cada build, así que el `styles.css` tiene que existir como asset de origen al momento de compilar.

Artefactos publicables → **`dist/highstack/ui`** (contiene `fesm2022/`, `types/`, `styles.css`, `package.json`, `README.md`).

## 3. Verifica el contenido (opcional pero recomendado)

```bash
npm pack dist/highstack/ui --dry-run
```

Confirma que aparezcan `styles.css`, `fesm2022/`, `types/`, `package.json` y `README.md`, y que la versión listada sea la correcta.

## 4. Confirma tu sesión de npm

```bash
npm whoami
```

Debe imprimir **`highstacklabs2026`** (el dueño del paquete). Si da `401 Unauthorized`:

```bash
npm login
```

> 💡 Si al publicar ves un error **`404 Not Found`** sobre `@highstacklabs2026/ui`, **no es un problema del nombre ni de la versión**: npm usa el `404` para ocultar errores de autenticación (`401`, token caducado) o de permisos (`403`, token sin permiso de escritura). Solución: vuelve a iniciar sesión o genera un token con permiso de *write* en https://www.npmjs.com/settings/highstacklabs2026/tokens

## 5. Publica

```bash
npm publish dist/highstack/ui --access public
```

- `--access public` es obligatorio: los paquetes con scope (`@highstacklabs/...`) se publican como privados por defecto.
- Si tienes **2FA** activado, npm pedirá un código; agrégalo con `--otp`:
  ```bash
  npm publish dist/highstack/ui --access public --otp=123456
  ```

## 6. Versiona en git

Etiqueta el commit con la versión publicada y sube todo:

```bash
git add -A && git commit -m "release: vX.Y.Z"   # si quedan cambios sin commitear
git tag vX.Y.Z
git push && git push --tags
```

---

## Comandos de referencia

| Comando                  | Qué hace                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `npm start`              | Servidor de desarrollo del showcase en `http://localhost:4200`  |
| `npm run build:lib`      | Compila la librería + CSS → `dist/highstack/ui`                 |
| `npm run build:lib:css`  | Solo regenera `styles.css`                                      |
| `npm test`               | Tests unitarios con Vitest                                      |

## Checklist rápido

- [ ] Versión subida en `projects/highstack/ui/package.json`
- [ ] `npm run build:lib` sin errores
- [ ] `npm whoami` → `highstacklabs2026`
- [ ] `npm publish dist/highstack/ui --access public`
- [ ] `git tag vX.Y.Z && git push --tags`
