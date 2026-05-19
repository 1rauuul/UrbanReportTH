# UrbaReport Tehuacán — Flujo de la Aplicación

> Plataforma oficial del H. Ayuntamiento de Tehuacán para reportar, canalizar y dar seguimiento a incidencias urbanas.

---

## Problema que resuelve

Los ciudadanos no tienen un canal unificado para reportar problemas urbanos (baches, fugas de agua, luminarias fundidas, basura acumulada, etc.). Tampoco reciben retroalimentación sobre qué pasó con su reporte ni qué dependencia lo atendió.

**UrbaReport** cierra ese ciclo: ciudadano reporta → gobierno canaliza → dependencia atiende → ciudadano evalúa.

---

## Actores del sistema

| Actor | Portal | Autenticación |
|---|---|---|
| **Ciudadano** | Móvil (PWA) | OTP por teléfono |
| **Mesa de Control** | `/gobierno/dashboard` | Sin auth (demo) |
| **Operador de Dependencia** | `/dependencia/dashboard` | Sin auth (demo) |

---

## Flujo completo de un reporte

```
CIUDADANO          MESA DE CONTROL       DEPENDENCIA
    │                    │                    │
    │ 1. Reporta         │                    │
    │ incidencia         │                    │
    │ (online/offline)   │                    │
    │                    │                    │
    │◄── Folio ──────────│                    │
    │    THC-2026-XXXXX  │                    │
    │                    │                    │
    │                    │ 2. Revisa bandeja  │
    │                    │ Asigna dependencia │
    │                    │ (sugerida por tipo)│
    │                    │                    │
    │                    │───────────────────►│
    │                    │                    │ 3. Atiende
    │                    │                    │ Actualiza estatus
    │                    │                    │ (en_proceso → resuelto)
    │                    │                    │
    │◄── Notificación ───│────────────────────│
    │    "Tu reporte fue │                    │
    │     resuelto"      │                    │
    │                    │                    │
    │ 4. Evalúa          │                    │
    │ la atención        │                    │
    │ (1–5 estrellas)    │                    │
```

---

## Portal Ciudadano

### 1. Registro / Login (`/login`)

- El ciudadano ingresa su número de teléfono (10 dígitos).
- El sistema genera un **código OTP de 6 dígitos** (demo: se muestra en pantalla; producción: se enviaría por SMS).
- Si es usuario nuevo, se le pide su nombre.
- Al verificar el OTP se crea una **cookie de sesión** válida por 30 días.
- Redirige a `/nuevo-reporte` (primera vez) o `/mis-reportes` (usuarios recurrentes).

### 2. Crear un reporte (`/nuevo-reporte`)

Wizard en 3 pasos:

**Paso 1 — Tipo de incidencia**
Selección del problema: Bache, Basura acumulada, Fuga de agua, Luminaria fundida, etc.

**Paso 2 — Ubicación y descripción**
- Descripción del problema.
- Referencia de dirección (calle, entre calles).
- Colonia.
- **Mapa interactivo** (Leaflet + OpenStreetMap) para marcar la ubicación exacta.

**Paso 3 — Foto (opcional)**
- Captura o sube una foto desde el dispositivo.
- Se almacena en **Supabase Storage**.

#### ¿Sin internet? Modo offline
- El reporte se guarda en el dispositivo (IndexedDB via Dexie).
- Recibe un folio temporal: `THC-PEND-XXXXX`.
- Al recuperar conexión, el `OfflineSyncProvider` lo sube automáticamente y reemplaza el folio por uno definitivo.

### 3. Confirmación (`/confirmacion`)

- Se muestra el folio oficial: `THC-2026-00042`.
- Opción de copiar al portapapeles.
- Accesos rápidos: hacer otro reporte o ver mis reportes.

### 4. Mis reportes (`/mis-reportes`)

