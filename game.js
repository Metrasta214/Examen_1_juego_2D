// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= UI =================
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");

// ================= SCORE =================
let score = 0;
let highScore = localStorage.getItem("cupheadHighScore") || 0;
highScoreElement.textContent = highScore;

// ================= IMÁGENES (ESTILO CUPHEAD CLÁSICO) =================
// Puedes reemplazar estas rutas por tus sprites reales después
const playerImg = new Image();
playerImg.src = "assets/player.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const bulletImg = new Image();
bulletImg.src = "assets/bullet.png";

const minionImg = new Image();
minionImg.src = "assets/minion.png";

const backgroundImg = new Image();
backgroundImg.src = "assets/background.png";

// ================= CONTROLES =================
const keys = {};

// ================= JUGADOR (ESTILO CUPHEAD) =================
const player = {
    x: 80,
    y: 360,
    width: 60,
    height: 70,
    speed: 4,
    dy: 0,
    gravity: 0.6,
    jumpPower: -13,
    onGround: false
};

// ================= BALAS =================
const bullets = [];
const enemyBullets = [];

// ================= MINIONS (invocados ocasionalmente) =================
const minions = [];

// ================= JEFE ÚNICO (CUPHEAD STYLE) =================
const boss = {
    x: 620,
    y: 120,
    width: 140,
    height: 140,
    speedY: 1.8,
    direction: 1,
    shootTimer: 0,
    summonTimer: 0,
    health: 300,
    maxHealth: 300,
    phase: 1
};

// ================= EVENTOS TECLADO =================
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ================= CLICK = DISPARO + ELIMINAR MINIONS =================
canvas.addEventListener("click", (e) => {
    // Disparo del jugador
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 18,
        height: 8,
        speed: 9
    });

    // Eliminar minions con mouse (requisito)
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    minions.forEach((m, index) => {
        if (
            mouseX > m.x &&
            mouseX < m.x + m.width &&
            mouseY > m.y &&
            mouseY < m.y + m.height
        ) {
            minions.splice(index, 1);
            score += 40;
        }
    });
});

// ================= COLISIONES (AABB) =================
function collision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ================= ACTUALIZACIÓN =================
function update() {
    // ===== MOVIMIENTO JUGADOR (WASD) =====
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Salto (W o Espacio)
    if ((keys[" "] || keys["w"]) && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
    }

    // Gravedad
    player.dy += player.gravity;
    player.y += player.dy;

    // Suelo
    if (player.y + player.height >= canvas.height - 20) {
        player.y = canvas.height - player.height - 20;
        player.dy = 0;
        player.onGround = true;
    }

    // Límites del canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // ===== BALAS DEL JUGADOR =====
    bullets.forEach((b, bi) => {
        b.x += b.speed;

        // Eliminar si salen del canvas
        if (b.x > canvas.width) {
            bullets.splice(bi, 1);
            return;
        }

        // Colisión bala vs jefe
        if (collision(b, boss)) {
            boss.health -= 2;
            score += 10;
            bullets.splice(bi, 1);
        }

        // Colisión bala vs minions
        minions.forEach((m, mi) => {
            if (collision(b, m)) {
                minions.splice(mi, 1);
                bullets.splice(bi, 1);
                score += 60;
            }
        });
    });

    // ===== FASE DEL JEFE (DIFICULTAD PROGRESIVA) =====
    if (boss.health < boss.maxHealth * 0.5) {
        boss.phase = 2;
        boss.speedY = 2.8;
    }

    // ===== MOVIMIENTO DEL JEFE (patrón vertical clásico) =====
    boss.y += boss.speedY * boss.direction;

    if (boss.y <= 40 || boss.y + boss.height >= canvas.height - 40) {
        boss.direction *= -1;
    }

    const difficulty = 1 + score / 1200 + boss.phase * 0.5;

    // ===== DISPAROS DEL JEFE (ocasionales y serios) =====
    boss.shootTimer++;
    if (boss.shootTimer > 70 / difficulty) {
        enemyBullets.push({
            x: boss.x,
            y: boss.y + boss.height / 2,
            width: 20,
            height: 10,
            speed: 4 + difficulty
        });
        boss.shootTimer = 0;
    }

    // ===== INVOCAR MINIONS (NO MUCHOS, solo ocasionales) =====
    boss.summonTimer++;
    if (boss.summonTimer > 350) {
        minions.push({
            x: boss.x - 30,
            y: boss.y + Math.random() * 100,
            width: 50,
            height: 50,
            speed: 2 + Math.random() * 2
        });
        boss.summonTimer = 0;
    }

    // ===== MINIONS =====
    minions.forEach((m, mi) => {
        m.x -= m.speed;

        // Colisión con jugador
        if (collision(m, player)) {
            score = Math.max(0, score - 25);
            minions.splice(mi, 1);
        }

        // Eliminar si salen del canvas
        if (m.x + m.width < 0) {
            minions.splice(mi, 1);
        }
    });

    // ===== BALAS ENEMIGAS =====
    enemyBullets.forEach((b, bi) => {
        b.x -= b.speed;

        if (collision(b, player)) {
            score = Math.max(0, score - 50);
            enemyBullets.splice(bi, 1);
        }

        if (b.x + b.width < 0) {
            enemyBullets.splice(bi, 1);
        }
    });

    // ===== ACTUALIZAR SCORE =====
    scoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("cupheadHighScore", highScore);
        highScoreElement.textContent = highScore;
    }
}

// ================= DIBUJADO (ESTILO CUPHEAD CLÁSICO) =================
function draw() {
    // Fondo dentro del canvas (requisito del proyecto)
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#3a2d27"; // fallback vintage
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ===== JUGADOR =====
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "#b22222"; // rojo vintage serio
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // ===== BALAS DEL JUGADOR =====
    bullets.forEach((b) => {
        if (bulletImg.complete) {
            ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
        } else {
            ctx.fillStyle = "#f4e8c1";
            ctx.fillRect(b.x, b.y, b.width, b.height);
        }
    });

    // ===== JEFE PRINCIPAL =====
    if (bossImg.complete) {
        ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);
    } else {
        ctx.fillStyle = "#5a0f0f"; // rojo oscuro cuphead
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    }

    // ===== BARRA DE VIDA DEL JEFE (UI CLÁSICA) =====
    const barWidth = 320;
    const healthRatio = boss.health / boss.maxHealth;

    ctx.fillStyle = "#2b1f1a";
    ctx.fillRect(canvas.width - barWidth - 20, 20, barWidth, 25);

    ctx.fillStyle = "#c19a6b"; // dorado vintage
    ctx.fillRect(
        canvas.width - barWidth - 20,
        20,
        barWidth * healthRatio,
        25
    );

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - barWidth - 20, 20, barWidth, 25);

    // ===== MINIONS =====
    minions.forEach((m) => {
        if (minionImg.complete) {
            ctx.drawImage(minionImg, m.x, m.y, m.width, m.height);
        } else {
            ctx.fillStyle = "#2b2b2b";
            ctx.fillRect(m.x, m.y, m.width, m.height);
        }
    });

    // ===== BALAS ENEMIGAS =====
    enemyBullets.forEach((b) => {
        if (bulletImg.complete) {
            ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
        } else {
            ctx.fillStyle = "#c19a6b";
            ctx.fillRect(b.x, b.y, b.width, b.height);
        }
    });

    // ===== FILTRO VINTAGE (EFECTO CUPHEAD AÑOS 30) =====
    ctx.fillStyle = "rgba(255, 244, 200, 0.04)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ================= GAME LOOP =================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ================= INICIO =================
gameLoop();
