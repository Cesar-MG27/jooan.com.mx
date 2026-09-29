# Instrucción de reconstrucción — Animación del Hero ("joan")

> Spec ejecutable para volver a desarrollar la animación del hero desde cero.
> Stack: **Next.js 14 (App Router) + React 18 + TypeScript + @react-three/fiber +
> three.js + @react-three/postprocessing + GSAP/ScrollTrigger + Lenis**.

---

## 1. Concepto

El hero es un **wordmark de partículas GPGPU** que deletrea la palabra `joan`
sobre una atmósfera de catedral con niebla fría azul. La pieza tiene cuatro actos:

1. **Formación** — tras el preloader, una nube de partículas en niebla coalesce
   hasta formar la palabra `joan`.
2. **Reposo vivo** — una vez formada, la palabra respira: turbulencia curl suave,
   un backlight que pulsa, partículas que nacen y mueren manteniendo el texto legible.
3. **Interacción** — el cursor colisiona con las partículas y las empuja hacia el
   espectador (+Z); barridos rápidos o la entrada del puntero disparan un "blast".
4. **Disolución por scroll** — al hacer scroll, la sección queda *pinned*; la cámara
   hace dolly hacia el nombre mientras las partículas se disuelven, el backlight y la
   niebla se apagan y un overlay sella la escena a negro puro antes de la siguiente sección.

Todo debe **revertir** limpiamente al hacer scroll hacia arriba (re-formación en ráfagas).

### Reglas de diseño (no negociables)
- **Sin eventos cruzados / sin handlers en conflicto.** Los disparadores de interacción
  (blast, mouse) van a nivel `window`/sección y nunca deben bloquearse entre sí ni con la
  copy del DOM (`pointer-events: none` en la copy, salvo los botones CTA).
- Un único `scrollY` (progreso 0→1 del pin) maneja **toda** la salida de la escena
  (cámara, disolución, fade de partículas, backlight, niebla, overlay). No introducir
  fuentes de verdad paralelas.
- La copy se queda baja para que la palabra de partículas sea el centro visual.

---

## 2. Árbol de componentes

```
Hero.tsx                      ← orquestador DOM + GSAP (client)
 ├─ HeroScene.tsx (dynamic, ssr:false)   ← <Canvas> R3F + postprocessing
 │   ├─ CameraRig                         ← parallax mouse + dolly por scroll
 │   ├─ FrameloopGate                     ← pausa/reanuda el render loop
 │   ├─ HazePlane (atmosphere/)           ← niebla fbm azul fría (z=-3)
 │   ├─ Backlight (atmosphere/)           ← glow radial que respira (z=-1.2)
 │   ├─ GPGPUWordmark                     ← el centro: partículas GPGPU
 │   └─ EffectComposer                    ← Bloom (+ CA/Vignette/Noise en tier high)
 ├─ .fade                                 ← degradado inferior a --void
 ├─ .overlay                              ← capa negra sellada por el scrub
 └─ .copy                                 ← 2 líneas + CTA (pointer-events:none salvo CTA)
```

Librería de soporte:
```
lib/glyphSampling.ts         ← muestrea "joan" en canvas 2D → nube de targets + texturas de sim
lib/gpgpu/velocityCompute.ts ← shader de integración de velocidad
lib/gpgpu/positionCompute.ts ← shader de integración de posición + ciclo nacimiento/muerte
lib/gpgpu/glslCommon.ts      ← snoise, curlNoise, hash3 compartidos
hooks/useMouse.ts            ← posición/velocidad del puntero en NDC
hooks/useGpuTier.ts          ← "high" | "medium" | "low"
hooks/useReducedMotion.ts    ← respeta prefers-reduced-motion
```

### Tokens (de `globals.css`)
- `--void: #0f0f0f` (fondo/overlay), `--bone: #f2efe9` (texto), `--accent: #165fcd`, `--accent-bright: #afcbf2`.
- Fuentes: `--font-display` = **Cormorant Garamond** (next/font, usada para muestrear el glifo),
  `--font-host` = **Host Grotesk** (UI/CTA).

---

