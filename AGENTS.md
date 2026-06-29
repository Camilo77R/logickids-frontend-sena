# LOGICKIDS — MANIFIESTO DE DISEÑO
## Guía Autoritativa para Agentes de IA y Desarrolladores

> **Versión:** 1.0 · **Fase actual:** Morado (`#8E35D5`) · **Fase futura (v2):** Azul (`#0093FF`)
>
> Este documento es la **única fuente de verdad** para toda decisión de diseño en LogicKids.
> Un agente de IA que trabaje en este proyecto DEBE seguir estas reglas sin excepciones.

---

## 0. CONTEXTO DEL PROYECTO

LogicKids es una plataforma educativa donde **tutores** (docentes) monitorean el desempeño de niños en minijuegos de lógica. La interfaz de tutor debe comunicar:
- **Confianza profesional** — el tutor es un educador, no un niño. La UI debe sentirse seria y limpia.
- **Calidez pedagógica** — el contexto es educativo e infantil, pero visto desde el adulto que lo gestiona.
- **Claridad de datos** — métricas, gráficas, logros deben leerse de un vistazo.

**Stack:** React + Vite · Bootstrap 5 (como base, no como diseño) · CSS Modules + archivos `.css` por módulo · Fuentes: `Fredoka` (display/títulos) + `Plus Jakarta Sans` (cuerpo)

---

## 1. AUDITORÍA: PROBLEMAS CRÍTICOS ENCONTRADOS

Antes de las reglas, estos son los errores reales que vive el código actual. Todo agente debe saber **qué está roto** para no reproducirlo.

### 1.1 Colores hardcodeados (27+ instancias) — CRÍTICO

El código usa el color de marca directamente en vez de tokens:

```css
/* ❌ MAL — hardcoded en shared-layout.css, portal-shell.css, tutor-groups.css… */
background: #8E35D5;
--tutor-sidebar-purple: #8E35D5;
--tg-p: #8E35D5;
--p: #8E35D5;

/* ✅ BIEN — usa siempre el token */
background: var(--lk-brand);
```

### 1.2 Sidebar admin usa color incorrecto — CRÍTICO

`portal-shell.css` define el sidebar del admin/superadmin con `background: #bc59b1` (rosa-violeta), que es un color diferente a la marca `#8E35D5`. Esto rompe la consistencia entre roles.

```css
/* ❌ MAL — color fantasma que no viene de los tokens */
.lk-portal-sidebar { background: #bc59b1; }

/* ✅ BIEN */
.lk-portal-sidebar { background: var(--lk-brand); }
```

### 1.3 Auth usa otra variante del morado — CRÍTICO

`auth.css` define `--auth-purple: #9b4d96`, que tampoco es `#8E35D5`. Hay tres tonos distintos de "el morado" en producción.

### 1.4 Variables de `:root` cortas contaminan el DOM — ALTO

`tutor-ov.css` define variables globales de nombre corto en `:root`:
```css
/* ❌ MAL — contamina el scope global, puede colisionar */
:root { --p: #8E35D5; --pd: #2B173D; --y: #F9A825; }
```
Esto no debe existir. Las variables globales son **exclusivamente** las `--lk-*` de `tokens.css`.

### 1.5 Font-weight 900 masivo — ALTO

Se encontraron **97 instancias** de `font-weight: 900` o `font-weight: 800` en los estilos. Esto crea el aspecto "pesado y genérico" que critican los profesores. El peso 900 debe ser una rareza, no el estándar.

### 1.6 Border-radius sin sistema — ALTO

Valores encontrados en producción: `2.4rem`, `1.8rem`, `1.6rem`, `1.4rem`, `1.35rem`, `1.3rem`, `1.25rem`, `1rem`, `22px`, `18px`, `14px`, `10px`, `8px`, `6px`. Ninguno sigue el sistema de tokens definido en `tokens.css`.

### 1.7 Estilos de botones dispersos — MEDIO

Clases como `.lk-btn-warning` y `.lk-btn-light` están definidas dentro de `tutorEstudiantes.css` en lugar de un archivo de componentes global.

---

## 2. TOKENS — EL ÚNICO ARCHIVO QUE DEFINE COLORES

**Archivo:** `src/styles/tokens.css`

