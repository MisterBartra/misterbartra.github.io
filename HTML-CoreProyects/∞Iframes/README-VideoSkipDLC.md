# 🎬 Video Skip Buttons DLC

Un DLC (Descargable de Contenido) independiente para el sistema ∞Iframes Matrix Viewer que agrega botones de salto de tiempo a videos embedidos.

## 🚀 Características Principales

- ✅ **Detección automática** de videos con parámetros especiales
- 🎯 **Botones flotantes** para saltar a puntos específicos del video
- 🎨 **Diseño moderno** con animaciones suaves y transiciones
- 🔧 **Soporte múltiple** para YouTube, videos HTML5 y otros servicios
- 📱 **Totalmente responsivo** y adaptativo
- 🔄 **Integración perfecta** con ∞Iframes Matrix Viewer
- 🎮 **Control programático** vía API pública

## 📖 ¿Cómo funciona?

El sistema detecta videos que contienen parámetros especiales en su URL y automáticamente agrega botones de salto:

```
?d=90&op=00:00&ed=03:20
```

### Parámetros Disponibles

| Parámetro | Descripción | Formato | Default | Requerido |
|-----------|-------------|---------|---------|-----------|
| `d` | Duración para rangos implícitos | Segundos (número) | 90s | No |
| `op` | Tiempo para Opening | MM:SS, [MM:SS], [MM:SS-MM:SS] o MM:SS+90s | - | No |
| `ed` | Tiempo para Ending | MM:SS, [MM:SS], [MM:SS-MM:SS] o MM:SS+90s | - | No |

**Nota:** Todos los parámetros son opcionales. El sistema funcionará con cualquier combinación de ellos.

### 🎯 Lógica de Corchetes

El sistema utiliza una regla simple para determinar el comportamiento:

- **Si el dato está entre corchetes `[...]`** → Usa `duration` (rango implícito)
- **Si el dato no está entre corchetes** → Es punto fijo

### 📋 Formatos de Tiempo Soportados

#### **Con Corchetes (usan duration flexible):**
- **`[01:30]`** → Rango implícito `[01:30-01:30+duration]`
- **`[01:30-02:00]`** → Rango exacto
- **`00:00+90s`** → Rango con duración explícita

#### **Sin Corchetes (puntos fijos):**
- **`op=01:30`** → Punto fijo (salta directamente a 01:30)
- **`ed=22:00`** → Punto fijo (salta directamente a 22:00)
- **`01:30`** → Punto fijo de tiempo absoluto

## 🎯 Ejemplos de Uso

### YouTube con Opening y Ending
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?d=120&op=00:30&ed=02:45"></iframe>
```

### Video HTML5 nativo
```html
<video data-video-params="d=60&op=00:10&ed=00:40" controls>
    <source src="video.mp4" type="video/mp4">
</video>
```

### Solo Opening
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?op=01:30"></iframe>
```

### Solo Ending con duración personalizada
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?d=180&ed=02:20"></iframe>
```

### Solo duración (sin botones de salto)
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?d=120"></iframe>
```
```
**Nota:** Cuando solo se especifica `d`, el sistema mostrará información del video pero no creará botones.
```

### Ejemplos de combinaciones válidas

```html
<!-- Solo OP -->
<iframe src="https://www.youtube.com/embed/video_id?op=00:30"></iframe>

<!-- Solo ED -->
<iframe src="https://www.youtube.com/embed/video_id?ed=02:45"></iframe>

<!-- OP y ED (sin duración explícita) -->
<iframe src="https://www.youtube.com/embed/video_id?op=00:30&ed=02:45"></iframe>

<!-- Duración + OP -->
<iframe src="https://www.youtube.com/embed/video_id?d=90&op=00:30"></iframe>

<!-- Duración + ED -->
<iframe src="https://www.youtube.com/embed/video_id?d=120&ed=02:45"></iframe>

<!-- Todos los parámetros -->
<iframe src="https://www.youtube.com/embed/video_id?d=180&op=00:30&ed=02:45"></iframe>
```

### Ejemplos con Corchetes

```html
<!-- Rango implícito con duración personalizada -->
<iframe src="https://www.youtube.com/embed/video_id?d=120&op=[01:30]"></iframe>

<!-- Rango exacto -->
<iframe src="https://www.youtube.com/embed/video_id?ed=[22:00-23:30]"></iframe>

<!-- Duración explícita -->
<iframe src="https://www.youtube.com/embed/video_id?op=00:30+90s"></iframe>
```

## 🛠️ Instalación

### 1. Copiar el archivo
Copia `src/video-skip-buttons.js` a tu proyecto.

### 2. Incluir el script
```html
<!-- En tu HTML principal -->
<script src="./src/video-skip-buttons.js"></script>
```

### 3. Configurar videos
Agrega los parámetros a las URLs de tus videos como se mostró anteriormente.

## 🎮 Uso Programático

El DLC expone una API pública para control avanzado:

### Agregar un video manualmente
```javascript
// Obtener o crear el elemento de video
const videoElement = document.querySelector('video');

// Agregar el video al sistema con parámetros
window.videoSkipButtons.addVideo(videoElement, 'd=120&op=00:30&ed=02:00');
```

