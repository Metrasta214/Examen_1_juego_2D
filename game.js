// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= UI =================
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");

let score = 0;
let highScore = localStorage.getItem("cupheadHighScore") || 0;
highScoreElement.textContent = highScore;

// ================= VIDAS =================
let lives = 3;
let isDead = false;
let respawnDelay = 0;
let invulnerable = false;
let invulnerableTimer = 0;

// ================= PLATAFORMA (AJUSTADA) =================
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
    maxHealth: 10000
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

    // ===== RESPAWN =====
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

    // ===== INMUNIDAD =====
    if (invulnerable) {
        invulnerableTimer--;
        if (invulnerableTimer <= 0) {
            invulnerable = false;
        }
    }

    // ===== MOVIMIENTO =====
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

        if (collision({x:b.x,y:b.y,width:1,height:1}, boss)) {
            boss.health -= b.damage;
            score += 100;
            bullets.splice(i, 1);
            continue;
        }

        for (let j = minions.length - 1; j >= 0; j--) {
            let m = minions[j];
            if (collision({x:b.x,y:b.y,width:1,height:1}, m)) {
                m.health -= b.damage;
                bullets.splice(i, 1);

                if (m.health <= 0) {
                    minions.splice(j, 1);
                    score += 100;
                }
                break;
            }
        }
    }

    // ===== MOVIMIENTO JEFE =====
    boss.y += boss.speedY * boss.direction;
    if (boss.y <= 20 || boss.y + boss.height >= canvas.height - 20)
        boss.direction *= -1;

    // ===== DISPARO JEFE =====
    boss.shootTimer++;
    if (boss.shootTimer > 150) {
        for (let i = 0; i < 4; i++) {
            enemyBullets.push({
                x: boss.x,
                y: boss.y + 50 + i * 50,
                width: 10,
                height: 10,
                speed: -4
            });
        }
        boss.shootTimer = 0;
    }

    // ===== MINIONS TIPO PROYECTIL =====
    boss.summonTimer++;
    if (boss.summonTimer > 450) {
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
        b.x += b.speed;

        if (!invulnerable && collision(player, b))
            killPlayer();

        if (b.x < -20)
            enemyBullets.splice(i, 1);
    }

    scoreElement.textContent = score;
}

// ================= DRAW =================
function draw() {

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(backgroundImg,0,0,canvas.width,canvas.height);

    // Plataforma
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    // Jefe
    ctx.drawImage(bossImg,boss.x,boss.y,boss.width,boss.height);

    // ===== BARRA DE VIDA ESTILO =====
    const barWidth = 400;
    const barHeight = 22;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 25;

    ctx.fillStyle = "#8b6f3d";
    ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

    ctx.fillStyle = "#2a1f1a";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(
        barX,
        barY,
        (boss.health / boss.maxHealth) * barWidth,
        barHeight
    );

    // Minions
    minions.forEach(m=>{
        ctx.drawImage(minionImg,m.x,m.y,m.width,m.height);
    });

    // Balas jugador
    ctx.fillStyle="#fff8dc";
    bullets.forEach(b=>{
        ctx.fillRect(b.x,b.y,b.width,b.height);
    });

    // Balas enemigas
    ctx.fillStyle="#ff6600";
    enemyBullets.forEach(b=>{
        ctx.fillRect(b.x,b.y,b.width,b.height);
    });

    // Jugador con parpadeo
    if (invulnerable) {
        if (Math.floor(invulnerableTimer / 10) % 2 === 0)
            ctx.globalAlpha = 0.3;
    }

    ctx.drawImage(playerImg,player.x,player.y,player.width,player.height);
    ctx.globalAlpha = 1;

    ctx.fillStyle="white";
    ctx.font="18px Georgia";
    ctx.fillText("Vidas: "+lives,20,30);
}

// ================= LOOP =================
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();