- Lista de todos los reportes del ciudadano.
- Filtros: Todos / Activos / Resueltos.
- Badge de estatus en tiempo real.
- Indicador de sincronización pendiente si hay reportes offline.

### 5. Detalle del reporte (`/mis-reportes/[id]`)

- Foto, descripción, folio, colonia.
- **Timeline de historial**: cada cambio de estatus queda registrado con fecha, hora y nota del operador.
- Si el reporte está `resuelto`, aparece el botón **"Evaluar atención"**.

### 6. Evaluación (`/evaluar/[id]`)

- Calificación de 1 a 5 estrellas.
- Comentario opcional.
- Solo disponible una vez por reporte resuelto.

---

## Portal Mesa de Control (Gobierno)

### Dashboard (`/gobierno/dashboard`)

KPIs en tiempo real:
- Total de reportes recibidos
- Sin asignar
- En proceso
- Resueltos

Tabla con todos los reportes del municipio, ordenados por fecha.

### Gestionar reporte (`/gobierno/reportes/[id]`)

- Visualiza todos los detalles del ciudadano y la incidencia.
- **Asigna la dependencia responsable** (el sistema la sugiere automáticamente según el tipo).
  - Bache → Obras Públicas
  - Basura → Servicios Públicos
  - Luminaria → Alumbrado Público
  - Fuga → Servicios Públicos
  - Emergencia → Protección Civil
- Puede agregar una nota de canalización.
- El estatus cambia a `asignado` y queda en la bandeja de la dependencia.

---

## Portal Dependencia

### Bandeja (`/dependencia/dashboard`)

- Muestra solo los reportes asignados a **esa dependencia**.
- Búsqueda por folio o descripción.
- Filtros por colonia, estatus, tipo.
- Exportar a **CSV**.

### Gestionar reporte (`/dependencia/reportes/[id]`)

El operador actualiza el estatus conforme avanza la atención:

```
asignado → en_proceso → resuelto → cerrado
```

- Cada cambio genera una entrada en el historial del reporte (visible para el ciudadano).
- Puede agregar notas de avance.
- Al marcar `resuelto`, el ciudadano puede calificar la atención.

### Métricas (`/dependencia/metricas`)

- KPIs propios de la dependencia.
- Tiempos de atención, reportes resueltos vs pendientes, etc.

---

## Estados de un reporte

```
recibido
   │
   ▼
en_revision
   │
   ▼ (Mesa de control asigna)
asignado
   │
   ▼ (Dependencia toma el caso)
en_proceso
   │
   ▼ (Problema solucionado)
resuelto ──► [Ciudadano evalúa]
   │
   ▼
cerrado
```

---

## Tecnologías clave

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + React 19 + Tailwind 4 |
| Estado global | Zustand |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| Almacenamiento de fotos | Supabase Storage |
| Mapas | Leaflet + OpenStreetMap |
| Offline | IndexedDB (Dexie) + Service Worker (PWA) |
| Auth ciudadano | OTP + Cookie HMAC (httpOnly) |
| Despliegue | Vercel |

---

## Identificación de reportes

Cada reporte tiene un folio único con el formato:

```
THC - 2026 - 00042
 │      │       └── Número secuencial
 │      └────────── Año
 └───────────────── Municipio: Tehuacán
```

Los reportes creados sin conexión reciben el folio `THC-PEND-XXXXX` hasta sincronizarse.

---

## Ventajas clave del sistema

1. **Trazabilidad total**: ciudadano sabe qué dependencia atiende su reporte y en qué estado está.
2. **Offline-first**: funciona sin internet, sincroniza cuando hay conexión.
3. **Asignación inteligente**: el tipo de incidencia sugiere automáticamente la dependencia correcta.
4. **Feedback ciudadano**: evaluación post-resolución para medir calidad del servicio.
5. **PWA**: instalable en el celular como app nativa, sin app store.
6. **Folio como comprobante**: el ciudadano puede dar seguimiento en cualquier momento con su número de folio.