## 3. GPGPUWordmark — la simulación (centro de la pieza)

Usar `GPUComputationRenderer` (`three/examples/jsm/misc/GPUComputationRenderer.js`)
con dos variables ping-pong: **posición** y **velocidad**. Tipo de dato `HalfFloatType`.

### 3.1 Targets desde el glifo (`lib/glyphSampling.ts`)
1. Resolver la **familia de fuente real** detrás de `var(--font-display)` con un `<span>` sonda
   (next/font genera un nombre de familia distinto; si no se resuelve, el glifo sale mal).
   Esperar `document.fonts.load("600 200px <familia>")` + `document.fonts.ready`.
2. Dibujar `joan` en un canvas 2D `2048×1024`, `fillStyle #fff`, `textAlign center`,
   `textBaseline middle`, peso `600`. Ajustar `fontSize` al ~80% del ancho del canvas pero
   acotado al 62% de la altura (para que no se desborde y muestree un bloque sólido).
3. Escanear con `stride = 3`; pixel opaco = `alpha > 130`. Por cada hit, jitter sub-pixel,
   y acumular bbox. Centrar en la **tinta** (centro del bbox), no en el canvas.
4. Escalar a **ancho mundo `4.6`** (`scale = worldWidth / bboxW`). Volcar a posiciones mundo:
   `x = (px-cx)*scale`, `y = -(py-cy)*scale` (flip Y canvas→mundo), `z = (rand-0.5)*0.28`.
5. Diagnóstico: una `joan` sana tiene aspect (w/h) ≈ **3–4.5** y cobertura baja. Aspect ~2 o
   cobertura enorme = el glifo no se dibujó (problema de fuente/desbordamiento) → `onInitFail`.

### 3.2 Texturas de simulación (`buildSimulationTextures`)
Grid `SIZE×SIZE` (un téxel por partícula). `SIZE_BY_TIER = { high: 384, medium: 256 }`.
- **Asignación round-robin sobre orden barajado** de los targets → densidad uniforme, sin banding.
- `target` (RGBA float): rgb = punto destino en la letra, a = 1.
- `birth` (RGBA float): "fantasma" expandido del word (`target*1.12 + offset radial 0.12–0.62`),
  `z = (rand-0.5)*0.8 + 0.15` (sesgo hacia cámara), **a = offset de vida aleatorio** (escalona muertes).
- `position` inicial = `birth`, a = `random()` (desincroniza muertes desde el frame 0).
- `velocity` = 0, **a = seed estable [0,1]** (per-partícula; usada para maxLife y ráfagas de re-formación).
- `reference`: vec2 uv `(i+0.5)/size, (j+0.5)/size` por partícula (atributo de geometría).

### 3.3 Velocity pass (`velocityCompute.ts`)
> `GPUComputationRenderer` auto-declara `texturePosition`, `textureVelocity`, `resolution`. **No redeclarar.**

Lee `posLife`, `velSeed`. Si `life > 1.0001` → **sentinela de respawn**: reseed limpio
`vel = normalize(target - birth) * (0.4 + 0.6*seed)` (mata el bug de partículas que mueren a
mitad de blast y salen disparadas). Si no, suma de fuerzas:

1. **Muelle al target** — `k = uAttractK * mix(0.5,1.0,uFormation) * (1-uDissolve) * burst`,
   `vel += (target-pos) * k * dt`. Donde `burst = mix(1.0, 0.2 + 2.2*seed, uReform)` → al
   re-formar (scroll arriba), cada partícula tira a velocidad distinta (rebuild en ráfagas).
   Forward/reposo `uReform=0` ⇒ tirón uniforme original.
2. **Disolución** — si `uDissolve>0`: `vel += normalize(pos) * uDissolve * dt * 7.0`
   (empuja hacia afuera → la palabra se rompe en niebla en vez de escalar).
3. **Turbulencia curl** — `flow = curlNoise(pos*0.35 + vec3(0,0,seed*31.4 + uTime*0.12))`,
   atenuada cerca del target (`settle = smoothstep(1.2,0.0,len(toTarget))*(1-uDissolve)`),
   `vel += flow * uNoiseAmp * mix(1.0,0.06,settle) * dt`.
