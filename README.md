# Graphd

Graficador 3D interactivo y altamente customizable para **Cálculo III / IV**.
100% en el navegador — sin backend, sin cuentas.

## Características

- **Tipos de objetos**: superficies `z = f(x,y)` (cartesianas o polares), curvas
  paramétricas `r(t)`, superficies paramétricas `r(u,v)`, campos vectoriales
  `F(x,y,z)`, campos gradiente `∇f`, contornos / curvas de nivel, y conjuntos de
  nivel `f(x,y,z) = c` (marching cubes).
- **Entrada matemática cómoda**: editor [MathLive](https://mathlive.io) con
  teclado en pantalla y navegación natural por fracciones y la expresión.
- **Estética como pilar**: 5 temas (oscuro, claro, blueprint, impresión, neón),
  color por función, colormaps (viridis/plasma/turbo/…), opacidad, malla,
  rugosidad/metalicidad, iluminación, ejes/grilla/etiquetas configurables.
- **Zoom extremo**: planos near/far dinámicos + `logarithmicDepthBuffer` +
  grilla y etiquetas que se reescalan por décadas (potencias de 10).
- **Rendimiento**: muestreo en un *pool* de Web Workers (fuera del hilo
  principal), resolución adaptativa (grueso al editar → fino en reposo),
  geometrías reutilizadas, flechas instanciadas, y *device tiering* que limita
  la resolución en equipos modestos.
- **Compartir sin servidor**: el estado completo se comprime (gzip) y se codifica
  en la URL (`#g=…`); autoguardado en `localStorage`.
- **Exportar**: PNG de alta resolución (con fondo transparente opcional),
  animación de rotación en GIF o WebM, y compartir nativo (Web Share API).

## Stack

Vite · React 19 · TypeScript · React Three Fiber (three.js) · Tailwind v4 ·
zustand · MathLive + Compute Engine · fflate · gifenc.

## Arquitectura (resumen)

```
LaTeX  ──MathLive──►  MathJSON  ──transpile──►  string JS  ──new Function──►  evaluador nativo
                                    (src/math)                  (en el worker, src/workers)
```

- `src/math/` — parseo (Compute Engine, solo en el hilo principal) y
  transpilación MathJSON → JS. El worker recibe solo strings (serializables).
- `src/workers/` — pool + worker de muestreo (geometría, marching squares/cubes).
- `src/geometry/` — algoritmos puros (superficies, marching squares, marching cubes).
- `src/scene/` — Canvas R3F, plots por tipo, cámara, ejes/grilla, exportación.
- `src/state/` — store zustand, serialización, URL, persistencia.
- `src/components/` — UI (campo matemático, paneles).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de producción
npm run preview    # servir el build
```

## Notas

- El bundle es grande (~3.3 MB / 927 KB gzip) por Compute Engine + three; se puede
  reducir más adelante con *code-splitting* y carga diferida de CE.
- Convención de ejes: math `(x, y, z)` → three `(x, z, y)` (la altura math-`z`
  apunta hacia arriba).
