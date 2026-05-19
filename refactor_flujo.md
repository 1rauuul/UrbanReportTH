# Prompt largo para agente: refactor del flujo de reportes ciudadanos

Actúa como arquitecto de software, analista funcional y desarrollador full-stack senior.  
Necesito que refactorices el flujo de una plataforma de reportes ciudadanos y gestión institucional.  
Tu tarea es **analizar, rediseñar e implementar** la lógica funcional, los roles, los permisos, el enrutamiento y los cambios de interfaz descritos abajo, manteniendo consistencia entre frontend, backend, base de datos y reglas de negocio.[cite:12]

## Objetivo general

Reestructurar la plataforma para que el flujo de atención de reportes ciudadanos sea automático por dependencia, con gestión interna por dependencia y asignación operativa a “jefes de cuadrilla”, mientras que la mesa de control queda únicamente como módulo centralizador para consulta, históricos y reportes administrativos.[cite:12]

## Cambios de navegación inicial

1. Al acceder a la página principal, **redirigir inmediatamente al login**.
2. Ya no se deben mostrar en la página principal los botones de acceso previo al módulo de mesas ni al acceso ciudadano.
3. El acceso a cada módulo debe depender del rol autenticado del usuario.

## Cambios en el formulario de reporte ciudadano

1. Eliminar la opción **“Otro”** del tipo de reporte.
2. Sustituir los emojis por **iconos minimalistas y consistentes** con el diseño del sistema.
3. Cambiar la etiqueta **“Luminaria”** por **“Alumbrado”** en toda la aplicación.
4. En la sección de datos del reporte:
   - Corregir el layout para evitar que los componentes se encimen con el header o el footer.
   - Al presionar **“Usar mi ubicación”**, el mapa debe centrarse automáticamente en la ubicación detectada del usuario y mover el marcador a ese punto, si aplica.

## Reglas de asignación automática

Cuando un ciudadano envía un reporte, este debe asignarse **automáticamente** a una dependencia según su tipo.[cite:12]

Mapa de asignación:

- **Bache** → **Obra Pública**
- **Alumbrado** → **Obra Pública**
- **Fuga de agua** → **OOSAPAT**
- **Basura** → **OOSELITE**

Estas reglas deben aplicarse desde backend para evitar inconsistencias por cliente o manipulación desde frontend.[cite:12]

## Nuevo modelo operativo

Implementa una nueva entidad llamada **Jefe de Cuadrilla**.

### Relación con dependencias

- Cada **dependencia** tiene sus propios **jefes de cuadrilla**.
- Un jefe de cuadrilla solo puede recibir reportes de su misma dependencia.
- Ejemplo: si un usuario pertenece a **OOSELITE**, no se le pueden asignar reportes de otras áreas o dependencias.

### Cambio de responsabilidad de la mesa de control

- El panel de **mesa de control** ya no asigna reportes a dependencias.
- La mesa de control solo debe:
  - centralizar reportes,
  - consultar información global,
  - generar históricos,
  - generar reportes administrativos o estadísticos.

### Nuevo alcance por dependencia

- Cada dependencia tendrá su **propio portal**.
- Cada portal de dependencia:
  - recibe únicamente los reportes que le fueron asignados automáticamente,
  - permite gestionarlos internamente,
  - no puede ver reportes de otras dependencias.

### Gestión interna en dependencia

- La dependencia asigna cada reporte a uno de sus **jefes de cuadrilla**.
- El jefe de cuadrilla es quien ejecuta la atención operativa y reporta la solución.

## Nuevo flujo de estados del reporte

Define e implementa el siguiente flujo de vida del reporte:

1. **Ciudadano crea reporte**
2. **Sistema asigna automáticamente la dependencia**
3. **Dependencia recibe el reporte**
4. **Dependencia asigna el reporte a un jefe de cuadrilla**
5. **Jefe de cuadrilla atiende y marca como solucionado**
6. El reporte cambia a estado: **Pendiente de revisión por el ciudadano**
7. El ciudadano revisa el resultado y puede:
   - **Confirmar que sí se solucionó** → el ticket pasa a **Resuelto/Cerrado**
   - **Indicar que no se solucionó** → el ticket vuelve a revisión por parte de la dependencia
8. Si el ciudadano indica que no se solucionó:
   - en el panel de la dependencia debe aparecer como caso pendiente de revisión,
   - la dependencia podrá reabrir, reasignar, revisar el cierre o cerrar administrativamente el ticket con trazabilidad.