Todo el código CSS debe consumir SOLO estas variables. **Está prohibido** usar valores hexadecimales de colores de marca en cualquier otro archivo.

### 2.1 Paleta Fase Actual (Morado)

```css
/* ─── BRAND (el único color que puede cambiar entre fases) ─── */
--lk-brand:          #8E35D5;   /* Color principal de marca */
--lk-brand-dark:     #2B173D;   /* Oscuro para textos sobre superficies */
--lk-brand-soft:     #F3E8FA;   /* Fondo suave / estados activos */
--lk-brand-glow:     rgba(142, 53, 213, 0.18);
--lk-brand-border:   rgba(142, 53, 213, 0.14);
--lk-brand-border-strong: rgba(142, 53, 213, 0.30);
--lk-brand-shadow:   rgba(142, 53, 213, 0.12);

/* ─── ACENTO (el amarillo nunca cambia) ─── */
--lk-accent:         #F9A825;   /* Amarillo principal */
--lk-accent-bright:  #FFCA28;   /* Amarillo vivo */
--lk-accent-dark:    #E8920A;   /* Amarillo oscuro / hover */
--lk-accent-soft:    rgba(249, 168, 37, 0.15);

/* ─── SEMÁNTICOS (no cambian entre fases) ─── */
--lk-success:        #16A34A;
--lk-success-soft:   rgba(22, 163, 74, 0.12);
--lk-danger:         #DC2626;
--lk-danger-soft:    rgba(220, 38, 38, 0.10);
--lk-warning:        #D97706;
--lk-warning-soft:   rgba(217, 119, 6, 0.12);
--lk-info:           #0EA5E9;
--lk-info-soft:      rgba(14, 165, 233, 0.12);
--lk-orange:         #FF7F00;
--lk-orange-soft:    rgba(255, 127, 0, 0.14);
--lk-green:          #39D353;
--lk-green-soft:     rgba(57, 211, 83, 0.14);
```

### 2.2 Paleta Fase Futura (Azul) — CÓMO MIGRAR

Cuando se decida cambiar de morado a azul, **SOLO se cambian estas líneas en `tokens.css`**. El resto del código no toca nada:

```css
/* v2 — SOLO cambiar estas 5 líneas en tokens.css */
--lk-brand:          #0093FF;
--lk-brand-dark:     #003D6B;
--lk-brand-soft:     #E6F4FF;
--lk-brand-glow:     rgba(0, 147, 255, 0.18);
--lk-brand-border:   rgba(0, 147, 255, 0.14);
--lk-brand-border-strong: rgba(0, 147, 255, 0.30);
--lk-brand-shadow:   rgba(0, 147, 255, 0.12);
/* --lk-accent, --lk-accent-bright, etc. NO CAMBIAN */
```

### 2.3 Superficies y Texto

```css
/* ─── SUPERFICIES ─── */
--lk-bg:             #F7F4FB;   /* Fondo de página (lavanda muy claro) */
--lk-surface:        #FFFFFF;   /* Cards, paneles, modales */
--lk-surface-soft:   #F5F3FF;   /* Superficie de acción activa */

/* ─── TEXTO ─── */
--lk-text:           #1E1B2E;   /* Texto principal */
--lk-text-soft:      #4B4B6B;   /* Texto secundario */
--lk-text-muted:     #9CA3AF;   /* Texto terciario / placeholders */

/* ─── BORDES ─── */
--lk-border:         rgba(142, 53, 213, 0.12);
--lk-border-strong:  rgba(142, 53, 213, 0.28);
```

### 2.4 Sombras

```css
--lk-shadow-sm:      0 2px 8px var(--lk-brand-shadow);
--lk-shadow-md:      0 8px 24px var(--lk-brand-shadow);
--lk-shadow-lg:      0 16px 48px var(--lk-brand-shadow);
--lk-shadow-card:    0 4px 16px rgba(0, 0, 0, 0.05);
--lk-shadow-panel:   0 20px 52px rgba(0, 0, 0, 0.08);
```

---

## 3. TIPOGRAFÍA — SISTEMA ESTRICTO

### 3.1 Fuentes

```css
--lk-font:         'Plus Jakarta Sans', system-ui, sans-serif;  /* CUERPO */
--lk-display-font: 'Fredoka', 'Plus Jakarta Sans', sans-serif;  /* TÍTULOS / DISPLAY */
```