### Actualizar configuración de un video existente
```javascript
// Actualizar los tiempos de un video específico
window.videoSkipButtons.updateVideoConfig('video-id', {
    op: 60,    // 1 minuto
    ed: 180    // 3 minutos
});
```

### Obtener información de videos
```javascript
// Acceder a la información interna (solo lectura)
const videos = window.videoSkipButtons.videos;
const buttons = window.videoSkipButtons.buttons;
```

### Destruir el DLC
```javascript
// Limpiar todos los recursos y eventos
window.videoSkipButtons.destroy();
```

## 🎨 Personalización

### Modificar estilos
Los estilos se pueden personalizar sobrescribiendo las clases CSS:

```css
.video-skip-button {
    /* Personalizar botones */
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.video-skip-button.op-skip {
    /* Estilo específico para botón OP */
    background: linear-gradient(135deg, #4834d4, #686de0);
}

.video-skip-button.ed-skip {
    /* Estilo específico para botón ED */
    background: linear-gradient(135deg, #6ab04c, #badc58);
}
```

### Cambiar duración por defecto
```javascript
// Antes de inicializar el DLC
window.VIDEO_SKIP_DEFAULT_DURATION = 120; // 2 minutos
```

## 🔧 Integración con ∞Iframes Matrix Viewer

El DLC se integra automáticamente con el sistema principal:

### Matriz de ejemplo
```javascript
window.urlRowsIframe = [
    [
        "https://www.youtube.com/embed/dQw4w9WgXcQ?d=90&op=00:00&ed=03:20",
        "https://example.com"
    ],
    [
        ["https://www.youtube.com/embed/dQw4w9WgXcQ?d=120&op=00:30&ed=02:45"],
        ["https://www.youtube.com/embed/dQw4w9WgXcQ?op=01:00"]
    ]
];
```

### Carga automática
El DLC se inicializa automáticamente cuando se carga en una página con ∞Iframes Matrix Viewer.

## 🎯 Formatos de Tiempo Soportados

### Formato MM:SS
```
op=00:30    → 30 segundos
op=02:45    → 2 minutos y 45 segundos
ed=05:20    → 5 minutos y 20 segundos
```

### Formato de segundos
```
op=90       → 90 segundos (1 minuto 30 segundos)
ed=180      → 180 segundos (3 minutos)
```

### Relativo a duración
```
d=90&op=90op=00:30  → 90 segundos + 30 segundos = 120 segundos
d=120&ed=120ed=00:45 → 120 segundos + 45 segundos = 165 segundos
```

## 🌐 Servicios Soportados

### ✅ Compatibilidad total
- **YouTube** (iframe embed)
- **Videos HTML5** (tag `<video>`)
- **Vimeo** (via iframe)
- **Cualquier servicio con iframe**

### 🔄 Compatibilidad parcial
- **Dailymotion** (puede requerir configuración adicional)
- **Twitch** (limitado por políticas del servicio)
- **Facebook Video** (requiere configuración especial)

## 🐛 Solución de Problemas

### Los botones no aparecen
1. Verifica que los parámetros estén correctos
2. Asegúrate que el video tenga los parámetros en la URL
3. Revisa la consola para errores de JavaScript

### El salto no funciona en YouTube
1. Asegúrate que el iframe tenga `allowfullscreen`
2. Verifica que no haya restricciones de CORS
3. Intenta recargar la página

### Los botones aparecen pero no funcionan
1. Verifica la conexión a Internet
2. Asegúrate que el video sea accesible
3. Revisa los permisos del navegador

## 📱 Compatibilidad de Navegadores

| Navegador | Versión mínima | Soporte |
|------------|----------------|---------|
| Chrome | 60+ | ✅ Completo |
| Firefox | 55+ | ✅ Completo |
| Safari | 12+ | ✅ Completo |
| Edge | 79+ | ✅ Completo |
| Opera | 47+ | ✅ Completo |

## 🔒 Seguridad

- El DLC solo interactúa con videos que explícitamente tienen los parámetros configurados
- Usa `postMessage` seguro para comunicación entre iframes
- No realiza llamadas de red externas
- Funciona completamente en el cliente

## 📝 API Reference

### Clase: VideoSkipButtons

#### Constructor
```javascript
new VideoSkipButtons()
```

#### Métodos Públicos
- `addVideo(element, params)` - Agrega un video al sistema
- `updateVideoConfig(videoId, config)` - Actualiza configuración
- `destroy()` - Limpia todos los recursos

#### Propiedades Públicas (solo lectura)
- `videos` - Map de videos registrados
- `buttons` - Map de botones creados
- `observers` - Map de observadores activos

## 🤝 Contribuciones

¡Contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una feature branch
3. Haz tus cambios
4. Envía un pull request

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

## 🔗 Enlaces Relacionados

- [∞Iframes Matrix Viewer](./IframeMatrix.html) - Sistema principal
- [Demo Interactiva](./video-demo.html) - Prueba el DLC en acción
- [Documentación Técnica](./src/script.js) - Código fuente comentado

---

**Creado con ❤️ para mejorar la experiencia de navegación de videos**