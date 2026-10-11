# Zarpi Subastas

Zarpi Subastas es la plataforma de la familia Zarpi para rematar la mercancía represada de mayoristas, distribuidores e importadores. Las empresas publican lotes y los clientes pujan por ellos. Nadie paga al pujar: la puja es un compromiso de compra, y el pago se acuerda con la empresa cuando la subasta se adjudica.

- `backend/`: API en FastAPI con SQLAlchemy. Usa SQLite en desarrollo y MySQL en producción.
- `frontend/`: React 18 con Vite y Tailwind 4, con la marca de Zarpi (tipografías Elvellon y AT Avenor, paleta `#4f06eb` y `#edf953`).
- `manual-de-marca/`: logos, tipografías, colores e imágenes de Zarpi.

## Qué hace

**Landing pública.** Muestra las subastas en curso, las estadísticas, cómo funciona, una sección para empresas y preguntas frecuentes.

**Catálogo abierto.** Cualquier visitante puede ver el catálogo en `/subastas` y entrar a una subasta para ver fotos, pujas y la sala de chat en vivo. Al intentar pujar, escribir en la sala o preguntarle a la empresa, se le pide crear una cuenta o iniciar sesión. Al terminar, vuelve a la misma subasta.

**Clientes:**
- Exploran las subastas activas y próximas, con filtros por categoría, modalidad y texto.
- Entran a una subasta y pujan, con confirmación antes de enviar.
- Ven en vivo si van ganando o si los superaron.
- Siguen sus pujas en "Mis pujas".

**Empresas (subastadores):**
- Crean subastas con varias imágenes (arrastrar, reordenar y quitar), descripción, cantidad y precio inicial.
- Definen el incremento mínimo y un precio de reserva opcional.
- Eligen la modalidad:
  - **Por tiempo:** se abre y se cierra sola, con una duración entre 5 minutos y 30 días.
  - **En vivo:** la empresa la abre y baja el martillo cuando quiere.

**Chat en vivo:**
- Cada subasta tiene una sala pública para preguntas.
- Cada cliente tiene además un chat privado con la empresa. Al adjudicar, ese chat se abre automáticamente con el ganador para coordinar pago y entrega.

**Notificaciones en vivo:** te superaron, ganaste, no ganaste, lote adjudicado y subasta desierta.

## Reglas de la subasta

- Cada puja debe superar la anterior al menos por el incremento mínimo. La primera puja puede ser igual al precio inicial.
- **Anti-sniping:** una puja en los últimos 2 minutos extiende el cierre hasta 2 minutos después de esa puja.
- **Precio de reserva secreto:** si la puja más alta no lo alcanza, la subasta queda desierta. Los clientes solo ven si la reserva ya se alcanzó.
- Quien va ganando no puede volver a pujar. Las empresas no pueden pujar.
- Los postores aparecen como "Postor 1", "Postor 2", en orden de su primera puja. Solo la empresa dueña ve los nombres reales.
- Una subasta con pujas ya no se puede cancelar.

## Desarrollo local

Requisitos: Python 3.11+ y Node 20+.

```bash
# Backend (http://localhost:8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.datos_demo     # opcional: datos de ejemplo
uvicorn main:app --reload

# Frontend (http://localhost:5173), en otra terminal
cd frontend
npm install
npm run dev
```

Vite reenvía `/api`, `/media` y `/ws` al backend, así que no hay que configurar CORS en desarrollo.

### Cuentas de ejemplo

`python -m scripts.datos_demo` crea estas cuentas, todas con la contraseña `demo-zarpi-2026`:

| Rol | Correo |
| --- | --- |
| Empresa | `ventas@andina.demo` |
| Empresa | `remates@pacifico.demo` |
| Cliente | `ana@cliente.demo` |
| Cliente | `beto@cliente.demo` |

También crea cinco subastas: tres activas por tiempo, una en vivo y una próxima.

### Pruebas

```bash
cd backend && pytest                  # usa SQLite temporal
DATABASE_URL=mysql+pymysql://usuario:clave@localhost/zarpi_test pytest
cd frontend && npm run build          # typecheck + build
```

### Desarrollo del frontend con Docker

Para que los cambios del frontend se reflejen automáticamente al guardar, usa
Vite dentro de un contenedor con el código montado:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend frontend-dev
```

Abre `http://localhost:5173`. Vite activa HMR y actualiza la página sin
reconstruir la imagen. El proxy interno reenvía `/api`, `/media` y `/ws` al
backend del mismo Compose.

El servicio `frontend` de `docker-compose.yml` usa Caddy y está pensado para
producción: requiere `docker compose up -d --build` después de cambios y
ocupa los puertos 80 y 443.

La CI (`.github/workflows/ci.yml`) corre las pruebas del backend contra SQLite y MySQL 8.4, y compila el frontend.

## Producción con Docker

```bash
cp .env.example .env    # completar SECRET_KEY, DOMINIO y las claves de MySQL
docker compose up -d --build
```

- Levanta MySQL 8.4, el backend y Caddy. Caddy sirve el frontend con HTTPS automático para `DOMINIO` y reenvía `/api`, `/ws` y `/media` al backend.
- Las imágenes subidas quedan en el volumen `media`.

El backend corre con **un solo worker** porque el tiempo real (WebSocket) vive en memoria del proceso. Para escalar a varios workers o servidores hay que mover el hub de `services/tiempo_real.py` a Redis pub/sub.

## Arquitectura en corto

- **Tiempo real:** un único WebSocket en `/ws`, autenticado con un ticket de 60 segundos que da `/auth/ws-ticket`. El cliente se suscribe a los canales `subasta:<id>`; cada usuario recibe sus notificaciones y mensajes privados en su propio canal. Los eventos se publican después del `commit`, así que nunca se anuncia una puja que no quedó guardada.
- **Concurrencia de pujas:** la fila de la subasta se bloquea (`SELECT … FOR UPDATE`) mientras se valida y registra la puja.
- **Apertura y cierre:** una tarea revisa cada 5 segundos qué subastas deben abrirse o cerrarse. Los listados y el detalle también lo revisan al consultarse.
- **Imágenes:** JPG, PNG o WebP, verificadas por contenido. Máximo 8 MB por imagen y 10 por subasta.

## Próximos pasos sugeridos

- Verificar empresas (NIT y documentos) antes de dejarlas publicar.
- Permitir editar una subasta antes de que reciba pujas.
- Pedir una garantía o depósito con Wompi para pujar en lotes grandes.
- Migraciones con Alembic (hoy las tablas se crean al arrancar).
- Límite de peticiones en login, pujas y chat.
- Redis para el tiempo real si se necesita más de un worker.
