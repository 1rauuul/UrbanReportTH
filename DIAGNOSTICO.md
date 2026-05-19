# Diagnóstico del proyecto — Urban Report

**Fecha:** 19 de mayo de 2026
**Objetivo:** Revisión del estado actual, bloqueos y pendientes para despliegue en Vercel.

---

## 1. Bloqueo crítico: build en Vercel

**Error actual:**
```
Error: supabaseUrl is required.
    at .next/server/chunks/.../lib/server/supabase.ts
    at module evaluation
    at /api/reportes/route.js:6:3
```

**Causa:** `lib/server/supabase.ts` instancia `createClient()` a nivel módulo. Durante el build de Next.js en Vercel, el módulo se evalúa antes de que las variables de entorno estén disponibles en ese contexto de compilación.

**Fix aplicado:** `supabase.ts` ahora usa **lazy init** (mismo patrón que `lib/prisma.ts`). `upload.ts` actualizado para usar `getSupabaseAdmin()`.

```ts
// Fix ya aplicado en lib/server/supabase.ts y lib/server/upload.ts
```

---

## 2. Checklist migración a Supabase

| Requisito | Estado |
|-----------|--------|
| `prisma/schema.prisma` — `sqlite` → `postgresql` | Hecho |
| Variables de entorno en `.env` (4 vars) | Hecho |
| Bucket `reportes` en Supabase Storage | Hecho |
| `lib/server/upload.ts` — Supabase Storage | Hecho |
| Schema PostgreSQL creado | Hecho (SQL Editor) |
| Seed ejecutado contra Supabase | Hecho |
| Build local sin errores | Hecho |
| Build en Vercel | Hecho — deploy exitoso |

---

## 3. Pendientes del MVP original

| Pendiente | Estado | Prioridad |
|-----------|--------|-----------|
| Migrar de SQLite a PostgreSQL | Hecho | — |
| Subir evidencias a almacenamiento escalable | Hecho — Supabase Storage | — |
| Claves VAPID reales para notificaciones push | Pendiente | Media |
| Configurar para entorno productivo | Parcial | Alta |

---

## 4. Hallazgos y recomendaciones

### Archivos y configuración

| Hallazgo | Recomendación |
|----------|---------------|
| `lib/server/supabase.ts` — lazy init | Hecho — `getSupabaseAdmin()` con singleton |
| `prisma/dev.db` (SQLite legacy) | Eliminado |
| `public/uploads/` — vestigial | Eliminado |
| `.env.example` atrapado por `.env*` en `.gitignore` | Hecho — agregado `!.env.example` |
| `@supabase/ssr` instalado pero no usado | Opcional: remover o usar para autenticación futura |
| No hay `middleware.ts` | Las rutas `/gobierno/*` y `/dependencia/*` no tienen protección de auth |
| No hay `vercel.json` | Opcional: definir región o reglas de deploy |
| `zod` instalado pero sin validación server-side | Opcional: usar para validar inputs de API |
| `prisma db push` no funciona desde red local con pooler | Los cambios de schema deben hacerse vía SQL Editor de Supabase |
| Build script sin `db push` (solo `prisma generate`) | Aceptable para MVP, migraciones son manuales |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` definida pero no usada en cliente | Puede ser útil si se añade auth con Supabase Auth o RLS |

### API y backend

| Hallazgo | Detalle |
|----------|---------|
| 7 endpoints implementados | `GET/POST /api/reportes`, `GET /api/reportes/[id]`, `PATCH /api/reportes/[id]/asignar`, `PATCH /api/reportes/[id]/estatus`, `POST /api/reportes/[id]/evaluacion`, `POST /api/notificaciones/subscribe`, `GET /api/metricas` |
| Sin validación de entrada server-side | Los endpoints reciben `formData()` o `JSON` sin schema de validación (solo checks manuales) |
| Fotos se suben a Supabase Storage | `lib/server/upload.ts` → bucket `reportes` |
| Offline-first funcional | Dexie + sync-queue, folios temporales `THC-PEND-XXXXX` |

### Frontend

| Hallazgo | Detalle |
|----------|---------|
| 14 páginas en 3 portales | Ciudadano, Dependencia, Gobierno |
| PWA funcional | Service worker y manifest configurados |
| Mapa Leaflet/OpenStreetMap | Sin API key requerida |
| Sin autenticación | Login por teléfono sin contraseña ni token |
| Zustand como state management | Store con estado de conexión, reportes, etc. |

---

## 5. Pasos para desbloquear Vercel

1. ~~Lazy init de `lib/server/supabase.ts`~~ Hecho
2. Verificar que las 4 variables de entorno estén en Vercel Dashboard:
   - `DATABASE_URL` — connection string del pooler (puerto 6543, `?pgbouncer=true`)
   - `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key
3. Hacer push a GitHub y deployar en Vercel

---

## 6. Pasos recomendados post-deploy

| Prioridad | Tarea |
|-----------|-------|
| Alta | Probar flujo offline-first en producción (crear reporte sin red, reconectar) |
| Alta | Probar carga de fotos a Supabase Storage desde el entorno productivo |
| Media | ~~Limpiar archivos legacy~~ Hecho |
| Media | ~~Arreglar `.gitignore`~~ Hecho |
| Media | Configurar claves VAPID reales para notificaciones push |
| Baja | Eliminar dependencias no usadas (`@supabase/ssr`, `zod`) o implementar su uso |
| Baja | Agregar `middleware.ts` para proteger rutas de gobierno/dependencia |
| Baja | Agregar validación server-side con `zod` en los API routes |
| Baja | Actualizar `urban-report-mvp.md` con el estado actual |

---

## 7. Variables de entorno requeridas 

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 8. Infraestructura actual

| Componente | Proveedor | Plan |
|------------|-----------|------|
| Hosting | Vercel | Hobby (gratuito) |
| Base de datos | Supabase PostgreSQL | Free (500 MB) |
| Almacenamiento de fotos | Supabase Storage | Free (1 GB) |
| Mapas | Leaflet + OpenStreetMap | Gratuito (sin API key) |
| Notificaciones push | Service Worker + Web Push API | Pendiente configurar VAPID |
| Offline storage | IndexedDB (Dexie) | Navegador del usuario |
