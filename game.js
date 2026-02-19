const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");

// Score
let score = 0;
let highScore = localStorage.getItem("cupheadHighScore") || 0;
highScoreElement.textContent = highScore;

// Controles
const keys = {};

// Física del jugador
const player = {
    x: 80,
    y: 350,
    width: 50,
    height: 60,
    speed: 4,
    dy: 0,
    gravity: 0.6,
    jumpPower: -12,
    onGround: false
};

// Balas del jugador
const bullets = [];

// Balas del jefe
const enemyBullets = [];

// Minions invocados por el jefe
const minions = [];

// JEFE PRINCIPAL (único enemigo base)
const boss = {
    x: 620,
    y: 120,
    width: 120,
    height: 120,
    speedY: 1.8,
    direction: 1,
    shootTimer: 0,
    summonTimer: 0,
    health: 200,
    maxHealth: 200
};

// EVENTOS DE TECLADO
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// CLICK = DISPARO + ELIMINAR MINIONS CON MOUSE
canvas.addEventListener("click", (e) => {
    // Disparo del jugador
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 12,
        height: 4,
        speed: 8
    });

    // Eliminar minions con el mouse (requisito de la rúbrica)
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
            score += 30;
        }
    });
});

// FUNCIÓN DE COLISIÓN (AABB)
function collision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ACTUALIZACIÓN PRINCIPAL
function update() {
    // ================= MOVIMIENTO DEL JUGADOR =================
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Salto con espacio
    if ((keys[" "] || keys["w"]) && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
    }

    // Gravedad
    player.dy += player.gravity;
    player.y += player.dy;

    // Suelo
    if (player.y + player.height >= canvas.height - 10) {
        player.y = canvas.height - player.height - 10;
        player.dy = 0;
        player.onGround = true;
    }

    // Límites del canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width)
        player.x = canvas.width - player.width;

    // ================= BALAS DEL JUGADOR =================
    bullets.forEach((b, i) => {
        b.x += b.speed;

        // Eliminar si salen del canvas
        if (b.x > canvas.width) {
            bullets.splice(i, 1);
        }

        // Colisión bala vs jefe
        if (collision(b, boss)) {
            boss.health -= 2;
            score += 10;
            bullets.splice(i, 1);
        }

        // Colisión bala vs minions
        minions.forEach((m, mi) => {
            if (collision(b, m)) {
                minions.splice(mi, 1);
                bullets.splice(i, 1);
                score += 50;
            }
        });
    });

    // ================= LÓGICA DEL JEFE =================
    // Movimiento vertical del jefe (estilo patrón)
    boss.y += boss.speedY * boss.direction;

    if (boss.y <= 40 || boss.y + boss.height >= canvas.height - 40) {
        boss.direction *= -1;
    }

    // Dificultad progresiva basada en score
    const difficultyFactor = 1 + score / 1000;

    // Disparo del jefe (aleatorio y progresivo)
    boss.shootTimer++;
    if (boss.shootTimer > 60 / difficultyFactor) {
        enemyBullets.push({
            x: boss.x,
            y: boss.y + boss.height / 2,
            width: 14,
            height: 6,
            speed: 4 + difficultyFactor * 0.5
        });
        boss.shootTimer = 0;
    }

    // Invocar minions ocasionalmente (NO muchos enemigos)
    boss.summonTimer++;
    if (boss.summonTimer > 300) {
        minions.push({
            x: boss.x - 20,
            y: boss.y + Math.random() * 80,
            width: 40,
            height: 40,
            speed: 2 + Math.random() * 1.5
        });
        boss.summonTimer = 0;
    }

    // ================= MINIONS =================
    minions.forEach((m, mi) => {
        m.x -= m.speed;

        // Colisión minion vs jugador
        if (collision(m, player)) {
            score = Math.max(0, score - 20);
            minions.splice(mi, 1);
        }

        // Eliminar si salen del canvas
        if (m.x + m.width < 0) {
            minions.splice(mi, 1);
        }
    });

    // ================= BALAS ENEMIGAS =================
    enemyBullets.forEach((b, i) => {
        b.x -= b.speed;

        // Colisión bala enemiga vs jugador
        if (collision(b, player)) {
            score = Math.max(0, score - 40);
            enemyBullets.splice(i, 1);
        }

        // Eliminar si salen del canvas
        if (b.x + b.width < 0) {
            enemyBullets.splice(i, 1);
        }
    });

    // ================= SCORE & HIGHSCORE =================
    scoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("cupheadHighScore", highScore);
        highScoreElement.textContent = highScore;
    }
}

// DIBUJADO
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ================= JUGADOR =================
    ctx.fillStyle = "#b22222"; // rojo vintage serio
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // ================= BALAS DEL JUGADOR =================
    ctx.fillStyle = "#f4e8c1"; // color crema estilo cuphead
    bullets.forEach((b) => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // ================= JEFE =================
    ctx.fillStyle = "#5a0f0f"; // rojo oscuro serio
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    // Barra de vida del jefe (estilo clásico)
    const barWidth = 300;
    const healthRatio = boss.health / boss.maxHealth;

    ctx.fillStyle = "#3b0000";
    ctx.fillRect(canvas.width - barWidth - 20, 20, barWidth, 20);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(
        canvas.width - barWidth - 20,
        20,
        barWidth * healthRatio,
        20
    );

    ctx.strokeStyle = "#000";
    ctx.strokeRect(canvas.width - barWidth - 20, 20, barWidth, 20);

    // ================= MINIONS =================
    ctx.fillStyle = "#2b2b2b"; // tono serio
    minions.forEach((m) => {
        ctx.fillRect(m.x, m.y, m.width, m.height);
    });

    // ================= BALAS ENEMIGAS =================
    ctx.fillStyle = "#c19a6b"; // dorado vintage
    enemyBullets.forEach((b) => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
}

// LOOP PRINCIPAL DEL JUEGO
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar juego
gameLoop();
