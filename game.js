const musicNormal = document.getElementById("musicNormal");
const musicFinal = document.getElementById("musicFinal");
let currentMusic = "none";
let isFinalPhase = false;
let musicFadeSpeed = 0.02;
let lastFinalRainTime = 0;
let lastFinalShotTime = 0;
let attackPatternIndex = 0;
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
let restartButton = {
    x: canvas.width / 2,
    y: canvas.height / 2 + 120,
    radius: 40
};
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

const minionImg = new Image();
minionImg.src = "assets/minion.png"; // ← asegúrate que el nombre sea EXACTO
// ================= CONTROLES =================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
// ================= FULLSCREEN CON TECLA F =================
document.addEventListener("keydown", (e) => {

    if (e.key.toLowerCase() === "f") {

        if (!document.fullscreenElement) {
            canvas.requestFullscreen();
        } else {
            document.exitFullscreen();
        }

    }

});
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
    baseY: 60,
    health: 10000,
    maxHealth: 10000,
    phase: 1,
    lastAttackTime: 0,
    lastRainTime: 0,
    lastMinionTime: 0,
    charging: false,
    chargeTimer: 0,
    diving: false
};

function crossfadeToFinal() {

    musicFinal.volume = 0;
    musicFinal.play();

    let fadeInterval = setInterval(() => {

        if (musicNormal.volume > 0) {
            musicNormal.volume -= musicFadeSpeed;
        }

        if (musicFinal.volume < 0.6) {
            musicFinal.volume += musicFadeSpeed;
        }

        if (musicNormal.volume <= 0) {
            musicNormal.pause();
            clearInterval(fadeInterval);
        }

    }, 50);
}

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
canvas.addEventListener("click", (e) => {

    // ================= REINICIO =================
    if (gameState === "victory" || gameState === "dead") {

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - restartButton.x;
        const dy = mouseY - restartButton.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < restartButton.radius) {

            gameState = "intro";
            bossState = "alive";
            boss.health = boss.maxHealth;
            boss.y = boss.baseY;
            bossRotation = 0;

            bullets.length = 0;
            enemyBullets.length = 0;
            minions.length = 0;

            lives = 3;
            isDead = false;
            invulnerable = false;
            invulnerableTimer = 0;

            isFinalPhase = false;
            currentMusic = "none";

            musicNormal.pause();
            musicFinal.pause();

            introTimer = 0;
            victoryTimer = 0;
        }

        return;
    }

    // ================= DISPARO =================
    if (gameState !== "playing" || isDead) return;

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

    /// ================= MÚSICA =================
    if (gameState === "playing") {

        if (currentMusic === "none") {
            musicNormal.volume = 0.5;
            musicNormal.currentTime = 0;
            musicNormal.play();
            currentMusic = "normal";
        }
    }

    if (gameState === "victory" || gameState === "dead") {
        musicNormal.pause();
        musicFinal.pause();
        currentMusic = "none";
        isFinalPhase = false;
    }

    if (gameState !== "playing") return;

    // ================= FASE FINAL 30% =================
    if (!isFinalPhase && boss.health <= boss.maxHealth * 0.3) {

        isFinalPhase = true;

        if (currentMusic !== "final") {
            crossfadeToFinal();
            currentMusic = "final";
        }
    }

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

            if (boss.health <= 0) {
                bossState = "falling";
                bossFallSpeed = 0;
            }
        }
    }

    if (bossState === "alive" && !invulnerable && collision(player, boss)) {
        killPlayer();
    }

    // ================= ATAQUES DEL JEFE =================
    if (bossState === "alive") {
        let now = Date.now();

        // ================= MINIONS =================
        if (!isFinalPhase && now - boss.lastMinionTime > 6000) {

            minions.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                width: 90,   // 🔥 antes 40
                height: 90,  // 🔥 antes 40
                speed: 2,
                health: 200
            });

            boss.lastMinionTime = now;
        }
        // ===== FASE FINAL CONTROLADA =====
        if (isFinalPhase) {

            if (now - lastFinalRainTime > 2500) {

                let rainAmount = Math.floor(Math.random() * 6) + 5;

                for (let i = 0; i < rainAmount; i++) {
                    enemyBullets.push({
                        x: Math.random() * canvas.width,
                        y: -20,
                        width: 16,
                        height: 22,
                        vx: 0,
                        vy: 8,
                        type: "fireRain"
                    });
                }

                lastFinalRainTime = now;
            }

            if (now - lastFinalShotTime > 1800) {

                let shotAmount = Math.floor(Math.random() * 3) + 2;

                for (let i = 0; i < shotAmount; i++) {

                    let dx = (player.x + player.width / 2) - (boss.x + boss.width / 2);
                    let dy = (player.y + player.height / 2) - (boss.y + boss.height / 2);
                    let length = Math.sqrt(dx * dx + dy * dy);

                    enemyBullets.push({
                        x: boss.x + boss.width / 2,
                        y: boss.y + boss.height / 2,
                        width: 16,
                        height: 16,
                        vx: (dx / length) * 2.5,
                        vy: (dy / length) * 2.5,
                        type: "tracking",
                        life: 220
                    });
                }

                lastFinalShotTime = now;
            }
        }

        // ===== ATAQUE NORMAL MÁS AGRESIVO =====
        if (!isFinalPhase && now - boss.lastAttackTime > 1600) {

            attackPatternIndex++;
            if (attackPatternIndex > 3) attackPatternIndex = 1;

            // ================= PATRÓN 1 =================
            if (attackPatternIndex === 1) {

                // 3 disparos horizontales
                for (let i = 0; i < 3; i++) {
                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y + 80 + i * 70,
                        width: 12,
                        height: 12,
                        vx: -3.5,
                        vy: 0,
                        type: "normal"
                    });
                }
            }

            // ================= PATRÓN 2 =================
            else if (attackPatternIndex === 2) {

                // Abanico amplio
                for (let i = -2; i <= 2; i++) {

                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y + boss.height / 2,
                        width: 12,
                        height: 12,
                        vx: -3,
                        vy: i * 1.2,
                        type: "normal"
                    });
                }
            }

            // ================= PATRÓN 3 =================
            else if (attackPatternIndex === 3) {

                let dx = (player.x + player.width / 2) - (boss.x + boss.width / 2);
                let dy = (player.y + player.height / 2) - (boss.y + boss.height / 2);
                let length = Math.sqrt(dx * dx + dy * dy);

                // Tracking suave
                enemyBullets.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height / 2,
                    width: 14,
                    height: 14,
                    vx: (dx / length) * 2,
                    vy: (dy / length) * 2,
                    type: "tracking",
                    life: 160
                });

                // Disparo recto extra
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 2,
                    width: 12,
                    height: 12,
                    vx: -4,
                    vy: 0,
                    type: "normal"
                });
            }

            boss.lastAttackTime = now;
        }
    }

    // ================= BALAS ENEMIGAS =================
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        let b = enemyBullets[i];

        b.x += b.vx;
        b.y += b.vy;

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

        if (
            b.x < -30 ||
            b.x > canvas.width + 30 ||
            b.y > canvas.height + 30
        ) {
            enemyBullets.splice(i, 1);
        }
    }
    // ================= MOVIMIENTO MINIONS =================
    for (let i = minions.length - 1; i >= 0; i--) {

        let m = minions[i];

        let dx = (player.x + player.width / 2) - (m.x + m.width / 2);
        let dy = (player.y + player.height / 2) - (m.y + m.height / 2);
        let length = Math.sqrt(dx * dx + dy * dy);

        // 🔥 Evita división entre 0
        if (length > 0.1) {
            m.x += (dx / length) * m.speed;
            m.y += (dy / length) * m.speed;
        }

        // 🔥 Hitbox más justa (circular)
        let distance = Math.sqrt(
            Math.pow((m.x + m.width / 2) - (player.x + player.width / 2), 2) +
            Math.pow((m.y + m.height / 2) - (player.y + player.height / 2), 2)
        );

        if (!invulnerable && distance < 35) {
            killPlayer();
        }

        // Balas contra minions
        for (let j = bullets.length - 1; j >= 0; j--) {

            if (collision(bullets[j], m)) {

                m.health -= bullets[j].damage;
                bullets.splice(j, 1);

                if (m.health <= 0) {
                    minions.splice(i, 1);
                    break;
                }
            }
        }
    }
    // ================= CAÍDA JEFE =================
    if (bossState === "falling") {

        enemyBullets.length = 0;

        bossFallSpeed += 0.6;
        boss.y += bossFallSpeed;
        bossRotation += 0.08;

        if (boss.y + boss.height >= canvas.height - 20) {

            boss.y = canvas.height - 20 - boss.height;
            bossState = "defeated";
            victoryTimer = 120;
            screenShake = 20;
        }
    }

    if (bossState === "defeated") {
        victoryTimer--;
        if (victoryTimer <= 0) {
            gameState = "victory";
        }
    }
}



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

    // ================= JEFE =================
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
    const barHeight = 20;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 25;

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(
        barX,
        barY,
        (boss.health / boss.maxHealth) * barWidth,
        barHeight
    );

    // ================= MINIONS =================
    minions.forEach(m => {
        ctx.drawImage(
            minionImg,
            m.x,
            m.y,
            m.width,
            m.height
        );
    });

    // ================= BALAS JUGADOR =================
    ctx.fillStyle = "#fff8dc";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // ================= BALAS ENEMIGAS =================
    enemyBullets.forEach(b => {

        let centerX = b.x + b.width / 2;
        let centerY = b.y + b.height / 2;
        let radius = b.width / 2 + 4;

        let pulse = Math.sin(Date.now() * 0.01) * 2;

        let gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            2,
            centerX,
            centerY,
            radius + pulse
        );

        gradient.addColorStop(0, "#fff176");
        gradient.addColorStop(0.4, "#ff9800");
        gradient.addColorStop(1, "#d84315");

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    // ================= JUGADOR =================
    if (invulnerable) {
        if (Math.floor(invulnerableTimer / 10) % 2 === 0)
            ctx.globalAlpha = 0.3;
    }

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1;

    ctx.restore();

    // ================= CORAZONES GRANDES =================
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "left";

    for (let i = 0; i < maxLives; i++) {

        if (i < lives) {
            ctx.fillStyle = "#ff4444"; // rojo vivo
        } else {
            ctx.fillStyle = "#555555"; // corazón vacío
        }

        ctx.fillText("♥", 20 + i * 45, canvas.height - 20);
    }

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

    // ================= VICTORY =================
    if (gameState === "victory") {

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";

        ctx.fillStyle = "#f4e8c1";
        ctx.font = "bold 90px Georgia";
        ctx.fillText("KNOCKOUT!", canvas.width / 2, canvas.height / 2 - 20);

        drawRestartButton("#fff176", "#ff5722");
    }

    // ================= GAME OVER =================
    if (gameState === "dead") {

        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";

        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 90px Georgia";
        ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 40);

        drawRestartButton("#ff8a65", "#d84315");
    }
}

// ================= BOTÓN REINICIO =================
function drawRestartButton(color1, color2) {

    ctx.beginPath();
    ctx.arc(restartButton.x, restartButton.y, restartButton.radius, 0, Math.PI * 2);

    let gradient = ctx.createRadialGradient(
        restartButton.x,
        restartButton.y,
        5,
        restartButton.x,
        restartButton.y,
        restartButton.radius
    );

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("↻", restartButton.x, restartButton.y + 15);
}
// ================= BARRA JEFE =================
const barWidth = 400;
const barHeight = 20;
const barX = canvas.width / 2 - barWidth / 2;
const barY = 25;

// fondo barra
ctx.fillStyle = "#2a1f1a";
ctx.fillRect(barX, barY, barWidth, barHeight);

// vida actual
ctx.fillStyle = "#c19a6b";
ctx.fillRect(
    barX,
    barY,
    (boss.health / boss.maxHealth) * barWidth,
    barHeight
);
// ================= LOOP =================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();