- **`Fredoka`**: Solo para títulos de página, nombres de secciones principales, números grandes (KPIs), títulos de modales, branding.
- **`Plus Jakarta Sans`**: Todo el resto — párrafos, botones, labels, badges, navegación, tablas.

### 3.2 Escala de Tamaños

| Uso | Tamaño | Peso | Fuente |
|---|---|---|---|
| Hero / Título de página | `clamp(1.8rem, 4vw, 2.6rem)` | `700` | Fredoka |
| Título de sección | `1.1rem` | `700` | Fredoka |
| Título de card / panel | `1rem` | `600` | Fredoka |
| Texto de cuerpo | `0.92rem` | `400` | Plus Jakarta Sans |
| Labels / Subtexto | `0.83rem` | `500` | Plus Jakarta Sans |
| Eyebrow / badge | `0.72rem` | `700` | Plus Jakarta Sans |
| Texto mínimo (chips, meta) | `0.68rem` | `600` | Plus Jakarta Sans |

### 3.3 Reglas de Font-Weight — LO MÁS IMPORTANTE

**El weight 900 está PROHIBIDO** excepto en números KPI grandes (ej: "34 alumnos").

```css
/* ❌ PROHIBIDO — el mayor culpable del aspecto "pesado" */
font-weight: 900;

/* ✅ Pesos permitidos */
font-weight: 400; /* cuerpo de texto */
font-weight: 500; /* énfasis suave, labels */
font-weight: 600; /* títulos de card, botones */
font-weight: 700; /* títulos de sección, eyebrows, fuente display */

/* Solo exception */
font-weight: 800; /* Solo para valores numéricos de KPI (ej: "128") */
```

---

## 4. ESPACIADO — SISTEMA DE 8PT

**Regla absoluta:** Todos los valores de `padding`, `margin`, `gap` deben ser múltiplos de `8px` o sus equivalentes en `rem` (0.5rem = 8px, 1rem = 16px, etc.).

| Token | Valor px | Valor rem | Uso típico |
|---|---|---|---|
| `--lk-space-1` | 8px | 0.5rem | Gap mínimo entre elementos inline |
| `--lk-space-2` | 16px | 1rem | Padding interno de componentes pequeños |
| `--lk-space-3` | 24px | 1.5rem | Padding de cards, gap entre secciones |
| `--lk-space-4` | 32px | 2rem | Padding de paneles grandes |
| `--lk-space-5` | 40px | 2.5rem | Separación entre bloques |
| `--lk-space-6` | 48px | 3rem | Márgenes de página |

```css
/* ❌ MAL */
padding: 10px 14px;
gap: 6px;

/* ✅ BIEN */
padding: 8px 16px;
gap: 8px;
```

---

## 5. BORDER-RADIUS — SISTEMA UNIFICADO

Solo se permiten estos valores, nombrados en `tokens.css`:

```css
--lk-radius-pill:  999px;    /* Solo para chips, badges, toggles, inputs de búsqueda */
--lk-radius-icon:  0.75rem;  /* 12px — íconos en caja, avatar pequeño */
--lk-radius-sm:    1rem;     /* 16px — botones, inputs de formulario */
--lk-radius-md:    1.25rem;  /* 20px — cards menores, dropdowns */
--lk-radius-lg:    1.5rem;   /* 24px — cards principales, modales */
--lk-radius-xl:    2rem;     /* 32px — panels de hero, contenedores mayores */
--lk-radius-2xl:   2.4rem;   /* 38px — sidebar, elementos tipo "isla" flotante */
```

**Mapa de uso:**

| Componente | Radio |
|---|---|
| Sidebar | `--lk-radius-2xl` |
| Panel hero / banner principal | `--lk-radius-xl` |
| Card principal (grupos, alumnos) | `--lk-radius-lg` |
| Card secundaria (panel de datos) | `--lk-radius-md` |
| Botón primario / secundario | `--lk-radius-sm` |
| Input de formulario | `--lk-radius-sm` |
| Select | `--lk-radius-sm` |
| Modal | `--lk-radius-lg` |
| Badge / Chip | `--lk-radius-pill` |
| Ícono en caja | `--lk-radius-icon` |

