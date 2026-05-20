# Arquitectura de Urban Report

> Documento para generar un diagrama visual de la arquitectura del proyecto.

---

## 1. Visión general

Urban Report es una PWA para reportes ciudadanos de incidencias urbanas en Tehuacán, Puebla. Tres roles: ciudadano, dependencia y gobierno. Soporte offline-first con sincronización automática. Análisis de evidencia con IA (Cloud Vision).

**Stack:**
- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4
- **Backend:** Next.js API Routes (serverless, mismo proyecto)
- **Base de datos:** PostgreSQL en Supabase (con pooler PgBouncer)
- **Almacenamiento de fotos:** Supabase Storage (bucket `reportes`, público)
- **Offline:** IndexedDB (Dexie) + Service Worker
- **IA:** Google Cloud Vision API (análisis de baches y basura)
- **Mapas:** Leaflet + OpenStreetMap
- **Despliegue:** Vercel

---

## 2. Arquitectura de capas

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ React 19  │  │ Zustand  │  │ IndexedDB (Dexie)│  │
│  │ (Pages)   │  │ (Store)  │  │ (offline queue)  │  │
│  └───────────┘  └──────────┘  └──────────────────┘  │
│        │              │               │              │
│  ┌─────┴──────────────┴───────────────┴──────────┐  │
│  │              Service Worker (sw.js)             │  │
│  │         Cache + Background Sync + Push          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS (fetch / FormData)
┌──────────────────────┴──────────────────────────────┐
│                 VERCEL (serverless)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js API Routes                   │  │
│  │  /api/reportes  /api/auth  /api/metricas      │  │
│  │  /api/analizar-evidencia  /api/notificaciones  │  │
│  └───────┬───────────────────────┬───────────────┘  │
│          │                       │                   │
│  ┌───────┴───────┐       ┌──────┴──────┐            │
│  │ Prisma Client │       │  Supabase   │            │
│  │  (ORM)        │       │  Storage    │            │
│  └───────┬───────┘       └─────────────┘            │
└──────────┼──────────────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────────────┐
│              SUPABASE PostgreSQL                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Ciudadano │ Reporte │ HistorialEstatus       │   │
│  │  Evaluacion │ PushSubscription               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

