# Cómplices Web - Panel de Administración y Monitoreo

Plataforma Web desarrollada en **Next.js 15 (App Router)** y **Tailwind CSS** para la gestión, visualización y supervisión en tiempo real de la aplicación **Cómplices**.

---

## 🚀 Características Principales

1. **Autenticación y Roles:**
   - **Super Administrador:** Visión global del sistema, estadísticas consolidadas, gestión integral de cuentas de parejas, registro de actividad y monitoreo multi-dispositivo.
   - **Espacio Privado de Pareja:** Acceso seguro para cada pareja con visualización de sus propios chats, planes, recuerdos, fotos sincronizadas y geolocalización.

2. **Geolocalización en Tiempo Real (GPS):**
   - Mapa interactivo en vivo con OpenStreetMap / Leaflet.
   - Historial detallado de puntos de rastreo satelital: coordenadas, precisión GPS, velocidad y porcentaje de batería del dispositivo.

3. **Galería Sincronizada (Sync):**
   - Visor multimedia en tiempo real conectado a Supabase Storage (`gallery_sync`).
   - Vista de fotos tomadas en el dispositivo móvil con autor y marca de tiempo.

4. **Registro de Notificaciones del Dispositivo:**
   - Auditoría y visor en vivo de notificaciones entrantes de apps de mensajería y redes sociales (WhatsApp, Instagram, etc.).

5. **Gestión de Parejas y Contenidos:**
   - Creación, edición y vinculación de parejas.
   - Supervisión de mensajes de chat en vivo, memorias y planes de pareja.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 15.3 (React 19, TypeScript)
- **Estilos:** Tailwind CSS con paleta temática Cómplices (Wine/Burgundy & Gold)
- **Base de Datos & Storage:** Supabase (PostgreSQL, Realtime, Buckets)
- **Mapas:** Leaflet / OpenStreetMap / Lucide Icons

---

## 💻 Instalación y Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# Compilar para producción
npm run build
npm run start
```
