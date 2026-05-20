# Comunicacion en SIMAC

> Documento para generar un diagrama visual de la comunicacion entre componentes, servicios y capas.

---

## 1. Vision general

Arquitectura cliente-servidor con soporte offline-first. El frontend (React + Next.js App Router) se comunica con el backend (Next.js API Routes serverless en Vercel) mediante fetch() HTTP. El backend usa Prisma ORM para PostgreSQL en Supabase y el SDK de Supabase para almacenamiento de fotos. El analisis de evidencia se comunica con Google Cloud Vision API.

---

## 2. Capas de comunicacion

```
CAPA 1: FRONTEND (Navegador)
  Pages (13 page.tsx) + Zustand Store (lib/store.ts) + IndexedDB Dexie (lib/offline/db.ts)
    ↓
  lib/api/client.ts (fetch wrappers): createReporteApi, fetchReportes, fetchReporte,
    fetchAllReportes, asignarDependenciaApi, actualizarEstatusApi, evaluarReporteApi, registrarPushApi
    ↓
  lib/offline/sync-queue.ts: enqueueReport -> processSyncQueue -> retryFailed
    ↓
  Service Worker (public/sw.js): Cache paginas, Push events, Background Sync
    ↓
  fetch() HTTPS + multipart/form-data

CAPA 2: BACKEND (Vercel serverless)
  Next.js API Routes (21 endpoints en app/api/)
  ├── REPORTES: GET/POST /api/reportes, GET /api/reportes/[id],
  │     PATCH /api/reportes/[id]/estatus, PATCH /api/reportes/[id]/asignar-cuadrilla,
  │     POST /api/reportes/[id]/avance, POST /api/reportes/[id]/cierre-admin,
  │     POST /api/reportes/[id]/revision-ciudadano, POST /api/reportes/[id]/evaluacion
  ├── AUTH: POST /api/auth/request-otp, POST /api/auth/verify-otp,
  │     POST /api/auth/login, POST /api/auth/logout, POST /api/auth/logout-staff,
  │     GET /api/auth/me, GET /api/auth/staff-me
  ├── OTROS: GET /api/metricas, POST /api/notificaciones/subscribe,
  │     POST /api/analizar-evidencia, POST /api/analizar-foto,
  │     GET /api/dependencia/jefes
  ├── lib/prisma.ts (PrismaClient singleton)
  └── lib/server/supabase.ts (getSupabaseAdmin, lazy init)

CAPA 3: SERVICIOS EXTERNOS
  ├── Supabase PostgreSQL (pooler.supabase.com:6543)
  │     Modelos: Ciudadano, Reporte, HistorialEstatus, Evaluacion, PushSubscription
  ├── Supabase Storage (bucket "reportes", publico)
  │     upload(name, buffer) + getPublicUrl(name)
  └── Google Cloud Vision API (vision.googleapis.com)
        images:annotate (base64, LABEL_DETECTION)
```

---

## 3. Flujos de comunicacion detallados

### 3.1 Crear reporte de bache/basura con IA

