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

// ================= VIDAS =================
let lives = 3;
let isDead = false;
let fadeAlpha = 0;

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
    onGround: false,
    bob: 0 // animación idle
};

// ================= ARRAYS =================
const bullets = [];
const enemyBullets = [];
const minions = [];

// ================= JEFE =================
const boss = {
    x: 470,
    y: 40,
    width: 380,
    height: 380,
    speedY: 1.2,
    direction: 1,
    shootTimer: 0,
    summonTimer: 0,
    health: 10000,
    maxHealth: 10000,
    phase: 1
};

// ================= INPUT =================
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================= DISPARO JUGADOR =================
canvas.addEventListener("click", () => {
    if (isDead) return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        radius: 6,
        speed: 10,
        pulse: 0
    });
});

// ================= COLISION =================
function collisionRect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ================= MORIR =================
function killPlayer() {
    if (isDead) return;

    lives--;
    isDead = true;
    fadeAlpha = 0;

    setTimeout(() => {
        if (lives > 0) {
            player.x = 80;
            player.y = 360;
            isDead = false;
        }
    }, 1000);
}

// ================= UPDATE =================
function update() {

    if (isDead) return;

    // Movimiento jugador
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

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

    // Animación idle
    player.bob += 0.1;

    // ===== BALAS JUGADOR =====
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.speed;

        if (b.x > canvas.width) {
            bullets.splice(i, 1);
            continue;
        }

        // Daño al jefe
        if (collisionRect({x:b.x,y:b.y,width:1,height:1}, boss)) {
            boss.health -= 1;
            score += 100;
            bullets.splice(i, 1);
            continue;
        }

        // Daño minion
        for (let j = minions.length - 1; j >= 0; j--) {
            let m = minions[j];
            if (collisionRect({x:b.x,y:b.y,width:1,height:1}, m)) {
                m.health -= 10;
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

    // ===== PATRÓN DE BALAS RADIAL =====
    boss.shootTimer++;
    if (boss.shootTimer > 80) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
            enemyBullets.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                radius: 8,
                pulse: 0
            });
        }
        boss.shootTimer = 0;
    }

    // ===== MINIONS =====
    boss.summonTimer++;
    if (boss.summonTimer > 400) {
        minions.push({
            x: boss.x - 80,
            y: boss.y + boss.height - 120,
            width: 140,
            height: 140,
            speed: 2,
            health: 100
        });
        boss.summonTimer = 0;
    }

    for (let i = minions.length - 1; i >= 0; i--) {
        let m = minions[i];
        m.x -= m.speed;

        if (collisionRect(player, m)) killPlayer();
        if (m.x + m.width < 0) minions.splice(i, 1);
    }

    // ===== BALAS ENEMIGAS CON HOMING SUAVE =====
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];

        // seguimiento suave
        let dx = player.x - b.x;
        let dy = player.y - b.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        b.vx += (dx/dist) * 0.05;
        b.vy += (dy/dist) * 0.05;

        b.x += b.vx;
        b.y += b.vy;

        if (collisionRect({x:b.x,y:b.y,width:1,height:1}, player))
            killPlayer();

        if (b.x < -50 || b.x > canvas.width+50 ||
            b.y < -50 || b.y > canvas.height+50)
            enemyBullets.splice(i,1);
    }

    if (collisionRect(player, boss)) killPlayer();

    scoreElement.textContent = score;
}

// ================= DRAW =================
function draw() {

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(backgroundImg,0,0,canvas.width,canvas.height);

    // Animación jefe (flotación)
    let bossOffset = Math.sin(Date.now()*0.002)*5;
    ctx.drawImage(bossImg,boss.x,boss.y+bossOffset,boss.width,boss.height);

    // Barra vida jefe
    const barWidth = 400;
    ctx.fillStyle = "#2b1f1a";
    ctx.fillRect(canvas.width-barWidth-20,20,barWidth,25);
    ctx.fillStyle = "#c19a6b";
    ctx.fillRect(canvas.width-barWidth-20,20,(boss.health/boss.maxHealth)*barWidth,25);

    // Minions
    minions.forEach(m=>{
        ctx.save();
        ctx.scale(-1,1);
        ctx.drawImage(minionImg,-m.x-m.width,m.y,m.width,m.height);
        ctx.restore();
    });

    // Balas jugador animadas
    bullets.forEach(b=>{
        b.pulse+=0.2;
        let r=b.radius+Math.sin(b.pulse)*2;
        ctx.beginPath();
        ctx.arc(b.x,b.y,r,0,Math.PI*2);
        ctx.fillStyle="#fff8dc";
        ctx.fill();
    });

    // Balas enemigas animadas
    enemyBullets.forEach(b=>{
        b.pulse+=0.3;
        let r=b.radius+Math.sin(b.pulse)*3;
        ctx.beginPath();
        ctx.arc(b.x,b.y,r,0,Math.PI*2);
        ctx.fillStyle="#ff6600";
        ctx.fill();
    });

    // Jugador con animación idle
    let offset = Math.sin(player.bob)*4;
    ctx.globalAlpha = isDead ? 1-fadeAlpha : 1;
    ctx.drawImage(playerImg,player.x,player.y+offset,player.width,player.height);
    ctx.globalAlpha=1;

    // Fade muerte
    if(isDead){
        fadeAlpha+=0.02;
        if(fadeAlpha>1) fadeAlpha=1;
    }

    // Vidas
    ctx.fillStyle="white";
    ctx.font="20px Georgia";
    ctx.fillText("Vidas: "+lives,20,30);
}

// ================= LOOP =================
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();