SERVICIOS EXTERNOS:
┌──────────────────────┐  ┌──────────────────────────┐
│  Google Cloud Vision │  │  OpenStreetMap (tiles)   │
│  (análisis de fotos) │  │  Leaflet (mapa)         │
└──────────────────────┘  └──────────────────────────┘
```

---

## 3. Estructura de rutas (App Router)

```
app/
├── layout.tsx                    # Root layout (Roboto, PWA providers, AuthHydrator)
│
├── (ciudadano)/                  # ROUTE GROUP: Ciudadano
│   ├── layout.tsx                #   Layout con padding-bottom para BottomNav
│   ├── login/page.tsx            #   Login por teléfono + OTP
│   ├── registro/page.tsx         #   Registro (redirige a login)
│   ├── mis-reportes/page.tsx     #   Lista de reportes del ciudadano
│   ├── mis-reportes/[id]/page.tsx#   Detalle de reporte + evaluación + revisión
│   ├── nuevo-reporte/page.tsx    #   Formulario 3 pasos: tipo → detalles → evidencia
│   ├── confirmacion/page.tsx     #   Pantalla post-envío con folio
│   ├── evaluar/[id]/page.tsx     #   Evaluación con estrellas
│   └── perfil/page.tsx           #   Perfil del ciudadano
│
├── (dependencia)/                # ROUTE GROUP: Dependencia (Servicios Públicos, etc.)
│   ├── layout.tsx                #   Layout con header y tabs
│   ├── dependencia/
│   │   ├── dashboard/page.tsx    #   Bandeja de reportes asignados
│   │   ├── metricas/page.tsx     #   Métricas y gráficas de la dependencia
│   │   └── reportes/[id]/page.tsx#   Detalle + cambio de estatus + notas
│
├── (gobierno)/                   # ROUTE GROUP: Gobierno (Mesa de Control)
│   ├── layout.tsx                #   Layout con sidebar
│   ├── gobierno/
│   │   ├── dashboard/page.tsx    #   Tabla centralizada + filtros + export (CSV/Excel/PDF)
│   │   └── reportes/[id]/page.tsx#   Detalle + canalización + cierre administrativo
│
├── (cuadrilla)/                  # ROUTE GROUP: Cuadrilla (trabajadores de campo)
│   ├── layout.tsx                #   Layout con header y tabs
│   ├── cuadrilla/
│   │   ├── dashboard/page.tsx    #   Bandeja de reportes asignados a la cuadrilla
│   │   └── reportes/[id]/page.tsx#   Detalle + avance + marcar solucionado
│
├── staff/login/page.tsx          # Login de staff (gobierno/dependencia/cuadrilla)
│
├── api/                          # API Routes (serverless)
│   ├── auth/                     # Autenticación
│   │   ├── request-otp/route.ts  #   POST — solicitar código vía SMS/demo
│   │   ├── verify-otp/route.ts   #   POST — verificar código + login
│   │   ├── login/route.ts        #   POST — login staff
│   │   ├── logout/route.ts       #   POST — logout ciudadano
│   │   ├── logout-staff/route.ts #   POST — logout staff
│   │   ├── me/route.ts           #   GET — sesión ciudadano
│   │   └── staff-me/route.ts     #   GET — sesión staff
│   ├── reportes/
│   │   ├── route.ts              #   GET (listar) + POST (crear con foto)
│   │   ├── [id]/route.ts         #   GET — detalle con historial
│   │   ├── [id]/estatus/route.ts #   PATCH — cambiar estatus
│   │   ├── [id]/asignar-cuadrilla/route.ts  # PATCH — asignar a cuadrilla
│   │   ├── [id]/avance/route.ts  #   POST — reportar avance
│   │   ├── [id]/cierre-admin/route.ts       # POST — cierre administrativo
│   │   ├── [id]/revision-ciudadano/route.ts # POST — revisión ciudadana
│   │   └── [id]/evaluacion/route.ts# POST — evaluar con estrellas
│   ├── metricas/route.ts         # GET — métricas por dependencia
│   ├── notificaciones/subscribe/route.ts # POST — suscripción push
│   ├── dependencia/jefes/route.ts# GET — listar jefes de cuadrilla
│   ├── analizar-evidencia/route.ts# POST — IA (Cloud Vision) analiza foto
│   └── analizar-foto/route.ts    # POST — IA (legacy, verificación rápida)
│
├── page.tsx                      # Landing page pública
└── globals.css                   # Tailwind v4 @theme tokens
```

---

## 4. Base de datos (Prisma + PostgreSQL en Supabase)

### Modelos

```
┌──────────────┐       ┌──────────────────────────────────┐
│  Ciudadano   │       │           Reporte                  │
├──────────────┤       ├──────────────────────────────────┤
│ id (PK)      │──1:N──│ id (PK)                           │
│ nombre       │       │ clientRequestId (UNIQUE, idempot) │
│ telefono (U) │       │ folio (UNIQUE, THC-YYYY-XXXXX)    │
│ createdAt    │       │ tipo (bache|basura|fuga|alumbrado)│
└──────────────┘       │ descripcion                       │
                       │ referencia                        │
                       │ colonia                           │
                       │ direccion                         │
                       │ lat (opcional)                    │
                       │ lng (opcional)                    │
                       │ estatus                           │
                       │ dependencia                       │
                       │ ciudadanoId (FK)                  │
                       │ ciudadanoNombre                   │
                       │ fotoUrl (opcional, Supabase URL)  │
                       │ createdAt                         │
                       └──────┬───────────────────────────┘
                              │ 1:N
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────┴──────┐  ┌────┴────────┐  ┌───┴─────────────┐
    │HistorialEstatus│  │ Evaluacion  │  │ PushSubscription│
    ├────────────────┤  ├─────────────┤  ├─────────────────┤
    │ id (PK)        │  │ id (PK)     │  │ id (PK)         │
    │ reporteId (FK) │  │ reporteId   │  │ telefono        │
    │ estatus        │  │ (UNIQUE,FK) │  │ endpoint (UNIQUE)│
    │ nota           │  │ estrellas   │  │ p256dh          │
    │ dependencia    │  │ comentario  │  │ auth            │
    │ createdAt      │  │ createdAt   │  │ createdAt       │
    └────────────────┘  └─────────────┘  └─────────────────┘
