// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= UI =================
const scoreElement = document.getElementById("score");
let score = 0;
// ================= ESTADOS =================
let gameState = "intro"; // intro, playing, dead
let bossState = "alive"; // alive | falling | defeated
let bossRotation = 0;
let slowMotion = false;
let slowFactor = 1;
let bossFallSpeed = 0;
let victoryTimer = 0;
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

function getPlayerHitbox() {
    return {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2 + 5,
        radius: 22   // Ajusta si quieres más difícil o fácil
    };
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
    let dt = slowFactor;

    if (gameState !== "playing") return;

    // ================= RESPAWN =================
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

    // ================= MOVIMIENTO =================
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

    // ================= BALAS JUGADOR =================
    for (let i = bullets.length - 1; i >= 0; i--) {

        let b = bullets[i];
        b.x += b.speed;

        if (b.x > canvas.width) {
            bullets.splice(i, 1);
            continue;
        }

        if (bossState === "alive" && collision(b, boss)) {

            boss.health -= b.damage;
            bullets.splice(i, 1);
            screenShake = 6;

            if (boss.health <= 0 && bossState === "alive") {
                bossState = "falling";
                bossFallSpeed = 0;
            }

            continue;
        }
    }

    // ================= COLISIÓN DIRECTA CON JEFE =================
    if (bossState === "alive" && !invulnerable && collision(player, boss)) {
        killPlayer();
    }

    // ================= ATAQUES SOLO SI ESTÁ VIVO =================
    if (bossState === "alive") {

        let now = Date.now();
        let attackInterval = boss.phase === 1 ? 3000 : 2000;

        if (now - boss.lastAttackTime > attackInterval) {

            // BALAS NORMALES
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

            // BALA TRACKING
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

        // ================= LLUVIA SOLAR =================
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

        // ================= EMBESTIDA =================
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
    }

    // ================= BALAS ENEMIGAS =================
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        let b = enemyBullets[i];

        b.x += b.vx;
        b.y += b.vy;

        // TRACKING INTELIGENTE
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

        // COLISIÓN CIRCULAR REAL
        let hitbox = getPlayerHitbox();

        let bulletCenterX = b.x + b.width / 2;
        let bulletCenterY = b.y + b.height / 2;

        let dx = bulletCenterX - hitbox.x;
        let dy = bulletCenterY - hitbox.y;

        let distance = Math.sqrt(dx * dx + dy * dy);

        let bulletRadius = b.width / 2;

        if (!invulnerable && distance < bulletRadius + hitbox.radius) {
            killPlayer();
        }
    }

    // ================= CAÍDA DEL JEFE =================
    if (bossState === "falling") {

        enemyBullets.length = 0;

        slowMotion = true;
        slowFactor = 0.4;

        bossFallSpeed += 0.6 * slowFactor;
        boss.y += bossFallSpeed;
        bossRotation += 0.08;

        if (boss.y + boss.height >= canvas.height - 20) {

            boss.y = canvas.height - 20 - boss.height;
            bossState = "defeated";
            victoryTimer = 120;
            screenShake = 20;

            slowMotion = false;
            slowFactor = 1;
        }
    }

    // ================= ACTIVAR VICTORIA =================
    if (bossState === "defeated") {

        victoryTimer--;

        if (victoryTimer <= 0) {
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
    if (boss.charging) {

        boss.chargeTimer--;

        // 🔥 LLUVIA INTENSA MIENTRAS SE ENOJA
        if (Math.random() < 0.3) {
            enemyBullets.push({
                x: Math.random() * canvas.width,
                y: -20,
                width: 12,
                height: 18,
                vx: 0,
                vy: 6,
                type: "fireRain"
            });
        }

        if (boss.chargeTimer <= 0) {
            boss.charging = false;
            boss.diving = true;
        }
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

// ================= BALAS ENEMIGAS =================
for (let i = enemyBullets.length - 1; i >= 0; i--) {

    let b = enemyBullets[i];

    b.x += b.vx;
    b.y += b.vy;

    // TRACKING
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

    // ===== COLISIÓN CIRCULAR REAL =====
    let hitbox = getPlayerHitbox();

    let dx = (b.x + b.width / 2) - (hitbox.x + hitbox.width / 2);
    let dy = (b.y + b.height / 2) - (hitbox.y + hitbox.height / 2);
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (!invulnerable && distance < b.width / 2 + hitbox.width / 3) {
        killPlayer();
    }

    if (
        b.x < -30 ||
        b.x > canvas.width + 30 ||
        b.y > canvas.height + 30
    ) {
        enemyBullets.splice(i, 1);
    }
}

scoreElement.textContent = score;


function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ================= SCREEN SHAKE =================
    let shakeX = 0;
    let shakeY = 0;

    if (gameState === "playing" && screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake--;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ================= FONDO =================
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // ================= PLATAFORMA =================
    ctx.fillStyle = "#5a3e2b";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    // ================= AURA CUANDO SE ENOJA =================
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

        gradient.addColorStop(0, "rgba(255,120,0,0.9)");
        gradient.addColorStop(0.4, "rgba(255,60,0,0.7)");
        gradient.addColorStop(1, "rgba(255,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, boss.width / 2 + 60 + pulse, 0, Math.PI * 2);
        ctx.fill();

        screenShake = 3;
    }

    // ================= JEFE (ROTACIÓN) =================
    ctx.save();

    let bossCenterX = boss.x + boss.width / 2;
    let bossCenterY = boss.y + boss.height / 2;

    ctx.translate(bossCenterX, bossCenterY);
    ctx.rotate(bossRotation);
    ctx.drawImage(
        bossImg,
        -boss.width / 2,
        -boss.height / 2,
        boss.width,
        boss.height
    );

    ctx.restore();

    // ================= BARRA JEFE =================
    const barWidth = 400;
    const barX = canvas.width / 2 - barWidth / 2;

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(barX, 25, barWidth, 20);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(
        barX,
        25,
        (boss.health / boss.maxHealth) * barWidth,
        20
    );

    // ================= BARRA JUGADOR =================
    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(20, canvas.height - 40, 150, 15);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(
        20,
        canvas.height - 40,
        (lives / maxLives) * 150,
        15
    );

    // ================= BALAS JUGADOR =================
    ctx.fillStyle = "#fff8dc";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // ================= BALAS ENEMIGAS (FUEGO) =================
    enemyBullets.forEach(b => {

        let centerX = b.x + b.width / 2;
        let centerY = b.y + b.height / 2;
        let radius = b.width / 2 + 4;

        let gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            2,
            centerX,
            centerY,
            radius
        );

        // Tracking más rojo
        if (b.type === "tracking") {
            gradient.addColorStop(0, "#fff176");
            gradient.addColorStop(0.4, "#ff5722");
            gradient.addColorStop(1, "#b71c1c");
        }
        // Fire rain más intenso
        else if (b.type === "fireRain") {
            gradient.addColorStop(0, "#fff176");
            gradient.addColorStop(0.4, "#ff9800");
            gradient.addColorStop(1, "#e65100");
        }
        // Rain normal
        else {
            gradient.addColorStop(0, "#fff176");
            gradient.addColorStop(0.4, "#ff9800");
            gradient.addColorStop(1, "#d84315");
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    // ================= JUGADOR (PARPADEO) =================
    if (invulnerable) {
        if (Math.floor(invulnerableTimer / 10) % 2 === 0)
            ctx.globalAlpha = 0.3;
    }

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1;

    ctx.restore();

    // ================= INTRO =================
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
        ctx.fillText(
            "The Sun Has Fallen!",
            canvas.width / 2,
            canvas.height / 2 + 40
        );
    }
}

// ================= LOOP =================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();