```
1. nuevo-reporte/page.tsx
   Usuario completa: tipo + detalles + foto
   Click "Enviar reporte"

2. handleEnviarClick()
   Es bache/basura + foto + online?
   SI -> abre AnalisisEvidenciaModal
   NO -> llama enviarReporte() directo

3. AnalisisEvidenciaModal (popup)
   POST /api/analizar-evidencia
   Body: FormData { foto: Blob, tipo: "bache" }

   app/api/analizar-evidencia/route.ts:
   a) Convierte File a base64
   b) fetch Google Cloud Vision API
      POST https://vision.googleapis.com/v1/images:annotate?key=KEY
      Body: { requests: [{ image: { content: base64 }, features: [LABEL_DETECTION] }] }
      Response: { responses: [{ labelAnnotations: [{ description, score }] }] }
   c) Heuristica segun tipo:
      Bache: busca labels "pothole","crack","damage","road","asphalt"
      Basura: busca labels "waste","garbage","trash","debris"
      Labels relevantes?
        NO -> 400 { rechazada: true, mensaje: "no corresponde" }
             Modal: "Imagen no valida" -> [Tomar otra foto] [Cancelar]
        SI -> 200 { severidad/volumen, descripcion, riesgo, recomendacion }
             Modal: muestra resultado -> [Usar analisis] [Ignorar]

4. enviarReporte(analisis)
   POST /api/reportes
   Body: FormData { clientRequestId, tipo, descripcion (con analisis IA agregado),
          referencia, colonia, lat, lng, foto, ciudadanoTelefono, ciudadanoNombre }

   app/api/reportes/route.ts (POST):
   a) Dedup: prisma.reporte.findUnique({ clientRequestId })
   b) Si hay foto: saveUpload(foto)
      lib/server/upload.ts -> getSupabaseAdmin().storage.from("reportes").upload(uuid.jpg, buffer)
      -> getPublicUrl() -> URL publica de Supabase Storage
   c) DB: prisma.ciudadano.findUnique/findOrCreate(telefono)
   d) nextFolio() -> "THC-YYYY-XXXXX"
   e) prisma.reporte.create({ ...datos, fotoUrl, historial: { create: { estatus: "recibido" } } })
   f) Return 201 ReporteDTO

5. Frontend: mergeReporte() al store, router.push("/confirmacion")
```

### 3.2 Reporte offline

```
1. nuevo-reporte/page.tsx
   useOnlineStatus() -> false
   Click "Guardar para envio"

2. enviarReporte(null)
   lib/offline/sync-queue.ts -> enqueueReport(payload)
   a) Genera clientRequestId (UUID)
   b) lib/offline/folio.ts -> "THC-PEND-XXXXX"
   c) Dexie (IndexedDB): pendingReports.add({...}), pendingPhotos.add({blob})
   d) UI: SyncBadge "Pendiente de envio"

3. Al reconectar (useOnlineStatus: true)
   SyncStatusBanner detecta online
   -> processSyncQueue()
   a) Lee cola FIFO de IndexedDB
   b) Por cada pendiente: createReporteApi({ clientRequestId, ...payload })
      -> POST /api/reportes (idempotente por clientRequestId)
   c) OK: elimina de IndexedDB + mergeReporte() al store
   d) Error: marca sync_failed -> boton "Reintentar envio"

4. Service Worker (public/sw.js)
   sync event "sync-reports" -> processSyncQueue()
   push event -> self.registration.showNotification()
```

### 3.3 Autenticacion ciudadano (sin password, OTP)

```
1. login/page.tsx
   Ingresa telefono (10 digitos) -> "Continuar"

2. handleSolicitarOtp()
   POST /api/auth/request-otp
   Body: { telefono: "2221234567" }
   -> app/api/auth/request-otp/route.ts
      Busca/crea ciudadano en DB -> genera OTP -> retorna { codigo, esNuevo }
   Frontend: muestra OtpDisplayModal con el codigo

3. Usuario ingresa codigo -> "Verificar codigo"
   POST /api/auth/verify-otp
   Body: { telefono, codigo, nombre? }
   -> app/api/auth/verify-otp/route.ts
      Verifica OTP -> crea cookie de sesion (SESSION_SECRET) -> retorna { ciudadano }
   Frontend: setCiudadano() + cargarReportesCiudadano() -> redirige

4. AuthHydrator (al recargar pagina)
   GET /api/auth/me (cookie de sesion)
   -> retorna { ciudadano } o 401 -> redirige a /login
```

### 3.4 Dashboard gobierno: filtros y exportacion

```
1. gobierno/dashboard/page.tsx
   useEffect -> cargarReportesGobierno()
   -> GET /api/reportes (sin params) -> setReportes() al store
   useStatsGobierno() -> stats locales (total, pendientes, etc.)

2. Filtros (useMemo local, sin llamada al servidor):
   tipo, colonia, estatus, dependencia, fecha desde/hasta

3. Exportacion (datos del store, sin llamada al servidor):
   CSV: nativo JS (Blob + URL.createObjectURL + link descarga)
   Excel: import("xlsx") -> XLSX.utils.json_to_sheet() -> XLSX.writeFile()
   PDF: import("jspdf") + import("jspdf-autotable") -> jsPDF({landscape}) -> autoTable() -> doc.save()
```

