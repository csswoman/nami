# Paquete inicial de Ñami

Para un proyecto creado con:

```bash
npx create-next-app@latest nami --typescript --tailwind --eslint --app --src-dir
```

## Cómo meterlo

1. Copia `CLAUDE.md` y `design/` a la raíz del proyecto.
2. Copia `public/brand/` dentro de `public/`.
3. Copia `app/fonts.ts`, `app/layout.tsx`, `app/globals.css` y `app/styles/` dentro de `src/app/` (reemplaza `layout.tsx` y `globals.css` que trae la plantilla).
4. `npm run dev`. La página debería verse con fondo blanco, texto `ink` y Figtree.

## Qué trae

| Archivo | Para qué |
| --- | --- |
| `CLAUDE.md` | Stack, arquitectura y reglas de marca; Claude Code lo lee en cada sesión |
| `design/tokens.json`, `design/marca.md` | Copia local del design system |
| `app/styles/tokens.css` | Variables CSS de color, espacio, radio y sombra, tema claro y oscuro |
| `app/globals.css` | Tailwind v4 con los tokens como utilidades (`bg-primary`, `text-title-lg`, `rounded-pill`…) |
| `app/styles/nami-components.css` | Estilos `.nm-*` de los componentes del sistema |
| `app/fonts.ts`, `app/layout.tsx` | Nunito y Figtree con `next/font` |
| `public/brand/` | Logo, ícono de app, guacamaya, guacamaya en moto, key visual |

El tema oscuro sigue la preferencia del sistema; para forzarlo pon `data-theme="dark"` (o `"light"`) en `<html>`.