```css
/* ❌ MAL — valores inventados */
border-radius: 18px;
border-radius: 22px;
border-radius: 14px;

/* ✅ BIEN — siempre desde tokens */
border-radius: var(--lk-radius-lg);
```

---

## 6. COMPONENTES — PATRONES DE REFERENCIA

### 6.1 Botones

```css
/* Botón Primario — acción principal de la página */
.btn-lk-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--lk-radius-sm);
  background: var(--lk-brand);
  color: #ffffff;
  font-family: var(--lk-font);
  font-size: 0.88rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.btn-lk-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
.btn-lk-primary:active { transform: none; filter: brightness(0.95); }

/* Botón Secundario — acción de apoyo */
.btn-lk-secondary {
  padding: 0.6rem 1.25rem;
  border-radius: var(--lk-radius-sm);
  background: var(--lk-brand-soft);
  color: var(--lk-brand-dark);
  font-size: 0.88rem;
  font-weight: 600;
  border: 1px solid var(--lk-brand-border);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.btn-lk-secondary:hover { filter: brightness(0.96); }

/* Botón Acento (amarillo) — CTA especial */
.btn-lk-accent {
  padding: 0.6rem 1.25rem;
  border-radius: var(--lk-radius-sm);
  background: var(--lk-accent);
  color: var(--lk-brand-dark);
  font-size: 0.88rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.btn-lk-accent:hover { filter: brightness(1.06); transform: translateY(-1px); }

/* Botón Ghost — acciones secundarias sutiles */
.btn-lk-ghost {
  padding: 0.6rem 1.25rem;
  border-radius: var(--lk-radius-sm);
  background: transparent;
  color: var(--lk-text-soft);
  font-size: 0.88rem;
  font-weight: 600;
  border: 1px solid var(--lk-border);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-lk-ghost:hover { border-color: var(--lk-brand-border-strong); background: var(--lk-brand-soft); }
```

### 6.2 Cards

```css
/* Card estándar */
.lk-card {
  background: var(--lk-surface);
  border: 1.5px solid var(--lk-border);
  border-radius: var(--lk-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--lk-shadow-card);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.lk-card:hover {
  border-color: var(--lk-brand-border-strong);
  box-shadow: var(--lk-shadow-md);
}

/* Card con acento de color (borde izquierdo) */
.lk-card--accented {
  border-left: 3px solid var(--lk-brand);
}
```

### 6.3 Inputs y Selects — EL PROBLEMA MÁS VISIBLE

Los selects sin estilo son una de las principales críticas. Este es el patrón obligatorio:

```css
/* Input base */
.lk-input {
  width: 100%;
  min-height: 44px;
  padding: 0 1rem;
  border: 1.5px solid var(--lk-border);
  border-radius: var(--lk-radius-sm);
  background: var(--lk-surface);
  color: var(--lk-text);
  font-family: var(--lk-font);
  font-size: 0.88rem;
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.lk-input:focus {
  border-color: var(--lk-brand);
  box-shadow: 0 0 0 4px var(--lk-brand-glow);
}
.lk-input::placeholder { color: var(--lk-text-muted); font-weight: 400; }

/* Select — la clave es el fondo y el ícono custom */
.lk-select {
  width: 100%;
  min-height: 44px;
  padding: 0 2.5rem 0 1rem;
  border: 1.5px solid var(--lk-border);
  border-radius: var(--lk-radius-sm);
  background: var(--lk-surface)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")
    no-repeat right 0.75rem center / 16px;
  appearance: none;
  color: var(--lk-text);
  font-family: var(--lk-font);
  font-size: 0.88rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.lk-select:focus {
  border-color: var(--lk-brand);
  box-shadow: 0 0 0 4px var(--lk-brand-glow);
}
```

### 6.4 Modales — Patrón Consistente

```css
/* Overlay */
.lk-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 27, 46, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Contenedor del modal */
.lk-modal {
  width: min(560px, 100%);
  background: var(--lk-surface);
  border-radius: var(--lk-radius-lg);
  border: 1.5px solid var(--lk-border);
  box-shadow: var(--lk-shadow-panel);
  overflow: hidden;
}

/* Header del modal */
.lk-modal__header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--lk-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Body y footer */
.lk-modal__body { padding: 1.5rem; }
.lk-modal__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--lk-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
```

