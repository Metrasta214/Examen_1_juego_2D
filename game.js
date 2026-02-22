// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= UI =================
const scoreElement = document.getElementById("score");

let score = 0;

// ================= VIDAS =================
let lives = 3;
let maxLives = 3;
let isDead = false;
let respawnDelay = 0;
let invulnerable = false;
let invulnerableTimer = 0;

// ================= EFECTOS =================
let screenShake = 0;
const explosions = [];

// ================= PLATAFORMA =================
const platform = {
    x: 250,
    y: 340,
    width: 200,
    height: 18
};

// ================= IMÁGENES =================
const playerImg = new Image();
playerImg.src = "assets/player.png";

const bossImg = new Image();
bossImg.src = "assets/boss.png";

const minionImg = new Image();
minionImg.src = "assets/minion.png";

const backgroundImg = new Image();
backgroundImg.src = "assets/background.png";

// ================= CONTROLES =================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================= JUGADOR =================
const player = {
    x: 80,
    y: 360,
    width: 80,
    height: 90,
    speed: 4,
    dy: 0,
    gravity: 0.6,
    jumpPower: -13,
    onGround: false
};

// ================= ARRAYS =================
const bullets = [];
const enemyBullets = [];
const minions = [];

// ================= JEFE =================
const boss = {
    x: 500,
    y: 60,
    width: 300,
    height: 300,
    direction: 1,
    speedY: 1,
    shootTimer: 0,
    summonTimer: 0,
    health: 10000,
    maxHealth: 10000,
    phase: 1,
    lastAttackTime: 0
};

// ================= COLISION =================
function collision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ================= MORIR =================
function killPlayer() {
    if (isDead || invulnerable) return;

    lives--;
    isDead = true;
    respawnDelay = 90;

    if (lives <= 0) {
        alert("GAME OVER");
        location.reload();
    }
}

// ================= DISPARO =================
canvas.addEventListener("click", () => {
    if (isDead) return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 8,
        height: 8,
        speed: 8,
        damage: 100
    });
});