4. **Colisión de mouse** — `infl = smoothstep(uMouseRadius,0.0,len(pos-uMouseWorld))`;
   dir = mezcla de radial outward + fuerte `+Z` hacia la cámara;
   `power = infl*(1 + uMouseSpeed*1.4)*(0.5 + 1.0*uBlast)`; `vel += dir*power*dt*8.0`.
5. **Damping** — `vel *= (1 - uDamping*dt)`.
6. **Clamp half-float** — si `len(vel) > uMaxSpeed`, reescalar.

Uniforms iniciales: `uAttractK 11.0`, `uNoiseAmp 0.4`, `uDamping 6.8`, `uMouseRadius 1.4`,
`uMaxSpeed 10.0`, `uMouseWorld (999,999,999)`, resto en 0.

### 3.4 Position pass (`positionCompute.ts`)
- Limpia sentinela (`if life>1.0001 → life=1.0`).
- `pos += vel*dt`, `clamp(pos, -12, 12)` (seguridad de precisión).
- `maxLife = mix(4.0, 10.0, seed)` → muertes repartidas en 4–10 s (solo una fracción mínima
  respawnea a la vez ⇒ `joan` siempre legible). `life -= dt/maxLife`.
- Si `life<=0`: `pos = birth + (hash3(uv+time)-0.5)*0.4`, `life = 1.5` (sentinela para el velocity pass).

### 3.5 Render material (ShaderMaterial GLSL1, additive)
- **Vertex**: lee `pos` y `life` de `uTexturePosition` por `aReference`; `lifeFade =
  smoothstep(0,0.14,lf)*smoothstep(1.0,0.68,lf)`; `jitter` por hash de la referencia;
  `gl_PointSize = clamp(uSizeBase*(1/-mv.z)*lifeFade*jitter, 0, 80)`. **Sin parallax en Z**
  (la salida es por disolución, no por escalado). `uSizeBase = 13.0 * dpr` (dpr≤2).
- **Fragment**: disco suave (`disc = 1 - smoothstep(0.55,1.0,r)`, descarta `<0.01`).
  Color: `mix(uColorCore, uColorRim, r)` luego `mix(...,uColorHot, clamp(vSpeed*0.22,0,0.75))`
  (rápido → azul brillante). `depthFade = smoothstep(uFarZ,uNearZ,vDepth)`.
  `alpha = disc * depthFade * (0.45+0.55*smoothstep(0,0.12,vLife)) * uFade`.
  - `uColorCore (0.88,0.95,1.0)`, `uColorRim (0.3,0.52,0.96)`, `uColorHot (0.5,0.72,1.0)`.
  - `uNearZ 1.0`, `uFarZ -6.0`.
  - Material: `transparent`, `depthTest:false`, `depthWrite:false`, `AdditiveBlending`.
- `<points position={[0, HERO_Y, 0]}>` con `HERO_Y = 0.45`, `frustumCulled={false}`, `renderOrder={2}`.

### 3.6 Bucle por frame (`useFrame`)
- `dt = min(delta, 1/30)` (evita saltos al volver de pestaña en background).
- Raycast del mouse al plano z=0; **restar `HERO_Y`** del hit (la sim corre en espacio local del
  word, los puntos están elevados). Suavizar `speed += (target-speed)*0.25`. Si el puntero no
  está activo, mandar el mouse a `(999,999,999)` y decaer speed.
- **Blast**: decae cada frame `blast *= exp(-6.0*dt)` (~115 ms half-life), a 0 si `<0.001`.
- `uFormation = progress`. `uDissolve = smoothstep(scrollY, 0.0, 0.5)`.
- **Reform gate**: `ds = scrollY - prevScrollY`; objetivo `1` solo si `ds<0 && scrollY<0.5`;
  suavizar `reform += (target-reform)*0.08` → la re-formación trasera nunca afecta la disolución hacia adelante.
- `gpu.compute()`, luego asignar las **texturas nuevas** (¡las identidades cambian cada frame!)
  al render material.
- `uFade = 1 - smoothstep(scrollY, 0.12, 0.7)` (partículas apagadas del todo al ~70%).

