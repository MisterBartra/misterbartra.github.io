# 🎬 DLC (Downloadable Content) para ∞Iframes

Sistema modular para añadir funcionalidades a los iframes de video mediante **parámetros en el hash de la URL**.

## 📦 Módulos disponibles

| Módulo | Archivo | Función |
|--------|---------|---------|
| **Core Engine** | `src/dlc/core-engine.js` | Parser de hash + tracker de tiempo |
| **Skip Buttons** | `src/dlc/skip-buttons.js` | Botones flotantes Skip OP/ED |
| **Auto-Loader** | `violentmonkey-dlc-loader.user.js` | Carga remota vía ViolentMonkey |

---

## 🎯 Parámetros del Hash (`#...`)

### Formatos de tiempo para `op`, `ed`, `loop`

El sistema soporta **8 formatos distintos** divididos en 3 categorías:

#### 📌 FORMATOS ABSOLUTOS (se aplican inmediatamente)

| # | Sintaxis | Descripción | Ejemplo | Resultado |
|---|----------|-------------|---------|-----------|
| 1 | `[MM:SS-MM:SS]` | Rango exacto con inicio y fin | `op=[01:31-03:01]` | 91s → 181s |
| 2 | `[MM:SS]` | Desde MM:SS durante `d` segundos | `op=[01:31]` | 91s → 181s (con d=90) |
| 3 | `MM:SS+Ns` | Desde MM:SS durante N segundos | `op=01:31+90s` | 91s → 181s |
| 4 | `MM:SS` | Punto fijo (inicio = fin) | `op=01:31` | 91s (punto) |

#### 📌 FORMATOS RELATIVOS AL INICIO (inmediatos)

| # | Sintaxis | Descripción | Ejemplo | Resultado |
|---|----------|-------------|---------|-----------|
| 5 | `+N` o `start+N` | Primeros N segundos | `op=+90` | 0s → 90s |

#### 📌 FORMATOS RELATIVOS AL FINAL (diferidos — requieren conocer duración)

| # | Sintaxis | Descripción | Ejemplo | Resultado |
|---|----------|-------------|---------|-----------|
| 6 | `-N` o `end-N` | Últimos N segundos | `ed=-90` | (duración-90) → duración |
| 7 | `[MM:SS-]` | Desde MM:SS hasta el final | `ed=[22:00-]` | 1320s → duración |
| 8 | `[-MM:SS]` | Desde el inicio hasta MM:SS | `op=[-01:31]` | 0s → 91s |

---

## 🔧 Modificadores

| Modificador | Sintaxis | Descripción |
|-------------|----------|-------------|
| **Auto-skip** | `!op=...` o `!ed=...` | Salta automáticamente sin mostrar botón |
| **Duración** | `d=90` | Duración por defecto para formato implícito (default: 90s) |
| **Velocidad** | `speed=1.5@[01:00]` | Cambia velocidad en el rango |
| **Silencio** | `mute=[05:00]` | Silencia durante el rango |
| **Bucle** | `loop=[01:30-01:35]` | Repite el rango indefinidamente |
| **Capítulos** | `ch=Intro(00:00),OP(01:31)` | Define capítulos |

---

## 🌐 Soporte de Plataformas

| Plataforma | getTime | getDuration | seek | Método |
|------------|---------|-------------|------|--------|
| **YouTube** | ✅ | ✅ | ✅ | `enablejsapi=1` + postMessage |
| **ok.ru** | ✅ | ✅ | ✅ | postMessage `{method:'getTime'}` |
| **Vimeo** | ✅ | ✅ | ✅ | postMessage `{method:'setCurrentTime'}` |
| **VK** | ✅ | ✅ | ✅ | postMessage `{method:'seek'}` |
| **HTML5 `<video>`** | ✅ | ✅ | ✅ | API nativa |

---

## ⏱️ Resolución de Duración (para formatos relativos)

Los formatos `-N`, `[MM:SS-]` necesitan conocer la duración total del video. El sistema sigue esta secuencia:

```
1. postMessage API → solicita getDuration al player
       ↓ (si responde)
2. knownDurations cache → resuelve timing exacto
       ↓ (si no responde en 5s)
3. Fallback → usa d= como estimación (con flag fallback=true)
```

**Ejemplo de resolución:**
```
URL: ...#ed=-90&d=90
Duración detectada: 1440s (24:00)

→ ED resuelto: start = 1440 - 90 = 1350s
                end   = 1440s
                rango = [22:30 - 24:00]
```

---

## 📝 Ejemplos Prácticos

### Anime estándar (OP + ED):
```
#op=[01:31]&ed=-90&d=90
```
- OP: 01:31 a 03:01 (90s exactos)
- ED: últimos 90s del video (auto-detectado)

### Auto-skip sin botones:
```
#!op=[01:31]&!ed=-90
```
- Salta OP y ED automáticamente

### Solo opening, sin ending:
```
#op=[01:31]
```

### Trailer/Preview (primeros 30s):
```
#loop=+30
```
- Reproduce los primeros 30s en bucle

### Tutorial con capítulos:
```
#ch=Introducción(00:00),Configuración(05:30),Demo(12:00)
```

### Video completo dividido:
```
#op=[-01:30]&ed=[22:00-]&ch=Tema1(00:00),Tema2(05:00)
```
- OP: inicio → 01:30
- ED: 22:00 → final
- Capítulos definidos

---

## 🚀 Uso desde ViolentMonkey

El archivo `violentmonkey-dlc-loader.user.js` permite inyectar los módulos DLC en cualquier sitio con iframes de video, sin necesidad de modificar el HTML:

```javascript
// @match        *://*.github.io/*
// @match        *://*.ok.ru/*
// Carga automáticamente core-engine.js + skip-buttons.js
```

---

## 🏗️ Arquitectura

```
┌────────────────────────────────────────────────────────────┐
│                    script.js (∞Iframes)                     │
│  matrixItemRendered → dispara evento por cada iframe        │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                  core-engine.js (DLC Core)                  │
│                                                            │
│  1. Extrae hash de la URL (#op=...&ed=...&d=...)          │
│  2. parseConfig() → parseTimeStr() (8 formatos)           │
│  3. setupTimeTracker() → polling cada 500ms               │
│  4. resolveRelativeTimings() → resuelve -N con duración   │
│  5. Emite eventos:                                         │
│     - dlc:videoConfigured (config lista)                   │
│     - dlc:timeUpdate (cada 500ms con currentTime)         │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                skip-buttons.js (DLC Module)                 │
│                                                            │
│  1. Escucha dlc:videoConfigured → crea botones             │
│  2. Escucha dlc:timeUpdate → muestra/oculta según rango    │
│  3. Click → dlcCoreEngine.seekVideo(element, end)          │
│  4. Auto-ocultamiento tras 5s + chevron invocador          │
└────────────────────────────────────────────────────────────┘