```

### Flujo de estatus
```
recibido → asignado_a_dependencia → asignado_a_jefe_cuadrilla → en_proceso
    → solucionado_por_cuadrilla → pendiente_revision_ciudadana
        → cerrado (si ciudadano confirma)
        → reabierto_por_ciudadano (si ciudadano rechaza)
    → cerrado_administrativamente (cierre forzado por gobierno)
```

---

## 5. Flujo de datos offline-first

```
CIUDADANO CREA REPORTE
         │
    ┌────┴────┐
    │ ¿Online? │
    └────┬────┘
     SI  │  NO
    ┌────┴────┐
    │         │
    ▼         ▼
POST        Guarda en
/api/       IndexedDB
reportes    (Dexie)
    │         │
    │    folio temporal:
    │    THC-PEND-XXXXX
    │         │
    │    ┌────┴────┐
    │    │Reconecta?│──NO──→ Badge "Pendiente"
    │    └────┬────┘
    │        SI
    │         │
    │    processSyncQueue()
    │    (FIFO, idempotente
    │     por clientRequestId)
    │         │
    └────┬────┘
         ▼
   Folio oficial THC-YYYY-XXXXX
```

### Capa offline (IndexedDB)
```
lib/offline/
├── db.ts            # Schema Dexie: PendingReport, PendingPhoto
├── sync-queue.ts    # Cola: enqueueReport(), processSyncQueue(), retryFailed()
└── folio.ts         # Genera folios temporales THC-PEND-XXXXX
```

### Componentes del sistema offline
```
Componentes UI:
├── SyncStatusBanner   # Banner: "Sin conexión" / "Sincronizando..."
├── SyncBadge          # Badge por reporte: Enviado / Pendiente / Error
└── useOnlineStatus()  # Hook: estado de conexión del navegador

Service Worker (public/sw.js):
├── Cache de páginas principales (/, /login, /mis-reportes, /nuevo-reporte)
├── Evento push (notificaciones)
└── Evento sync (Background Sync para cola offline)
```

---

## 6. Flujo de autenticación

### Ciudadano (sin contraseña)
```
Teléfono → POST /api/auth/request-otp
    → Devuelve código en modal (demo)
    → POST /api/auth/verify-otp
    → Sesión en cookie (SESSION_SECRET)
    → Store actualiza ciudadano + carga reportes
```

### Staff (gobierno/dependencia/cuadrilla)
```
/staff/login → Teléfono + código
    → POST /api/auth/login (staff)
    → GET /api/auth/staff-me
    → Redirige según rol: /gobierno, /dependencia, /cuadrilla
```

---

## 7. Flujo de análisis IA (Cloud Vision)

```
Solo para tipos: bache, basura

Paso 1: Selecciona tipo (bache/basura)
Paso 2: Describe problema + ubicación
Paso 3: Sube foto
    ↓
Click "Enviar reporte"
    ↓
AnalisisEvidenciaModal (popup)
    ↓
POST /api/analizar-evidencia
    ├── Convierte imagen a base64
    ├── Google Cloud Vision API (LABEL_DETECTION)
    ├── Heurística:
    │   Bache: busca labels "pothole","crack","damage","road","asphalt"
    │   Basura: busca labels "waste","garbage","trash","debris"
    ├── ¿Labels relevantes?
    │   NO → 400 { rechazada: true, mensaje: "no corresponde" }
    │        → Modal muestra error. NO permite enviar.
    │        → Usuario debe tomar otra foto o cancelar.
    │   SI → 200 { severidad/volumen, descripcion, riesgo, recomendacion }
    │        → Modal muestra resultado.
    │        → Usuario decide: "Usar análisis" o "Ignorar análisis"
    └── El análisis se adjunta a la descripción del reporte
```

---

## 8. Componentes UI principales

```
layout/
├── TopBar.tsx           # Header sticky con logo (favicon.png) y título
├── BottomNav.tsx         # Navegación inferior (ciudadano: Reportar, Mis reportes, Perfil)
├── SidebarGobierno.tsx   # Sidebar para Mesa de Control