---

## 4. Hero.tsx — orquestación DOM + GSAP

Estado: `progress` (0→1, formación), `scrollY` (0→1, pin), `sceneActive` (pausa render),
ref `blast`. Registrar `ScrollTrigger`. `HeroScene` se carga con `next/dynamic({ ssr:false })`.

### 4.1 Timeline de entrada (al montar, dentro de `gsap.context`)
- **Reduced motion**: si `prefers-reduced-motion`, `setProgress(1)` y salir (sin formación ni pin).
- **Formación**: tween de objeto `{p:0→1}`, `duration 2.6`, `ease power2.inOut`, `delay 1.4`
  (espera la salida del preloader), `onUpdate → setProgress`.
- **Copy** (`.hero-line`): `fromTo({yPercent:110, opacity:0} → {yPercent:0, opacity:1})`,
  `duration 1`, `stagger 0.12`, `ease power3.out`, `delay 2.6`.
- **CTA**: `fromTo({opacity:0,y:20} → {opacity:1,y:0})`, `duration 0.8`, `ease power3.out`, `delay 3.2`.

### 4.2 Pin / salida de escena (ScrollTrigger)
```
trigger: section, start "top top", end "+=1200",
pin: true, anticipatePin: 1, scrub: 1,
refreshPriority: 1,   // mide ESTE spacer antes que los triggers dependientes
                      // (manifiesto a margin-top:-100vh, logo central del Nav en #enfoque)
onUpdate: (self) => setScrollY(self.progress)
```
Timeline scrubbeada:
- `copyWrap` → `opacity 0`, `ease power1.in`, `dur 0.3` en `t=0`.
- `overlay` → `fromTo(opacity 0→1)`, `ease power2.inOut`, `dur 0.18` en `t=0.52` (negro pleno ~70%).
- Hold vacío `dur 0.3` en `t=0.9` (mantiene negro antes de soltar el pin).

> El **oscurecimiento real** ocurre en la escena (cámara dolly + fade de partículas/backlight/niebla
> manejados por `scrollY`). Aquí el DOM solo desvanece la copy y sella a negro.

### 4.3 Disparadores de blast (a nivel window/sección)
- `pointerenter` en la sección → `blast.current = 1`.
- `pointermove` en `window` (passive): `speed = hypot(movementX, movementY)`; si `speed>26` →
  `blast = min(1, max(blast, speed/130))`.

### 4.4 Pausa del render loop (perf)
`IntersectionObserver` (`rootMargin "200px 0px"`) + `visibilitychange`:
`sceneActive = inView && document.visibilityState==="visible"`. Pasar `active` al `<Canvas>`.

---

## 5. HeroScene.tsx — Canvas, cámara, postprocessing

- `<Canvas frameloop={active?"always":"never"} camera={{position:[0,0,5], fov:45}}
  gl={{antialias:false, alpha:true, powerPreference:"high-performance"}}
  dpr={tier==="medium"?[1,1.5]:[1,2]}>`.
- **FrameloopGate**: al re-activar, `requestAnimationFrame(() => invalidate())` (invalidate es
  no-op mientras sigue "never", se difiere un frame).
- **CameraRig**: parallax suave hacia `mouse*0.16` (lerp 0.035).
  Dolly: `dolly = smoothstep(scrollY,0,0.7)`, `targetZ = 5 - dolly*2.0` (lerp 0.08).
  `camera.lookAt(0, HERO_Y*dolly, 0)` (HERO_Y=0.45) → el nombre queda encuadrado al acercarse.
- **AdaptiveDpr pixelated**.
- **Postprocessing** (`EffectComposer multisampling={0}`):
  - tier **high**: `Bloom(intensity 0.7, luminanceThreshold 0.2, luminanceSmoothing 0.9, mipmapBlur, radius 0.6)`
    + `ChromaticAberration(offset (0.0006,0.0006), NORMAL)` + `Vignette(offset 0.3, darkness 0.9)`
    + `Noise(opacity 0.025, OVERLAY)`.
  - tier **medium**: solo `Bloom(intensity 0.5, luminanceThreshold 0.25, luminanceSmoothing 0.9, mipmapBlur)`.