### 3.5 Ciclo de vida del reporte (cambio de estatus)

```
CIUDADANO: POST /api/reportes -> recibido
GOBIERNO: PATCH /api/reportes/[id]/estatus -> asignado_a_dependencia
DEPENDENCIA: PATCH /api/reportes/[id]/asignar-cuadrilla -> asignado_a_jefe_cuadrilla
CUADRILLA: PATCH /api/reportes/[id]/estatus -> en_proceso
CUADRILLA: POST /api/reportes/[id]/avance -> solucionado_por_cuadrilla
CIUDADANO: POST /api/reportes/[id]/revision-ciudadano
  -> confirma: cerrado
  -> rechaza: reabierto_por_ciudadano -> vuelve a en_proceso
GOBIERNO: POST /api/reportes/[id]/cierre-admin -> cerrado_administrativamente

Cada cambio usa prisma.$transaction():
  1. Crea HistorialEstatus (estatus, nota, dependencia, actor)
  2. Actualiza Reporte (estatus, dependencia)
```

### 3.6 Metricas por dependencia

```
1. dependencia/metricas/page.tsx
   GET /api/metricas?dependencia=Obra+Publica

2. app/api/metricas/route.ts
   prisma.reporte.findMany({ where: { dependencia }, include: { evaluacion: true } })
   Calcula: total, resueltos, pctResueltos, enProceso, promedioEvaluacion,
            evaluacionesCount, porEstatus[], porTipo[]
   Return JSON -> frontend renderiza KPIs + graficas CSS
```

---

## 4. Tabla: Frontend -> Backend (todas las llamadas HTTP)

| Componente/Pagina | Accion | Metodo | Endpoint | Request Body | Response |
|---|---|---|---|---|---|
| login/page.tsx | Solicitar OTP | POST | /api/auth/request-otp | { telefono } | { codigo, esNuevo } |
| login/page.tsx | Verificar OTP | POST | /api/auth/verify-otp | { telefono, codigo, nombre? } | { ciudadano } |
| login/page.tsx | Logout | POST | /api/auth/logout | - | - |
| staff/login/page.tsx | Login staff | POST | /api/auth/login | { telefono, codigo } | { staff } |
| AuthHydrator | Restaurar sesion | GET | /api/auth/me | cookie | { ciudadano } |
| AuthHydrator | Sesion staff | GET | /api/auth/staff-me | cookie | { staff } |
| mis-reportes/page.tsx | Mis reportes | GET | /api/reportes?telefono=X | query | ReporteDTO[] |
| nuevo-reporte/page.tsx | Crear reporte | POST | /api/reportes | FormData | ReporteDTO |
| mis-reportes/[id] | Ver detalle | GET | /api/reportes/[id] | - | { reporte, historial, evaluacion } |
| mis-reportes/[id] | Revision ciudadana | POST | /api/reportes/[id]/revision-ciudadano | { acepta, comentario } | ReporteDTO |
| evaluar/[id] | Evaluar | POST | /api/reportes/[id]/evaluacion | { estrellas, comentario } | EvaluacionDTO |
| nuevo-reporte/page.tsx | Analizar evidencia IA | POST | /api/analizar-evidencia | FormData { foto, tipo } | AnalysisResult |
| gobierno/dashboard | Cargar todos | GET | /api/reportes | - | ReporteDTO[] |
| gobierno/reportes/[id] | Ver detalle | GET | /api/reportes/[id] | - | { reporte, historial } |
| gobierno/reportes/[id] | Cambiar estatus | PATCH | /api/reportes/[id]/estatus | { estatus, nota, actor } | ReporteDTO |
| gobierno/reportes/[id] | Cierre admin | POST | /api/reportes/[id]/cierre-admin | { nota } | ReporteDTO |
| dependencia/dashboard | Cargar todos | GET | /api/reportes | - | ReporteDTO[] |
| dependencia/dashboard | Asignar cuadrilla | PATCH | /api/reportes/[id]/asignar-cuadrilla | { jefeId, nota } | ReporteDTO |
| dependencia/metricas | Metricas | GET | /api/metricas?dependencia=X | query | { total, resueltos, ... } |
| cuadrilla/dashboard | Cargar todos | GET | /api/reportes | - | ReporteDTO[] |
| cuadrilla/reportes/[id] | Reportar avance | POST | /api/reportes/[id]/avance | { nota, fotos? } | ReporteDTO |
| PWA | Suscripcion push | POST | /api/notificaciones/subscribe | { telefono, subscription } | { ok } |
| dependencia | Listar jefes | GET | /api/dependencia/jefes | query | { jefes[] } |