ui/
├── Button.tsx            # Variantes: primary, secondary, accent, danger, ghost
├── Card.tsx              # Variantes: default (borde), panel (borde izquierdo)
├── Input.tsx / Textarea  # Labels flotantes, variante soft
├── Badge.tsx             # Badge de estatus (9 estados mapeados)
├── SyncBadge.tsx         # Badge de sincronización
├── SyncStatusBanner.tsx  # Banner de estado de conexión
├── LocationMap.tsx       # Mapa Leaflet dinámico (ssr: false)
├── PhotoUpload.tsx       # Cámara / galería, preview, 5MB límite
├── StarRating.tsx        # 1-5 estrellas interactivas
├── FormStepper.tsx       # Indicador de pasos (1-2-3)
├── IncidenciaIcon.tsx    # SVG por tipo (road, trash, droplet, zap)
└── AnalisisEvidenciaModal.tsx  # Modal IA: loading → resultado/rechazada/error

auth/
└── OtpDisplayModal.tsx   # Muestra código OTP (demo)

providers/
├── StoreHydration.tsx    # Hidrata estado Zustand
├── AuthHydrator.tsx      # Verifica sesión al cargar
├── OfflineSyncProvider.tsx # Escucha eventos online/offline + sync
└── PwaRegister.tsx       # Registra Service Worker + push
```

---

## 9. Paleta de colores (Tailwind v4)

```
Token CSS           Hex       Pantone        Uso
─────────────────────────────────────────────────────
--color-primary     #9b2247   7420 C         Botones, acentos, danger
--color-primary-dark #611232   7421 C         Hover, header-bar
--color-text        #161a1d   Neutral Black  Texto principal
--color-muted       #98989A   Cool Gray 7    Texto secundario
--color-success     #1e5b4f   626 C          Resuelto, confirmado
--color-warning     #a57f2c   1255 C         Pendiente, en proceso
--color-surface     #ffffff                  Fondos de tarjetas
--color-background  #f4f4f5                  Fondo general
--color-border      #d1d1d5                  Bordes
--color-input-border #98989A                 Bordes de inputs
--color-input-soft  #eff0f3                  Fondo de inputs
--color-header-bar  #611232                  Barra superior
--font-sans         Roboto                   Tipografía
```

---

## 10. Dependencias clave

| Paquete | Propósito |
|---------|-----------|
| `next` 16.2.5 | Framework React (App Router, Turbopack) |
| `react` 19.2.4 | UI library |
| `@prisma/client` 5.22 | ORM para PostgreSQL |
| `@supabase/supabase-js` 2.106 | Storage uploads (bucket `reportes`) |
| `dexie` 4.4 | IndexedDB wrapper (offline queue) |
| `zustand` 5.0 | State management |
| `leaflet` + `react-leaflet` | Mapas interactivos |
| `xlsx` | Exportación Excel |
| `jspdf` + `jspdf-autotable` | Exportación PDF |
| `zod` | Validación de schemas (instalado, pendiente usar) |
| `tailwindcss` 4 | Estilos utility-first |

---

## 11. Variables de entorno (.env)

```
DATABASE_URL                          # PostgreSQL pooler (Supabase, puerto 6543)
NEXT_PUBLIC_SUPABASE_URL              # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # Anon key (cliente)
SUPABASE_SERVICE_ROLE_KEY             # Service role (admin, server)
SESSION_SECRET                        # Firma de cookies de sesión
GOOGLE_VISION_API_KEY                 # Cloud Vision API key
```

---

## 12. Scripts npm

```
dev           next dev
build         prisma generate && next build
start         next start
lint          eslint
db:push       prisma db push
db:seed       npx tsx prisma/seed.ts
postinstall   prisma generate
```

---

## 13. PWA

- **Manifest:** `public/manifest.webmanifest` (standalone, portrait, theme #9b2247)
- **Service Worker:** `public/sw.js` (cache, push, background sync)
- **Ícono:** `public/favicon.png`
- **Tema dinámico:** `viewport.themeColor = #9b2247` en layout.tsx