## Roles y permisos

Define claramente roles, permisos y restricciones mínimas:

### 1. Ciudadano

- Crear reportes
- Consultar el estado de sus propios reportes
- Revisar reportes marcados como solucionados
- Confirmar o rechazar la solución

### 2. Mesa de control

- Ver todos los reportes
- Consultar históricos
- Generar reportes administrativos
- No asigna dependencias
- No opera reportes de otras áreas como dependencia ejecutora

### 3. Usuario de dependencia

- Ver solo reportes de su dependencia
- Asignar reportes a jefes de cuadrilla de su misma dependencia
- Dar seguimiento
- Gestionar incidencias rechazadas por el ciudadano
- Cerrar tickets según reglas del negocio

### 4. Jefe de cuadrilla

- Ver solo reportes asignados a él
- Actualizar avance
- Marcar atención como concluida
- Enviar evidencia o comentario de solución si el sistema lo contempla
- No puede ver ni gestionar reportes fuera de su dependencia

## Requerimientos técnicos

Quiero que hagas lo siguiente:

1. Analiza el sistema actual y detecta qué partes deben refactorizarse:
   - rutas,
   - guards de autenticación,
   - vistas,
   - modelo de datos,
   - permisos,
   - lógica de asignación,
   - estados del reporte.

2. Propón la nueva arquitectura funcional con:
   - entidades,
   - relaciones,
   - estados,
   - transiciones,
   - reglas de autorización.

3. Implementa los cambios en:
   - frontend,
   - backend,
   - base de datos,
   - API,
   - validaciones.

4. Asegúrate de que no existan fugas de información entre dependencias.

5. Mantén trazabilidad de cada cambio de estado y de cada asignación.

## Entidades mínimas esperadas

Ajusta o crea las entidades necesarias para soportar el flujo. Como mínimo contempla:

- Usuario
- Rol
- Dependencia
- JefeDeCuadrilla
- Reporte
- TipoReporte
- HistorialReporte
- Evidencia (opcional, pero recomendable)
- AsignacionReporte

## Estados sugeridos del reporte

Usa nombres consistentes y normalizados para los estados. Por ejemplo:

- Creado
- AsignadoADependencia
- AsignadoAJefeDeCuadrilla
- EnProceso
- SolucionadoPorCuadrilla
- PendienteRevisionCiudadana
- ReabiertoPorCiudadano
- Cerrado
- CerradoAdministrativamente

## Criterios de aceptación

- La pantalla inicial redirige al login sin mostrar accesos previos.
- El formulario ciudadano ya no incluye la opción “Otro”.
- “Luminaria” fue reemplazado por “Alumbrado” en todo el sistema.
- Los emojis fueron reemplazados por iconografía minimalista.
- El layout del formulario ya no invade header ni footer.
- “Usar mi ubicación” centra correctamente el mapa en la posición detectada.
- Cada reporte se asigna automáticamente a la dependencia correcta según su tipo.
- La mesa de control ya no asigna dependencias.
- Cada dependencia solo ve sus propios reportes.
- Cada dependencia solo puede asignar a sus propios jefes de cuadrilla.
- Cada jefe de cuadrilla solo ve reportes asignados a él y de su dependencia.
- Cuando cuadrilla marca un reporte como resuelto, el ciudadano debe revisarlo antes del cierre final.
- Si el ciudadano rechaza la solución, el reporte vuelve al flujo de revisión de la dependencia.
- Todo cambio relevante queda registrado en historial.

## Entregables esperados

Quiero que generes la respuesta en este orden:

1. Resumen funcional del nuevo flujo
2. Lista de cambios por módulo
3. Modelo de datos propuesto
4. Reglas de negocio
5. Matriz de roles y permisos
6. Flujo de estados del reporte
7. Casos de uso prioritarios
8. Plan de implementación por fases
9. Riesgos o validaciones importantes
10. Si aplica, ejemplos de pseudocódigo o estructura de endpoints

## Restricciones importantes

- No hagas suposiciones silenciosas: si falta información crítica, enumera los supuestos.
- Prioriza seguridad, separación por dependencia y trazabilidad.
- No permitas acceso cruzado entre dependencias.
- La asignación automática debe ser auditable.
- Mantén nombres claros, consistentes y orientados al dominio del negocio.[cite:12][cite:13]