// ================= UPDATE =================
function update() {

    // Respawn
    if (isDead) {
        respawnDelay--;
        if (respawnDelay <= 0) {
            player.x = 80;
            player.y = 360;
            player.dy = 0;
            isDead = false;
            invulnerable = true;
            invulnerableTimer = 180;
        }
        return;
    }

    if (invulnerable) {
        invulnerableTimer--;
        if (invulnerableTimer <= 0)
            invulnerable = false;
    }

    // Movimiento
    if (keys["a"] && player.x > 0) player.x -= player.speed;
    if (keys["d"] && player.x + player.width < canvas.width)
        player.x += player.speed;

    if ((keys[" "] || keys["w"]) && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
    }

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height >= canvas.height - 20) {
        player.y = canvas.height - player.height - 20;
        player.dy = 0;
        player.onGround = true;
    }

    // Plataforma
    if (
        player.y + player.height <= platform.y + 10 &&
        player.y + player.height + player.dy >= platform.y &&
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width
    ) {
        player.y = platform.y - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    // ===== BALAS JUGADOR =====
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.speed;

        if (b.x > canvas.width) {
            bullets.splice(i, 1);
            continue;
        }

        if (collision({ x: b.x, y: b.y, width: 1, height: 1 }, boss)) {
            boss.health -= b.damage;
            screenShake = 8;
            bullets.splice(i, 1);

            if (boss.health <= boss.maxHealth / 2)
                boss.phase = 2;

            continue;
        }

        for (let j = minions.length - 1; j >= 0; j--) {
            let m = minions[j];
            if (collision({ x: b.x, y: b.y, width: 1, height: 1 }, m)) {
                m.health -= b.damage;
                bullets.splice(i, 1);

                if (m.health <= 0) {
                    explosions.push({
                        x: m.x + m.width / 2,
                        y: m.y + m.height / 2,
                        radius: 0
                    });
                    minions.splice(j, 1);
                }
                break;
            }
        }
    }

    // Movimiento jefe
    boss.y += boss.speedY * boss.direction;
    if (boss.y <= 20 || boss.y + boss.height >= canvas.height - 20)
        boss.direction *= -1;
    // ===== COLISIÓN DIRECTA CON EL JEFE =====
    if (!invulnerable && collision(player, boss)) {
        killPlayer();
    }
    // ===== DISPARO JEFE CADA 3 SEGUNDOS =====

    let currentTime = Date.now();

    if (currentTime - boss.lastAttackTime > 3000) {

        // 🔥 2 balas normales
        for (let i = 0; i < 2; i++) {
            enemyBullets.push({
                x: boss.x,
                y: boss.y + 80 + i * 80,
                width: 10,
                height: 10,
                vx: -4,
                vy: 0,
                type: "normal"
            });
        }

        // 🔥 1 bala tracking suave
        let dx = player.x - boss.x;
        let dy = player.y - boss.y;
        let length = Math.sqrt(dx * dx + dy * dy);

        enemyBullets.push({
            x: boss.x,
            y: boss.y + boss.height / 2,
            width: 12,
            height: 12,
            vx: (dx / length) * 2,
            vy: (dy / length) * 2,
            type: "tracking",
            life: 200
        });

        boss.lastAttackTime = currentTime;
    }

    // ===== INVOCAR MINIONS =====
    boss.summonTimer++;
    let summonDelay = boss.phase === 1 ? 450 : 300;

    if (boss.summonTimer > summonDelay) {
        minions.push({
            x: canvas.width + 50,
            y: boss.y + 180,
            width: 90,
            height: 90,
            speed: 3,
            health: 100
        });
        boss.summonTimer = 0;
    }

    // Movimiento minions
    for (let i = minions.length - 1; i >= 0; i--) {
        let m = minions[i];
        m.x -= m.speed;

        if (!invulnerable && collision(player, m))
            killPlayer();

        if (m.x + m.width < -50)
            minions.splice(i, 1);
    }

    // ===== BALAS ENEMIGAS =====
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        let b = enemyBullets[i];

        if (b.type === "normal") {
            b.x += b.vx;
            b.y += b.vy;
        }

        if (b.type === "tracking") {

            let dx = player.x - b.x;
            let dy = player.y - b.y;
            let length = Math.sqrt(dx * dx + dy * dy);

            // 🔻 Giro mucho más suave (ANTES 0.1)
            let steerX = (dx / length) * 0.04;
            let steerY = (dy / length) * 0.04;

            b.vx += steerX;
            b.vy += steerY;

            // 🔻 Velocidad máxima más baja (ANTES 3)
            let speedLimit = 2.2;
            let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

            if (speed > speedLimit) {
                b.vx = (b.vx / speed) * speedLimit;
                b.vy = (b.vy / speed) * speedLimit;
            }

            b.x += b.vx;
            b.y += b.vy;

            // 🔻 Dura menos tiempo (ANTES 240)
            b.life--;

            if (b.life <= 0) {
                enemyBullets.splice(i, 1);
                continue;
            }
        }

        if (!invulnerable && collision(player, b))
            killPlayer();

        if (
            b.x < -30 ||
            b.x > canvas.width + 30 ||
            b.y < -30 ||
            b.y > canvas.height + 30
        ) {
            enemyBullets.splice(i, 1);
        }
    }

    // Explosiones
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].radius += 4;
        if (explosions[i].radius > 30)
            explosions.splice(i, 1);
    }

    scoreElement.textContent = score;
}

// ================= DRAW =================
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let shakeX = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    let shakeY = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    if (screenShake > 0) screenShake--;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#5a3e2b";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

    const barWidth = 400;
    const barX = canvas.width / 2 - barWidth / 2;

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(barX, 25, barWidth, 20);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(barX, 25,
        (boss.health / boss.maxHealth) * barWidth, 20);

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(20, canvas.height - 40, 150, 15);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(20, canvas.height - 40,
        (lives / maxLives) * 150, 15);

    minions.forEach(m => {
        ctx.drawImage(minionImg, m.x, m.y, m.width, m.height);
    });

    explosions.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = "orange";
        ctx.fill();
    });

    ctx.fillStyle = "#fff8dc";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    ctx.fillStyle = "#ff6600";
    enemyBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    if (invulnerable) {
        if (Math.floor(invulnerableTimer / 10) % 2 === 0)
            ctx.globalAlpha = 0.3;
    }

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1;

    ctx.restore();
}

// ================= LOOP =================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();