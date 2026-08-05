# 🎬 ViolentMonkey DLC Loader — Video Skip Buttons

Plugin estandarizado para **ViolentMonkey** (y compatible con **Tampermonkey**) que carga e instancia todo el sistema DLC del proyecto **∞Iframes** en cualquier página web con videos embebidos, permitiendo saltar OP/ED, aplicar loop, cambiar velocidad, silenciar y gestionar capítulos — incluso en dominios externos (cross-origin).

---

## 📦 Instalación

### Opción 1: Desde el archivo local
1. Instala la extensión [ViolentMonkey](https://violentmonkey.github.io/) en tu navegador.
2. Abre el panel de ViolentMonkey → **"+"** → **"Crear desde archivo"**.
3. Selecciona `violentmonkey-dlc-loader.user.js` de este proyecto.

### Opción 2: Instalación directa (URL)
Una vez subido el archivo al repositorio:
1. Visita la URL raw del archivo en GitHub.
2. ViolentMonkey detectará el script y ofrecerá instalarlo automáticamente.

---

## 🏗️ Arquitectura de Integración DLC

El plugin funciona como un **puente (bridge)** entre la página visitada y los módulos DLC alojados en GitHub:

```
┌─────────────────────────────────────────────────────────┐
│                  Página externa (cualquier dominio)       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           ViolentMonkey UserScript                   │ │
│  │                                                       │ │
│  │  1. Carga scripts DLC desde GitHub raw              │ │
│  │  2. Los inyecta en el contexto de la página          │ │
│  │  3. Configura YouTube postMessage Bridge             │ │
│  │  4. Inyecta panel UI flotante                        │ │
│  │  5. Detecta videos con MutationObserver              │ │
│  │  6. Dispara evento 'matrixItemRendered'              │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Core Engine (inyectado)                     │ │
│  │  • Parsea hash: #op=[01:30]&ed=[22:00-23:30]        │ │
│  │  • Emite: dlc:videoConfigured, dlc:timeUpdate        │ │
│  │  • Expone: window.dlcCoreEngine.seekVideo()          │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                 │
│         ┌───────────────┼───────────────┐                │
│         ▼               ▼               ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │Skip Buttons│  │ Auto-Skip  │  │Video Loop  │         │
│  │(OP/ED UI)  │  │(auto jump) │  │(bucle)     │         │
│  └────────────┘  └────────────┘  └────────────┘         │
│  ┌────────────────┐  ┌──────────────────┐               │
│  │Video Modifiers │  │ Video Chapters   │               │
│  │(speed/mute)    │  │(capítulos)       │               │
│  └────────────────┘  └──────────────────┘               │
│                                                           │
│  📺 Video HTML5 / YouTube Embed                          │
└─────────────────────────────────────────────────────────┘
```

### Flujo de señales (Event Bus)

| Evento CustomEvent | Emitido por | Escuchado por | Propósito |
|---|---|---|---|
| `matrixItemRendered` | VM Plugin / ∞Iframes | `core-engine.js` | Registro inicial del video |
| `dlc:videoConfigured` | `core-engine.js` | Todos los módulos DLC | Notifica configuración parseada |
| `dlc:timeUpdate` | `core-engine.js` / VM Bridge | Todos los módulos DLC | Sincronización de tiempo |

---

## 🎮 Uso del Panel UI

El plugin inyecta un panel flotante (abajo a la derecha) con:

### Controles disponibles

| Campo | Formato | Ejemplo | Descripción |
|---|---|---|---|
| **OP** | `[MM:SS]`, `MM:SS`, `[MM:SS-MM:SS]` | `[01:30]` | Saltar Opening |
| **ED** | `[MM:SS-MM:SS]`, `MM:SS` | `[22:00-23:30]` | Saltar Ending |
| **Duración** | Número (segundos) | `90` | Rango implícito para `[MM:SS]` |
| **Loop** | `[MM:SS-MM:SS]` | `[05:00-06:00]` | Bucle de sección |
| **Velocidad** | `X.XX@[MM:SS]` | `1.5@[01:00]` | Cambiar playback rate |
| **Mute** | `[MM:SS]` | `[10:00]` | Silenciar en rango |

### Botones de acción
- **✨ Aplicar**: Registra el video con la configuración ingresada
- **⏭️ Saltar OP/ED**: Salta directamente al tiempo definido
- **🗑️ Limpiar**: Borra todos los campos

---

## 🔧 Formatos de Parámetros Soportados

### Sintaxis de corchetes (clave del sistema)

```
# Rango exacto: del minuto 1:30 al 3:00
op=[01:30-03:00]

# Rango implícito: desde 1:30 + duración (default 90s)
op=[01:30]

# Punto fijo: salta exactamente a 1:30
op=01:30

# Duración explícita: desde 1:30 + 45 segundos
op=01:30+45s

# Auto-skip: salta automáticamente (sin botón)
op=![01:30]
```

### Ejemplos completos en URL

```
# YouTube embed con OP y ED
https://youtube.com/embed/VIDEO_ID#op=[01:30]&ed=[22:00-23:30]

# Con loop y velocidad
https://youtube.com/embed/VIDEO_ID#d=120&op=[01:30]&loop=[05:00-06:00]&speed=1.5@[02:00]

# Auto-skip automático
https://youtube.com/embed/VIDEO_ID#op=![01:30]&ed=![22:00]
```

---

## 🌐 Solución Cross-Origin (YouTube Bridge)

El problema principal con videos embebidos de YouTube es el **CORS**: el JavaScript de la página no puede acceder al `currentTime` del iframe.

### Cómo lo resuelve el plugin

1. **Inyección de `enablejsapi=1`**: El plugin añade automáticamente este parámetro a los iframes de YouTube para habilitar la API de control.

2. **postMessage Bridge**: Intercepta los mensajes `infoDelivery` de YouTube que contienen el `currentTime` y los reenvía como eventos `dlc:timeUpdate` al core-engine.

3. **Polling periódico**: Cada segundo solicita el tiempo actual a los iframes registrados.

```javascript
// El plugin envía comandos a YouTube así:
iframe.contentWindow.postMessage(JSON.stringify({
    event: 'command',
    func: 'seekTo',
    args: [90, true]  // saltar a 1:30
}), '*');
```

---

## 🔄 Detección Automática

El plugin usa **tres mecanismos** para detectar videos:

| Mecanismo | Cuándo | Tipo de Video |
|---|---|---|
| **Detección inicial** | Al cargar (+1.5s) | Todos los visibles |
| **MutationObserver** | En tiempo real | Videos añadidos dinámicamente |
| **Polling cada 5s** | Fallback | Videos cargados tarde |

Tipos detectados:
- `<video>` HTML5 nativo
- `<iframe src*="youtube.com/embed/">`
- `<iframe src*="youtube-nocookie.com/embed/">`
- `<iframe src*="youtu.be/">`

---

## ⚙️ Configuración Avanzada

### Modificar dominios de carga (@match)

Por defecto el plugin se ejecuta en todos los sitios (`*://*/*`). Para restringirlo:

```javascript
// @match        *://*.youtube.com/*
// @match        *://*.netflix.com/*
// @match        *://*.crunchyroll.com/*
```

### Cambiar la URL base de los scripts DLC

Si usas un fork o rama diferente:

```javascript
const RAW_BASE = 'https://raw.githubusercontent.com/TU_USUARIO/misterbartra.github.io/main/HTML-CoreProyects/%E2%88%9EIframes/src/dlc';
```

### Modo mínimo (offline)

Si no hay conexión a GitHub, el plugin activa automáticamente un **modo mínimo** con un core-engine básico que permite:
- Seek (saltar tiempo) en videos HTML5 y YouTube
- Panel UI funcional
- Sin módulos avanzados (loop, chapters, modifiers)

---

## 🧩 Módulos DLC y sus Funciones

| Módulo | Función | Dependencia |
|---|---|---|
| `core-engine.js` | Parsea config, emite eventos, control de reproducción | Autónomo |
| `skip-buttons.js` | Crea botones flotantes OP/ED sobre el video | Core Engine |
| `auto-skip.js` | Salta automáticamente rangos marcados con `!` | Core Engine |
| `video-loop.js` | Repite secciones definidas con `loop=` | Core Engine |
| `video-modifiers.js` | Cambia velocidad (`speed=`) y mute (`mute=`) | Core Engine |
| `video-chapters.js` | Crea navegación de capítulos (`ch=`) | Core Engine |

---

## 📋 API Pública

Una vez cargado, el plugin expone estos objetos globales en `window`:

```javascript
// Motor central
window.dlcCoreEngine.seekVideo(element, seconds);
window.dlcCoreEngine.setVolume(element, muted);
window.dlcCoreEngine.setPlaybackRate(element, rate);
window.dlcCoreEngine.getCurrentTime(element);

// Instancias de módulos
window.skipButtonsDLC    // Botones OP/ED
window.autoSkipDLC       // Auto-skip
window.videoLoopDLC      // Loop
window.videoModifiersDLC // Velocidad/Mute
window.videoChaptersDLC  // Capítulos

// Videos detectados por el plugin
window.__vmVideos        // Array de videos detectados
```

---

## ❓ Solución de Problemas

| Problema | Solución |
|---|---|
| El panel no aparece | Verifica que ViolentMonkey está activo y el script está habilitado |
| Los botones no aparecen | Asegúrate de presionar **"Aplicar Configuración"** tras ingresar OP/ED |
| YouTube no responde | Verifica que el iframe tenga `enablejsapi=1` (el plugin lo añade autom.) |
| Error de carga de scripts | Revisa la consola (F12) — puede ser bloqueo de red o CORS |
| Modo mínimo activado | Sin conexión a GitHub — el plugin usa funcionalidad reducida |

---

## 🔗 Enlaces

- **Repositorio**: [misterbartra.github.io](https://github.com/MisterBartra/misterbartra.github.io)
- **Demo local**: `video-demo.html`
- **ViolentMonkey**: [violentmonkey.github.io](https://violentmonkey.github.io/)