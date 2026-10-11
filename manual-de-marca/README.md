# Manual de marca de Zarpi

Este es el mismo sistema de marca que usa la plataforma de importaciones de Zarpi
(repositorio `ImportacionesQ8`, carpeta `proyecto/frontend/public/brand` y
`proyecto/frontend/src/styles`). Zarpi Subastas lo hereda tal cual.

## Contenido

| Carpeta | Qué hay |
|---------|---------|
| `logos/` | Logo completo, isotipo y wordmark, en negro y en versión "acid" (amarillo) |
| `tipografias/` | Elvellon (regular y bold) y AT Avenor |
| `tokens/` | `colores.css` con la paleta para modo claro y oscuro, y `fonts.css` con los `@font-face` |
| `imagenes/` | Fotografías de marca: contenedores, envíos y fondos |

## Logos

| Archivo | Uso |
|---------|-----|
| `zarpi-logo.svg` | Logo completo (isotipo + wordmark), negro, lienzo cuadrado de 2000×2000 |
| `zarpi-isotipo.svg` | Solo el símbolo, negro, para fondos claros |
| `zarpi-isotipo-acid.svg` | Solo el símbolo, amarillo `#edf953`, para fondos oscuros |
| `zarpi-wordmark.svg` | Solo la palabra "zarpi", negro, para fondos claros |
| `zarpi-wordmark-acid.svg` | Solo la palabra "zarpi", amarillo `#edf953`, para fondos oscuros |

En la plataforma actual se usa la versión negra en modo claro y la versión acid en
modo oscuro.

## Colores

| Rol | Hex | Uso |
|-----|-----|-----|
| Primario (violeta) | `#4f06eb` | Botones principales, enlaces, foco |
| Acento (acid) | `#edf953` | Destacados, logo sobre oscuro, elementos activos del menú lateral |
| Negro Zarpi | `#0f0f0f` | Texto, fondo del modo oscuro, menú lateral |
| Hueso | `#f8f8f3` | Fondo del modo claro |
| Blanco | `#ffffff` | Tarjetas en modo claro, texto sobre primario |
| Lavanda | `#f0eaff` | Fondo secundario en modo claro |
| Ciruela | `#29202f` | Fondo secundario en modo oscuro |
| Error | `#c92f45` | Acciones destructivas y errores |

Colores de gráficos: `#4f06eb`, `#edf953`, `#19a974`, `#7c3aed`, `#e89b2d`.

La lista completa de tokens (bordes, textos atenuados, menú lateral, modo oscuro)
está en `tokens/colores.css`.

## Tipografía

- **Elvellon** es la tipografía principal: títulos, texto de interfaz y cuerpo.
  Regular (400) y bold (700).
- **AT Avenor** es la tipografía de acento: insignias, etiquetas y detalles
  pequeños.

Los `@font-face` listos para usar están en `tokens/fonts.css`; esperan los
archivos `.otf` servidos en `/brand/`.
