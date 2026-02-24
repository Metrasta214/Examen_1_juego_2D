# ☀️ Sun Boss Fight – Cuphead Style Canvas Game

## 📌 Descripción

**Sun Boss Fight** es un videojuego 2D desarrollado con HTML5 Canvas y JavaScript puro.  
El juego está inspirado en las mecánicas de combate estilo *Cuphead*, donde el jugador debe enfrentarse a un jefe principal (El Sol) que utiliza múltiples patrones de ataque y cambia de comportamiento durante la batalla.

El objetivo es sobrevivir, esquivar ataques y reducir los 10,000 puntos de vida del jefe hasta derrotarlo.

---

## 🎮 Mecánicas del Juego

### 👤 Jugador
- Movimiento lateral (A / D)
- Salto (W o Barra Espaciadora)
- Disparo con clic del mouse
- 3 vidas
- Sistema de respawn con invulnerabilidad temporal
- Hitbox ajustado para colisiones más precisas
- Barra de vidas visible en pantalla

---

### ☀️ Jefe – El Sol

El jefe cuenta con:

- 10,000 puntos de vida
- Sistema de fases (fase 1 y fase 2)
- Barra de vida dinámica
- Ataques variados:
  - Disparo horizontal
  - Disparo con seguimiento suave (tracking)
  - Lluvia solar desde la parte superior
  - Embestida con animación de carga cinematográfica
- Efectos visuales:
  - Aura roja durante carga
  - Screen shake en impactos
  - Rotación y caída física al morir
- Transición a pantalla de victoria estilo “KNOCKOUT!”

---

### 👾 Minions

- Aparecen de forma aleatoria
- Se desplazan desde el lado derecho del canvas
- Eliminan al jugador por contacto
- Desaparecen al salir del canvas

---

## 🧠 Estados del Juego

El juego funciona mediante un sistema de estados:

- `intro` → Muestra "READY?" y luego "WALLOP!"
- `playing` → Juego activo
- `dead` → Pantalla de derrota
- `victory` → Pantalla final tras derrotar al jefe

El jefe también cuenta con estados internos:

- `alive`
- `falling`
- `defeated`

---

## 🎨 Características Visuales

- Uso de Canvas API
- Balas enemigas circulares estilo mini-sol
- Animación de aura roja durante carga
- Rotación del jefe al caer
- Efecto de sacudida de pantalla (screen shake)
- Sistema de barras de progreso
- Transiciones cinematográficas

---

## ⚙️ Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript
- Canvas API

No se utilizaron frameworks ni librerías externas.

---

## 📂 Estructura del Proyecto
