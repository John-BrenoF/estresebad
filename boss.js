import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins, getTotalCoins } from './storage.js';
import { triggerScreenShake } from './main.js';
import { playBossDefeated, playBossLaser, playBossRedLightning } from './audio.js';

export const boss = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    active: false,
    hp: 500,
    maxHp: 500,
    state: 'idle', // idle, attack1, attack2, attack3, attack4, attack5
    isDefeated: false,
    timer: 0,
    attackTimer: 0,
    projectiles: [],
    lasers: [], // {x, y, w, h, warning: boolean}
    frame: 0,
    survivalTimer: 0,
    hitTimer: 0, // Para o efeito de piscar ao ser atingido
    redLightningTimer: 0 // Timer visual para o raio vermelho
};

export function initBoss() {
    boss.active = true;
    boss.x = canvas.width - 120;
    boss.y = canvas.height / 2 - 40;
    boss.isDefeated = false;
    boss.state = 'idle';
    boss.hp = boss.maxHp;
    boss.timer = 60; // Tempo inicial de espera
    boss.projectiles = [];
    boss.lasers = [];
    boss.frame = 0;
    boss.survivalTimer = 0;
    boss.redLightningTimer = 0;
}

export function updateBoss(bird, onCollision) {
    if (!boss.active || boss.isDefeated) return;

    if (boss.hp <= 0 && !boss.isDefeated) {
        defeatBoss(onCollision);
        return;
    }

    boss.frame += 0.1;
    if (boss.hitTimer > 0) boss.hitTimer--;

    // Movimento flutuante do Boss
    boss.y = (canvas.height / 2 - 40) + Math.sin(boss.frame) * 100;

    // Sistema de Recompensa por Sobrevivência (a cada 5s)
    if (!gameProps.isGameOver) {
        boss.survivalTimer++;
        if (boss.survivalTimer % 300 === 0) { // 300 frames ~ 5 segundos
            const reward = Math.random() > 0.5 ? 8 : 6;
            gameProps.currentCoins += reward;
            // Efeito visual de ganho de moeda (texto flutuante poderia ser adicionado aqui)
        }
    }

    // Máquina de Estados do Boss
    boss.timer--;
    if (boss.timer <= 0) {
        if (boss.state === 'idle') {
            // Escolhe um ataque aleatório
            const attacks = ['attack1', 'attack3', 'attack4', 'attack5'];
            boss.state = attacks[Math.floor(Math.random() * attacks.length)];
            boss.attackTimer = 0;
            boss.timer = 240; // Duração do ataque (~4s)
        } else {
            boss.state = 'idle';
            boss.timer = 60; // Descanso (~1s)
            boss.lasers = []; // Limpa lasers
        }
    }

    // Executa Ataques
    boss.attackTimer++;
    
    // Ataque 1: Faixas de Luz Horizontais (Lasers)
    if (boss.state === 'attack1') {
        if (boss.attackTimer % 60 === 0 && boss.attackTimer < 180) {
            const yPos = Math.random() * (canvas.height - 50);
            triggerScreenShake(4, 15);
            playBossLaser();
            boss.lasers.push({ x: 0, y: yPos, w: canvas.width, h: 40, warning: true, timer: 40 });
        }
    }
    
    // Ataque 3: Esferas de Energia (Teleguiadas no início)
    if (boss.state === 'attack3') {
        if (boss.attackTimer % 40 === 0) {
            const angle = Math.atan2(bird.y - (boss.y + 40), bird.x - boss.x);
            boss.projectiles.push({
                x: boss.x, y: boss.y + 40,
                vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                size: 15, type: 'orb'
            });
        }
    }

    // Ataque 4: Onda Senoidal
    if (boss.state === 'attack4') {
        if (boss.attackTimer % 20 === 0) {
            boss.projectiles.push({
                x: boss.x, y: boss.y + 40,
                vx: -6, vy: 0,
                size: 10, type: 'wave',
                initialY: boss.y + 40, t: 0
            });
        }
    }

    // Ataque 5: Orbe Congelante
    if (boss.state === 'attack5') {
        if (boss.attackTimer === 60) { // Dispara um único orbe lento
            boss.projectiles.push({
                x: boss.x, y: boss.y + 40,
                vx: -3, vy: 0,
                size: 20, type: 'freeze_orb'
            });
        }
    }

    // Atualizar Lasers
    boss.lasers.forEach((l, i) => {
        if (l.warning) {
            l.timer--;
            if (l.timer <= 0) l.warning = false;
        }
        // Colisão Laser (bloqueado pelo escudo do jogador)
        if (!l.warning && !gameProps.isImmune && !gameProps.isPlayerShieldActive) {
            if (bird.x < l.x + l.w && bird.x + bird.width > l.x &&
                bird.y < l.y + l.h && bird.y + bird.height > l.y) {
                onCollision();
            }
        }
    });
    // Remove lasers antigos quando volta para idle
    if (boss.state === 'idle') boss.lasers = [];

    // Atualizar Projéteis
    for (let i = 0; i < boss.projectiles.length; i++) {
        let p = boss.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'wave') {
            p.t += 0.2;
            p.y = p.initialY + Math.sin(p.t) * 100;
        }

        // Player shot hitting boss
        if ((p.type === 'player_shot' || p.type === 'player_shot_red') && p.x > boss.x && p.x < boss.x + boss.width && p.y > boss.y && p.y < boss.y + boss.height) {
            const damage = p.type === 'player_shot_red' ? 50 : 25; // Dano dobrado se for vermelho
            boss.hp -= damage;
            boss.hitTimer = 10;
            boss.projectiles.splice(i, 1);
            i--;
            continue;
        }

        // Colisão Projétil
        const dx = (bird.x + bird.width/2) - p.x;
        const dy = (bird.y + bird.height/2) - p.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (p.type === 'freeze_orb' && distance < p.size + bird.width/2) {
            gameProps.isFrozen = true;
            gameProps.freezeTimer = 60; // 1 segundo
        }

        if (p.type !== 'player_shot' && !gameProps.isImmune && Math.sqrt(dx*dx + dy*dy) < p.size + bird.width/2) {
            onCollision();
        }

        if (p.x < -50 || p.y < -50 || p.y > canvas.height + 50) {
            boss.projectiles.splice(i, 1);
            i--;
        }
    }

    // --- ATAQUE ESPECIAL: RAIO VERMELHO ---
    // Condições: Noite (time < 0.25 ou > 0.75) E Chovendo
    const isNight = gameProps.timeOfDay < 0.25 || gameProps.timeOfDay > 0.75;
    if (isNight && gameProps.isRaining) {
        // 0.5% de chance de acontecer (por frame)
        if (Math.random() < 0.005) {
            boss.redLightningTimer = 15; // Duração visual do raio
            playBossRedLightning();
            
            // 0.5% de chance de acertar o player
            if (Math.random() < 0.005 && !gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                onCollision();
            }
        }
    }
}