---

## 5. Comunicacion Server-Side

```
API Route -> lib/prisma.ts -> Supabase PostgreSQL
  Todas las API routes importan: import { prisma } from "@/lib/prisma"
  PrismaClient singleton en globalThis (evita multiples instancias en dev hot-reload)
  Connection: postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true

Operaciones Prisma usadas:
  prisma.ciudadano.findUnique / .create / .update / .upsert
  prisma.reporte.findUnique / .findMany / .create / .update / .count
  prisma.historialEstatus.create
  prisma.evaluacion.upsert
  prisma.pushSubscription.upsert
  prisma.$transaction(async (tx) => { ... })

API Route -> lib/server/upload.ts -> Supabase Storage
  getSupabaseAdmin().storage.from("reportes").upload(uuid.jpg, buffer, { contentType })
  getSupabaseAdmin().storage.from("reportes").getPublicUrl(uuid.jpg)
  -> Retorna URL publica CDN de Supabase

API Route -> Google Cloud Vision (solo analizar-evidencia)
  fetch("https://vision.googleapis.com/v1/images:annotate?key=KEY")
  Body: { requests: [{ image: { content: base64 }, features: [{ type: "LABEL_DETECTION" }] }] }
```

---

## 6. Comunicacion State Management (Zustand)

```
lib/store.ts - Estado global

State:
  ciudadano: Ciudadano | null
  reportes: Reporte[]
  ultimoReporte: { id, folio, esOffline } | null
  loading: boolean

Acciones:
  setCiudadano(c)        -> actualiza ciudadano
  setReportes(r)         -> reemplaza lista de reportes
  mergeReporte(r)        -> inserta o actualiza un reporte
  setUltimoReporte(...)  -> guarda resultado del envio
  setLoading(v)          -> toggle loading
  cargarReportesCiudadano() -> GET /api/reportes?telefono=X -> setReportes
  cargarReportesGobierno()  -> GET /api/reportes -> setReportes
  cargarReportesDependencia() -> GET /api/reportes -> setReportes
  cargarReportesCuadrilla()   -> GET /api/reportes -> setReportes

Selectores (hooks):
  useAppStore(selector)   -> acceso directo al store
  useReportesCiudadano()  -> reportes filtrados
  useStatsGobierno()      -> estadisticas calculadas

Componentes leen:
  const ciudadano = useAppStore(s => s.ciudadano)
  const reportes = useAppStore(s => s.reportes)
  const stats = useStatsGobierno()
```

---

## 7. Comunicacion Offline Layer

```
hooks/useOnlineStatus.ts
  Monitor: navigator.onLine + window eventos online/offline
  Retorna: boolean
  Usado por: SyncStatusBanner, nuevo-reporte, sync-queue

lib/offline/db.ts (Dexie/IndexedDB)
  Tablas: pendingReports ({ clientRequestId, payload, folioTemp, syncStatus, ... })
          pendingPhotos  ({ clientRequestId, blob })

lib/offline/sync-queue.ts
  enqueueReport(payload)        -> guarda en IndexedDB + retorna { clientRequestId, folioTemporal }
  processSyncQueue()            -> lee cola FIFO -> createReporteApi() -> OK=borrar | ERROR=marca failed
                                   Retorna { synced, failed }
  retryFailed(clientRequestId)  -> reintenta uno especifico (boton "Reintentar envio")
  subscribeSync(callback)       -> notifica cambios en cola para UI reactiva

lib/offline/folio.ts
  generarFolioTemporal() -> "THC-PEND-XXXXX"

public/sw.js (Service Worker)
  install  -> precache (/, /login, /mis-reportes, /nuevo-reporte)
  activate -> limpia caches viejas
  fetch    -> cache-first para paginas, network-only para /api/*
  push     -> self.registration.showNotification()
  sync     -> escucha evento "sync-reports" para sincronizar en background
```