### 6.5 Badges y Chips

```css
/* Chip base */
.lk-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.72rem;
  border-radius: var(--lk-radius-pill);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Variantes semánticas */
.lk-chip--brand    { background: var(--lk-brand-soft); color: var(--lk-brand-dark); }
.lk-chip--success  { background: var(--lk-success-soft); color: #15803D; }
.lk-chip--warning  { background: var(--lk-warning-soft); color: #92400E; }
.lk-chip--danger   { background: var(--lk-danger-soft); color: #991B1B; }
.lk-chip--accent   { background: var(--lk-accent-soft); color: #78350F; }
```

### 6.6 Eyebrow (Subtítulo de sección)

```css
/* El eyebrow es esa etiqueta pequeña en mayúsculas que aparece sobre un título */
.lk-eyebrow {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lk-brand);
  margin-bottom: 0.35rem;
}
```

---

## 7. LAYOUT — REGLAS DE ESTRUCTURA

### 7.1 Shell de Tutor

```css
/* La estructura raíz: sidebar flotante + contenido */
.lk-tutor-shell {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  height: 100vh;
  background: var(--lk-bg);
}

.lk-tutor-sidebar {
  width: 92px;
  flex-shrink: 0;
  background: var(--lk-brand); /* SIEMPRE var(--lk-brand), nunca hardcoded */
  border-radius: var(--lk-radius-2xl);
  box-shadow: var(--lk-shadow-lg);
}

.lk-tutor-content {
  flex: 1;
  overflow-y: auto;
  border-radius: var(--lk-radius-xl);
}
```

### 7.2 Sidebar Admin y Superadmin

El sidebar de admin/superadmin **debe usar el mismo color que el de tutor**. El fondo es `var(--lk-brand)`, no ningún otro valor. Esto garantiza que los tres roles se vean como parte del mismo sistema.

```css
/* ✅ CORRECTO — aplica para .lk-tutor-sidebar, .lk-portal-sidebar, .lk-admin-sidebar */
background: var(--lk-brand);
```

### 7.3 Hero / Banner de Página

Regla para cuando usar amarillo o morado como fondo del hero:

| Situación | Color de Hero |
|---|---|
| Dashboard principal, bienvenida, overview | Amarillo (`var(--lk-accent)`) — cálido, acogedor |
| Acciones críticas (sesiones activas, alertas) | Morado (`var(--lk-brand)`) — focalizado |
| Páginas de datos (estadísticas, logros, recomendaciones) | Morado (`var(--lk-brand)`) — profesional |
| Páginas de gestión (grupos, alumnos) | Blanco / superficie — neutro, funcional |

**Nunca** usar gradientes radiales en heroes. Solo fondos sólidos de color plano.

```css
/* Hero amarillo */
.lk-page-hero--accent {
  background: var(--lk-accent);
  border-radius: var(--lk-radius-xl);
  padding: 1.75rem 2rem;
}

/* Hero morado */
.lk-page-hero--brand {
  background: var(--lk-brand);
  border-radius: var(--lk-radius-xl);
  padding: 1.75rem 2rem;
}
```

---

## 8. REGLAS DE CONSISTENCIA CROSS-ROLE

Tutor, Admin y Superadmin son roles distintos pero **deben verse como el mismo sistema**. Las diferencias son de contenido, no de lenguaje visual.

### Lo que SIEMPRE es igual entre roles

- Color del sidebar: `var(--lk-brand)`
- Tipografías: Fredoka + Plus Jakarta Sans
- Escala de tamaños de texto (ver §3.2)
- Sistema de radios (ver §5)
- Paleta de colores (ver §2)
- Sombras y borders
- Patrón de cards, inputs, modales, chips

### Lo que PUEDE ser diferente entre roles

- Contenido y estructura de páginas internas
- Iconos específicos del rol en la navegación
- Colores de hero según el contexto (§7.3)
- Métricas y datos mostrados

---

## 9. MICROINTERACCIONES — PULIDO DE CALIDAD

Estas reglas son las que diferencian un diseño genérico de uno profesional:

### 9.1 Hover en Cards

```css
/* Todas las cards clickables deben tener esta transición */
.lk-card-interactive {
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  cursor: pointer;
}
.lk-card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--lk-shadow-md);
  border-color: var(--lk-brand-border-strong);
}
```