function defeatBoss(onCollision) {
    boss.isDefeated = true;
    gameProps.didDefeatBoss = true;
    playBossDefeated();
    triggerScreenShake(20, 60);
    saveTotalCoins(500); // Victory reward
    // After a delay, end the game
    setTimeout(() => {
        gameProps.score = Math.floor(boss.survivalTimer / 60); // Score is survival time
        onCollision();
    }, 2000);
}

export function drawBoss() {
    if (!boss.active || boss.isDefeated) return;

    // Desenhar Lasers
    boss.lasers.forEach(l => {
        if (l.warning) {
            ctx.fillStyle = `rgba(255, 0, 0, 0.3)`;
            ctx.fillRect(l.x, l.y, l.w, l.h);
        } else {
            ctx.fillStyle = `rgba(255, 100, 100, 0.8)`; // Borda vermelha
            ctx.fillRect(l.x, l.y, l.w, l.h);
            ctx.fillStyle = '#FFF'; // Centro branco
            ctx.fillRect(l.x + l.w*0.2, l.y + l.h*0.2, l.w*0.6, l.h*0.6);
        }
    });

    // Desenhar Projéteis
    boss.projectiles.forEach(p => {
        if (p.type === 'freeze_orb') {
            ctx.fillStyle = '#ADD8E6'; // Light Blue
        } else {
            ctx.fillStyle = (p.type === 'player_shot' || p.type === 'player_shot_red') ? (p.type === 'player_shot_red' ? '#FF0000' : '#00FFFF') : '#FF00FF';
        }
        if (p.type === 'player_shot' || p.type === 'player_shot_red') ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = p.type === 'player_shot' ? 15 : 0;
        ctx.beginPath();
        if (p.type === 'wave') {
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        } else {
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Desenhar Raio Vermelho (Ataque Especial)
    if (boss.redLightningTimer > 0) {
        boss.redLightningTimer--;
        ctx.save();
        // Flash Vermelho na tela
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3 + 0.1})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Raio caindo (visual aleatório)
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, 0);
        ctx.lineTo(Math.random() * canvas.width, canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    // Desenhar Boss (Fantasma Gigante)
    if (boss.hitTimer > 0) {
        ctx.fillStyle = 'red';
    } else {
        ctx.fillStyle = '#FFF';
    }
    ctx.beginPath();
    ctx.arc(boss.x + 40, boss.y + 40, 40, Math.PI, 0);
    ctx.lineTo(boss.x + 80, boss.y + 100);
    ctx.lineTo(boss.x, boss.y + 100);
    ctx.fill();
    
    // Olhos do Boss
    ctx.fillStyle = '#F00';
    ctx.beginPath();
    ctx.arc(boss.x + 25, boss.y + 30, 10, 0, Math.PI * 2);
    ctx.arc(boss.x + 55, boss.y + 30, 10, 0, Math.PI * 2);
    ctx.fill();

    // Barra de Vida do Boss
    const barWidth = canvas.width - 200;
    const hpPercent = boss.hp / boss.maxHp;
    ctx.fillStyle = '#444';
    ctx.fillRect(100, 20, barWidth, 20);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(100, 20, barWidth * hpPercent, 20);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(100, 20, barWidth, 20);
}