- **Fallback estático**: si `tier==="low" || reduced || failed` → render de `<span>joan</span>`
  (CSS `font-size 26vw`/`18vw≥768px`, color `rgb(var(--bone-rgb)/0.1)`). El GPGPU solo corre
  en tiers `high`/`medium`.

---

## 6. Atmósfera

### HazePlane (z=-3, NormalBlending, renderOrder 0)
Niebla fbm (4 octavas de snoise) azul fría, deriva lenta (`t = uTime*0.025`). Viñeta radial
`smoothstep(0.85,0.2,d)`. Colores `uColorLow #070a12`, `uColorHigh #16213d`, `uOpacity 0.55`.
Fade por scroll: `uOpacity = 0.55*(1 - smoothstep(scrollY,0.05,0.6))`. Plano dimensionado al
frustum a z=-3 (×1.2).

### Backlight (z=-1.2, AdditiveBlending, renderOrder 1)
Glow radial `glow = pow(smoothstep(0.5,0.0,d), 2.2)` centrado en `(0.5,0.52)`. `uInner #5e96e6`,
`uOuter #14264a`. Respira: `breathe = 0.5+0.5*sin(t*0.4)`;
`uIntensity = progress*(0.55 + 0.18*breathe)*fade`, `fade = 1 - smoothstep(scrollY,0.05,0.6)`.

---

## 7. Rendimiento, accesibilidad y robustez

- **Tiers** (`useGpuTier`): móvil/`<768px`/`cores<=2` → `low` (fallback estático);
  `cores<=4 || dpr<1.5` → `medium`; resto → `high`.
- **Reduced motion**: sin formación, sin pin; muestra `joan` en reposo (fallback).
- **Limpieza**: en unmount, `gpu.dispose()`, `renderMat.dispose()`, disponer las DataTextures
  y la geometría; `gsap.context().revert()`. Flag `cancelled` para el async de init.
- **Sin allocations por frame**: objetos scratch en refs (raycaster, plane, vectores).
- El render loop se pausa fuera de pantalla / con la pestaña en background.

---

## 8. Criterios de aceptación

1. Tras el preloader (~1.4 s), las partículas coalescen en `joan` legible en ~2.6 s.
2. En reposo: turbulencia sutil, backlight pulsando, nacimiento/muerte sin que el texto deje de leerse.
3. El cursor empuja las partículas hacia el espectador; entrada de puntero y barridos rápidos
   disparan un blast que decae en ~115 ms. **Ningún handler bloquea a otro.**
4. Al hacer scroll: cámara hace dolly al nombre, las partículas se disuelven en niebla (no escalan),
   backlight y niebla se apagan (~60%), partículas apagadas (~70%), overlay a negro puro, pin suelta
   hacia la siguiente sección. Al subir, `joan` se re-forma en ráfagas.
5. `medium` baja resolución de sim y postprocessing; `low`/reduced-motion/fallo de init → `joan` estática.
6. Sin fugas de memoria WebGL al montar/desmontar repetidamente.

---

## 9. Parámetros para tunear (resumen rápido)

| Parámetro | Valor | Efecto |
|---|---|---|
| `worldWidth` | 4.6 | ancho del wordmark en mundo |
| `SIZE_BY_TIER` | 384 / 256 | nº partículas (size²) |
| `uAttractK` | 11.0 | rigidez del muelle al target |
| `uNoiseAmp` | 0.4 | intensidad de la turbulencia curl |
| `uDamping` | 6.8 | decaimiento de momento |
| `uMouseRadius` | 1.4 | radio de colisión del cursor |
| `formación delay/dur` | 1.4 s / 2.6 s | espera preloader / duración |
| `pin end` | `+=1200` | longitud del scroll de salida |
| dolly z | 5 → 3.0 (a 70%) | acercamiento de cámara |
| `uDissolve` map | `smoothstep(scrollY,0,0.5)` | rango de disolución |
| `uFade` map | `1 - smoothstep(scrollY,0.12,0.7)` | apagado de partículas |