### 9.2 Estados de Focus Visibles

```css
/* Aplica a inputs, selects, botones y cualquier elemento focusable */
:focus-visible {
  outline: 2px solid var(--lk-brand);
  outline-offset: 2px;
}
```

### 9.3 Spinner Consistente

```css
.lk-spinner {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid var(--lk-brand-soft);
  border-top-color: var(--lk-brand);
  animation: lk-spin 0.85s linear infinite;
}
@keyframes lk-spin { to { transform: rotate(360deg); } }
```

---

## 10. LO QUE UN AGENTE DE IA NUNCA DEBE HACER

Lista de prohibiciones absolutas al generar CSS o JSX para LogicKids:

1. **No usar `font-weight: 900`** excepto en valores numéricos KPI grandes.
2. **No hardcodear colores de marca** como `#8E35D5`, `#2B173D`, `#F9A825`, `#9b4d96`, `#bc59b1` — siempre usar `var(--lk-*)`.
3. **No definir variables en `:root`** fuera de `tokens.css` — usar scope de componente si es local.
4. **No inventar valores de `border-radius`** — solo los 8 valores de §5.
5. **No crear estilos de botones dentro de archivos de página** — los botones van en un archivo de componentes global.
6. **No usar fuentes diferentes a Fredoka y Plus Jakarta Sans**.
7. **No usar gradientes en fondos de cards o paneles** — fondos siempre sólidos.
8. **No mezclar `px` y `rem` sin razón** — preferir `rem` para consistencia.
9. **No dejar selects y inputs sin estilar** — siempre aplicar el patrón de §6.3.
10. **No usar colores distintos para el sidebar de cada rol** — todos son `var(--lk-brand)`.

---

## 11. PLAN DE MIGRACIÓN: MORADO → AZUL (v2)

Cuando el equipo decida activar la fase azul:

### Paso 1: Actualizar tokens (5 minutos)
Cambiar en `tokens.css` los valores de §2.2. **Solo esas líneas.**

### Paso 2: Verificar sidebar
Confirmar que `.lk-tutor-sidebar`, `.lk-portal-sidebar` y `.lk-admin-sidebar` usan `var(--lk-brand)`. Si lo hacen, el cambio es automático.

### Paso 3: Revisar auth.css
`auth.css` usa `--auth-purple: #9b4d96` — esta variable debe reemplazarse por `var(--lk-brand)` para que también migre.

### Paso 4: Buscar y eliminar colores hardcodeados residuales
```bash
grep -r "#8E35D5\|#8e35d5\|#9b4d96\|#bc59b1" src/styles/
```
Cualquier resultado es un error que debe corregirse.

### Checklist de migración
- [ ] `tokens.css` actualizado con azul `#0093FF`
- [ ] Sidebar tutor usa `var(--lk-brand)`
- [ ] Sidebar admin/superadmin usa `var(--lk-brand)`
- [ ] `auth.css` usa `var(--lk-brand)` en vez de `#9b4d96`
- [ ] No quedan colores hardcodeados en búsqueda grep
- [ ] Bootstrap override `--bs-primary` sigue siendo `var(--lk-brand)`
- [ ] Sombras con `--lk-brand-shadow` actualizadas automáticamente

---

## 12. CÓMO USAR ESTE DOCUMENTO (PARA AGENTES DE IA)

Cuando recibas una tarea de desarrollo en LogicKids:

1. **Identifica qué componente vas a crear/modificar**.
2. **Consulta §6** — ¿existe ya el patrón? Úsalo exactamente.
3. **Para cualquier color**, busca el token correspondiente en §2.
4. **Para cualquier radio**, busca el valor en §5.
5. **Para fuentes y pesos**, sigue §3 estrictamente.
6. **Verifica contra §10** (prohibiciones) antes de entregar.

Si no encuentras el patrón en este documento para algo específico, la regla es:
- Usa la misma lógica visual que el componente más parecido.
- Usa siempre `var(--lk-*)` para colores.
- Respeta la escala 8pt para espaciado.
- Mantén el border-radius dentro de los 8 valores permitidos.

---

*Fin del Manifiesto v1.0 — LogicKids Design System*
*Próxima revisión al activar fase v2 (color azul)*