// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= UI =================
const scoreElement = document.getElementById("score");
let score = 0;
// ================= ESTADOS =================
let gameState = "intro"; // intro, playing, dead
let introTimer = 0;
let wallopTimer = 0;
// ================= VIDAS =================
let lives = 3;
let maxLives = 3;
let isDead = false;
let respawnDelay = 0;
let invulnerable = false;
let invulnerableTimer = 0;

// ================= EFECTOS =================
let screenShake = 0;

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

// ================= JEFE =================
const boss = {
    x: 500,
    y: 60,
    width: 300,
    height: 300,
    baseY: 60,
    health: 10000,
    maxHealth: 10000,
    phase: 1,
    lastAttackTime: 0,
    lastRainTime: 0,
    charging: false,
    chargeTimer: 0,
    diving: false
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

    if (lives <= 0) {
        gameState = "dead";
        return;
    }

    isDead = true;
    respawnDelay = 90;
}

// ================= DISPARO =================
canvas.addEventListener("click", () => {

    if (gameState === "dead") {
        location.reload();
        return;
    }

    if (isDead || gameState !== "playing") return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 8,
        height: 8,
        speed: 8,
        damage: 100
    });
});

function update() {

    // Detener shake cuando termina el juego
    if (gameState === "victory" || gameState === "dead") {
        screenShake = 0;
    }

    if (gameState !== "playing") return;

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

        if (collision(b, boss)) {

            boss.health -= b.damage;
            screenShake = 6;
            bullets.splice(i, 1);

            if (boss.health <= boss.maxHealth / 2)
                boss.phase = 2;

            // ===== MUERTE DEL JEFE =====
            if (boss.health <= 0) {
                boss.health = 0;
                gameState = "victory";
            }
        }
    }

    // Colisión directa con jefe
    if (!invulnerable && collision(player, boss)) {
        killPlayer();
    }

    let now = Date.now();
    let attackInterval = boss.phase === 1 ? 3000 : 2000;

    // ===== ATAQUE NORMAL =====
    if (now - boss.lastAttackTime > attackInterval) {

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

        boss.lastAttackTime = now;
    }

    // ===== LLUVIA SOLAR =====
    if (now - boss.lastRainTime > 8000) {

        for (let i = 0; i < 5; i++) {
            enemyBullets.push({
                x: Math.random() * canvas.width,
                y: -20,
                width: 8,
                height: 14,
                vx: 0,
                vy: 5,
                type: "rain"
            });
        }

        boss.lastRainTime = now;
    }

    // ===== EMBESTIDA SIMPLE =====
    if (!boss.diving && !boss.charging && Math.random() < 0.002) {
        boss.charging = true;
        boss.chargeTimer = 60;
    }

    if (boss.charging) {
        boss.chargeTimer--;
        if (boss.chargeTimer <= 0) {
            boss.charging = false;
            boss.diving = true;
        }
    }

    if (boss.diving) {
        boss.y += 10;
        if (boss.y + boss.height >= canvas.height - 20) {
            boss.diving = false;
        }
    } else if (!boss.charging) {
        if (boss.y > boss.baseY)
            boss.y -= 5;
    }

    // ===== BALAS ENEMIGAS =====
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        let b = enemyBullets[i];

        b.x += b.vx;
        b.y += b.vy;

        if (b.type === "tracking") {

            let dx = player.x - b.x;
            let dy = player.y - b.y;
            let length = Math.sqrt(dx * dx + dy * dy);

            b.vx += (dx / length) * 0.04;
            b.vy += (dy / length) * 0.04;

            let speedLimit = 2.2;
            let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

            if (speed > speedLimit) {
                b.vx = (b.vx / speed) * speedLimit;
                b.vy = (b.vy / speed) * speedLimit;
            }

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
            b.y > canvas.height + 30
        ) {
            enemyBullets.splice(i, 1);
        }
    }

    scoreElement.textContent = score;
}

// ================= DRAW =================
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SHAKE solo durante gameplay
    let shakeX = 0;
    let shakeY = 0;

    if (gameState === "playing" && screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake--;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#5a3e2b";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    // ===== AURA CINEMÁTICA PRO =====
    if (boss.charging) {

        let centerX = boss.x + boss.width / 2;
        let centerY = boss.y + boss.height / 2;

        let pulse = Math.sin(Date.now() * 0.01) * 15;

        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            boss.width / 3,
            centerX,
            centerY,
            boss.width / 2 + 60 + pulse
        );

        gradient.addColorStop(0, "rgba(255,80,0,0.9)");
        gradient.addColorStop(0.4, "rgba(255,0,0,0.7)");
        gradient.addColorStop(1, "rgba(255,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, boss.width / 2 + 60 + pulse, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                centerX,
                centerY,
                boss.width / 2 + 80 + pulse + i * 25,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = "rgba(255,120,0,0.4)";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        screenShake = 3;
    }

    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

    // Barra jefe
    const barWidth = 400;
    const barX = canvas.width / 2 - barWidth / 2;

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(barX, 25, barWidth, 20);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(barX, 25,
        (boss.health / boss.maxHealth) * barWidth, 20);

    // Barra jugador
    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(20, canvas.height - 40, 150, 15);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(20, canvas.height - 40,
        (lives / maxLives) * 150, 15);

    // Balas jugador
    ctx.fillStyle = "#fff8dc";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Balas enemigas
    ctx.fillStyle = "#ff6600";
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Jugador con parpadeo
    if (invulnerable) {
        if (Math.floor(invulnerableTimer / 10) % 2 === 0)
            ctx.globalAlpha = 0.3;
    }

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1;

    ctx.restore(); // 🔥 IMPORTANTÍSIMO

    // ================= INTRO READY / WALLOP =================
    if (gameState === "intro") {

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#f4e8c1";

        if (introTimer < 120) {
            ctx.font = "bold 90px Georgia";
            ctx.fillText("READY?", canvas.width / 2, canvas.height / 2);
        } else if (introTimer < 240) {
            ctx.font = "bold 100px Georgia";
            ctx.fillText("WALLOP!", canvas.width / 2, canvas.height / 2);
        } else {
            gameState = "playing";
        }

        introTimer++;
    }

    // ================= VICTORIA =================
    if (gameState === "victory") {

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";

        ctx.fillStyle = "#f4e8c1";
        ctx.font = "bold 90px Georgia";
        ctx.fillText("KNOCKOUT!", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "28px Georgia";
        ctx.fillStyle = "#c19a6b";
        ctx.fillText("The Sun Has Fallen!", canvas.width / 2, canvas.height / 2 + 40);
    }
}

// ================= LOOP =================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();