---

## 8. Matriz de dependencias de comunicacion

| Origen | Destino | Protocolo/Medio |
|--------|---------|-----------------|
| Pages React | Zustand Store | Llamada directa JavaScript |
| Pages React | lib/api/client.ts | Llamada directa JavaScript |
| lib/api/client.ts | /api/* (API Routes) | fetch() HTTPS + JSON/FormData |
| lib/offline/sync-queue | /api/* (API Routes) | fetch() HTTPS |
| lib/offline/sync-queue | IndexedDB (Dexie) | Dexie API (JS) |
| Pages React | IndexedDB (Dexie) | Dexie API (JS) |
| API Routes | lib/prisma.ts | Import directo JavaScript |
| API Routes | lib/server/supabase.ts | Import directo JavaScript |
| lib/prisma.ts | Supabase PostgreSQL | TCP/IP (Prisma engine, pgBouncer) |
| lib/server/upload.ts | Supabase Storage | HTTPS (Supabase SDK) |
| analizar-evidencia route | Google Cloud Vision | HTTPS REST |
| Service Worker | Browser | Cache API, Push API, Background Sync |
| PwaRegister | Service Worker | navigator.serviceWorker.register() |
| useOnlineStatus | Browser | navigator.onLine + eventos DOM |

---

## 9. Secuencia temporal: crear reporte de bache con foto (online)

```
0ms     Usuario selecciona "Bache"
1s      Usuario llena descripcion
2s      Usuario toma foto con camara
3s      Click "Enviar reporte"
3ms     Abre AnalisisEvidenciaModal -> spinner "Analizando..."
3ms     fetch POST /api/analizar-evidencia (FormData { foto, tipo })
300ms   API: File -> base64
500ms   API -> Cloud Vision: POST images:annotate (base64)
1.5s    Cloud Vision -> API: { labelAnnotations: [...] }
1.5s    API: heuristica -> { severidad: "medio", descripcion, riesgo, recomendacion }
1.5s    Modal: muestra resultado
4s      Usuario click "Usar este analisis"
4ms     handleAnalisisComplete() -> cierra modal -> enviarReporte(analisis)
4ms     fetch POST /api/reportes (FormData con datos + analisis IA)
5ms     API: validacion + dedup (clientRequestId)
5ms     API -> Supabase Storage: upload("uuid.jpg", buffer)
800ms   Storage -> API: URL publica
800ms   API -> Prisma: findOrCreate ciudadano
810ms   API -> Prisma: create reporte + historial
820ms   Prisma -> PostgreSQL: INSERT INTO Reporte, HistorialEstatus
850ms   API -> Frontend: 201 { folio, id, ... }
850ms   Frontend: mergeReporte() al store
851ms   router.push("/confirmacion")
```

---

## 10. Manejo de errores

| Nivel | Error | Manejo |
|-------|-------|--------|
| fetch (cliente) | Sin conexion | Cola offline en IndexedDB |
| fetch (cliente) | 4xx / 5xx | Mensaje de error en UI |
| fetch (cliente) | Timeout | Error generico + opcion reintentar |
| API route | Prisma error | 500 { error: "mensaje" } |
| API route | Storage error | 500 { error: "mensaje" } |
| API route | Cloud Vision 4xx/5xx | 502 { error: "..." } |
| API route | Validacion formulario | 400 { error: "..." } |
| analizar-evidencia | Imagen no corresponde | 400 { rechazada: true, mensaje: "..." } |
| Offline queue | sync_failed | Badge "Error" + boton "Reintentar envio" |
| Service Worker | Fetch sin cache | Sirve de IndexedDB o fallback offline |
| Zustand | Estado no hidratado | StoreHydration al cargar la app |
