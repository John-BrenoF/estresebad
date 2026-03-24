import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins, getTotalCoins, saveBossDefeatedCount } from './storage.js';
import { triggerScreenShake } from './main.js';
import { playBossDefeated, playBossLaser, playBossRedLightning, playExplosion, playGlitch } from './audio.js';
import { createParticles } from './particles.js';

export const boss = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    active: false,
    hp: 315,
    maxHp: 142.8,
    prevX: 0,
    prevY: 0,
    state: 'idle', // idle, attack1, attack2, attack3, attack4, attack5
    isDefeated: false,
    timer: 0,
    attackTimer: 0,
    projectiles: [],
    lasers: [], // {x, y, w, h, warning: boolean}
    frame: 0,   
    survivalTimer: 0,
    hitTimer: 0, // Para o efeito de piscar ao ser atingido
    redLightningTimer: 0, // Timer visual para o raio vermelho
    barContactTimer: 0,
    barCycleTimer: 0,
    healCheckTimer: 0,
    isHealing: false,
    healDuration: 0,
    healAmountPerFrame: 0,
    diagonalBeams: []
};

export function initBoss() {
    boss.active = true;
    boss.x = canvas.width - 120;
    boss.y = canvas.height / 2 - 40;
    boss.prevX = boss.x;
    boss.prevY = boss.y;
    boss.isDefeated = false;
    boss.state = 'idle';
    boss.hp = boss.maxHp;
    boss.timer = 60; // Tempo inicial de espera
    boss.projectiles = [];
    boss.lasers = [];
    boss.frame = 0;
    boss.survivalTimer = 0;
    boss.redLightningTimer = 0;
    boss.barContactTimer = 0;
    boss.barCycleTimer = 0;
    boss.healCheckTimer = 0;
    boss.isHealing = false;
    boss.healDuration = 0;
    boss.healAmountPerFrame = 0;
    boss.diagonalBeams = [];
}

export function updateBoss(bird, onCollision) {
    if (!boss.active || boss.isDefeated) return;

    if (boss.hp <= 0 && !boss.isDefeated) {
        defeatBoss(onCollision);
        return;
    }

    boss.frame += 0.1;
    if (boss.hitTimer > 0) boss.hitTimer--;

    boss.prevX = boss.x;
    boss.prevY = boss.y;

    // Movimento flutuante do Boss
    const centerX = canvas.width - 120;
    const centerY = canvas.height / 2 - 40;
    // Movimento horizontal e vertical mais complexo para dar mais vida
    const horizontalMovement = Math.cos(boss.frame * 0.5) * 30; // Deriva horizontal mais lenta
    const verticalMovement = Math.sin(boss.frame * 0.8) * 100 + Math.sin(boss.frame * 1.5) * 20; // Flutuação vertical mais suave

    boss.x = centerX + horizontalMovement;
    boss.y = centerY + verticalMovement;

    // Sistema de Recompensa por Sobrevivência (a cada 5s)
    if (!gameProps.isGameOver) {
        boss.survivalTimer++;
        if (boss.survivalTimer % 300 === 0) { // 300 frames ~ 5 segundos
            const reward = Math.random() > 0.5 ? 8 : 6;
            gameProps.currentCoins += reward;
            // Efeito visual de ganho de moeda (texto flutuante poderia ser adicionado aqui)
        }
    }

    // Mecânica de cura com vida baixa
    if (boss.hp / boss.maxHp < 0.25 && !boss.isHealing) {
        boss.healCheckTimer++;
        // A cada 17.5 segundos (1050 frames) cada frame equivalente a 1 segundo
        if (boss.healCheckTimer >= 1050) {
            boss.healCheckTimer = 0;
            // 45% de chance de curar
            if (Math.random() < 0.45) {
                boss.isHealing = true;
                const totalHeal = boss.maxHp * 0.08;
                const durationInFrames = 2.1 * 7; // 2.1 segundos
                boss.healDuration = durationInFrames;
                boss.healAmountPerFrame = totalHeal / durationInFrames;
            }
        }
    }

    // Aplica a cura se estiver ativa
    if (boss.isHealing) {
        if (boss.healDuration > 0) {
            boss.hp = Math.min(boss.maxHp, boss.hp + boss.healAmountPerFrame);
            boss.healDuration--;
            createParticles(boss.x + Math.random() * boss.width, boss.y + Math.random() * boss.height, '#00FF00', 2);
        } else {
            boss.isHealing = false;
        }
    }

    // Máquina de Estados do Boss
    boss.timer--;
    if (boss.timer <= 0) {
        if (boss.state === 'idle') {
            const isEnraged = boss.hp / boss.maxHp < 0.5;
            
            // 50.8% de chance de usar o ataque diagonal se estiver com pouca vida
            if (isEnraged && Math.random() < 0.508) {
                boss.state = 'attack_diagonal';
                boss.attackTimer = 0;
                boss.timer = 140; // Tempo suficiente para o aviso e o disparo
            } else {
                // Escolhe um ataque aleatório dos outros
                let attacks = ['attack1', 'attack3', 'attack4', 'attack5'];
                // Se estiver "violento", adiciona o ataque de shotgun
                if (isEnraged) {
                    attacks.push('attack6', 'attack6', 'attack6'); 
                }
                boss.state = attacks[Math.floor(Math.random() * attacks.length)];
                boss.attackTimer = 0;
                boss.timer = isEnraged ? 180 : 240; // Ataques mais rápidos quando violento
            }
        } else {
            boss.state = 'idle';
            boss.timer = 60; // Descanso (~1s)
            boss.lasers = []; // Limpa lasers
            boss.diagonalBeams = []; // Limpa faixas diagonais
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
            boss.lasers.push({ x: 0, y: yPos, w: canvas.width, h: 16, warning: true, timer: 16 });
        }
    }
    
    // Ataque 3: Esferas de Energia (Teleguiadas no início)
    if (boss.state === 'attack3') {
        if (boss.attackTimer % 40 === 0) {
            const angle = Math.atan2(bird.y - (boss.y + 40), bird.x - boss.x);
            boss.projectiles.push({
                x: boss.x, y: boss.y + 40,
                vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                size: 13, type: 'orb'
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
                x: boss.x, y: boss.y + 42,
                vx: -3, vy: 0,
                size: 23, type: 'freeze_orb'
            });
        }
    }

    // NOVO ATAQUE 6: Rajada de Projéteis (Shotgun) - Apenas quando violento
    if (boss.state === 'attack6') {
        // Dispara duas rajadas durante o ataque
        if (boss.attackTimer === 40 || boss.attackTimer === 100) {
            playExplosion(); // Reutiliza o som de explosão para impacto
            triggerScreenShake(8, 15);
            // Dispara 8 projéteis em um leque
            for (let i = 0; i < 8; i++) {
                const angle = (Math.random() - 0.5) * (Math.PI / 2.5) - Math.PI; // Leque de ~72 graus para trás
                boss.projectiles.push({
                    x: boss.x, y: boss.y + 40,
                    vx: Math.cos(angle) * (7 + Math.random() * 2), // Projéteis rápidos
                    vy: Math.sin(angle) * (7 + Math.random() * 2),
                    size: 9, type: 'orb_enraged'
                });
            }
        }
    }

    // NOVO ATAQUE: Faixa de Energia Diagonal (37.8% chance em low health)
    if (boss.state === 'attack_diagonal') {
        if (boss.attackTimer === 1) {
            // Angulo entre 28 e 34 graus
            const angleDeg = 28 + Math.random() * 6;
            // Converte para radianos (considerando a orientação da tela)
            // Usamos negativo para inverter se necessário, mas aqui vamos rotacionar o canvas
            const angle = angleDeg * Math.PI / 180;
            
            // Posição alvo próxima do player (com uma pequena variação)
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            
            boss.diagonalBeams.push({
                x: bird.x + offsetX,
                y: bird.y + offsetY,
                angle: angle,
                width: 50, // Largura da faixa
                state: 'warning',
                timer: 90, // 1.5 segundos de aviso (luz)
                maxTimer: 90
            });
            playBossLaser(); // Som de aviso
        }
    }

    // Atualizar Faixas Diagonais
    boss.diagonalBeams.forEach(b => {
        if (b.state === 'warning') {
            b.timer--;
            if (b.timer <= 0) {
                b.state = 'firing';
                b.timer = 30; // 0.5 segundos de dano ativo
                playBossRedLightning(); // Som de disparo
                triggerScreenShake(12, 20);
            }
        } else if (b.state === 'firing') {
            b.timer--;
            // Lógica de Colisão da Faixa Diagonal
            if (!gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                // Calcula a distância do centro do pássaro até a linha central da faixa
                // Usamos a fórmula da distância de ponto a linha rotacionada
                // A linha passa por (b.x, b.y) com angulo b.angle
                const dx = (bird.x + bird.width/2) - b.x;
                const dy = (bird.y + bird.height/2) - b.y;
                
                // Distância perpendicular à linha
                // Rotação inversa para achar a distância no eixo Y local da faixa
                const dist = Math.abs(dx * Math.sin(b.angle) - dy * Math.cos(b.angle));
                
                if (dist < b.width / 2) {
                    onCollision();
                }
            }
        }
    });
    // Limpeza de feixes finalizados
    for (let i = 0; i < boss.diagonalBeams.length; i++) {
        if (boss.diagonalBeams[i].state === 'firing' && boss.diagonalBeams[i].timer <= 0) {
            boss.diagonalBeams.splice(i, 1);
            i--;
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
            const damage = p.type === 'player_shot_red' ? 50.6 : 25.3; // Dano dobrado se for vermelho, aumentado em 1.2%
            boss.hp -= damage;
            boss.hitTimer = 10;
            playExplosion(); // Adiciona um som de impacto
            // Cria partículas no local do impacto
            const particleColor = p.type === 'player_shot_red' ? '#FF4500' : '#FFFFFF';
            createParticles(p.x, p.y, particleColor, 15);
            boss.projectiles.splice(i, 1);
            i--;
            continue;
        }
        
        // Colisão Projétil com jogador ou escudo
        const dx = (bird.x + bird.width/2) - p.x;
        const dy = (bird.y + bird.height/2) - p.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const birdHitboxRadius = bird.width / 2;
        const shieldHitboxRadius = 45; // Raio do escudo visual em bird.js

        if (p.type !== 'player_shot' && p.type !== 'player_shot_red') {
            // Colisão com o escudo do jogador
            if (gameProps.isPlayerShieldActive && distance < p.size + shieldHitboxRadius) {
                createParticles(p.x, p.y, '#FFFFFF', 15); // Partículas de impacto no escudo
                playExplosion(); // Som de impacto
                boss.projectiles.splice(i, 1);
                i--;
                continue; // Projétil destruído, próximo
            }

            // Colisão com o jogador (pássaro)
            if (distance < p.size + birdHitboxRadius) {
                if (p.type === 'freeze_orb' && !gameProps.isImmune) {
                    gameProps.isFrozen = true;
                    gameProps.freezeTimer = 60; // 1 segundo
                } else if (!gameProps.isImmune) {
                    onCollision();
                }
                boss.projectiles.splice(i, 1); // Remove o projétil após a colisão
                i--;
                continue;
            }
        }

        if (p.x < -50 || p.y < -50 || p.y > canvas.height + 50) {
            boss.projectiles.splice(i, 1);
            i--;
        }
    }

    // --- ATAQUE ESPECIAL: RAIO VERMELHO ---
    // Condições: Noite (time < 0.25 ou > 0.75) E Chovendo
    const isNight = gameProps.timeOfDay < 0.30 || gameProps.timeOfDay > 0.75;
    if (isNight && gameProps.isRaining) {
        // 0.5% de chance de acontecer (por frame)
        if (Math.random() < 0.010) {
            boss.redLightningTimer = 15; // Duração visual do raio
            playBossRedLightning();
            
            // 0.5% de chance de acertar o player
            if (Math.random() < 0.009 && !gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                onCollision();
            }
        }
    }

    // Atualização do ciclo da Barra de Vida (Mortal vs Segura)
    // 5.4s segura (324 frames) + 3s mortal (180 frames)
    boss.barCycleTimer++;
    if (boss.barCycleTimer > 504) boss.barCycleTimer = 0;
    const isBarDeadly = boss.barCycleTimer > 324;

    // Colisão com a Barra de Vida (Hazard)
    // Hitbox reduzida: 2px de cada lado (x+2, y+2, w-4, h-4)
    const barRect = { x: 22, y: 22, w: canvas.width - 34, h: 16 };
    if (bird.x < barRect.x + barRect.w && bird.x + bird.width > barRect.x &&
        bird.y < barRect.y + barRect.h && bird.y + bird.height > barRect.y) {
        
        if (isBarDeadly && !gameProps.isImmune) {
            onCollision();
        }
    }
}

function defeatBoss(onCollision) {
    boss.isDefeated = true;
    gameProps.didDefeatBoss = true;
    playBossDefeated();
    triggerScreenShake(20, 60);
    saveTotalCoins(500); // Victory reward
    gameProps.normalBossDefeatedCount++;
    saveBossDefeatedCount(gameProps.normalBossDefeatedCount);
    // After a delay, end the game
    setTimeout(() => {
        gameProps.score = Math.floor(boss.survivalTimer / 60); // Score is survival time
        onCollision();
    }, 2000);
}

export function drawBoss() {
    if (!boss.active || boss.isDefeated) return;

    const isEnraged = boss.hp / boss.maxHp < 0.3; // Boss fica "violento" com menos de 30% de vida

    // Desenhar Lasers
    boss.lasers.forEach(l => {
        if (l.warning) {
            ctx.fillStyle = `red`;
            ctx.fillRect(l.x, l.y, l.w, l.h);
        } else {
            ctx.fillStyle = `red`; // Borda vermelha
            ctx.fillRect(l.x, l.y, l.w, l.h);
            ctx.fillStyle = 'red'; // Centro branco
            ctx.fillRect(l.x + l.w*0.2, l.y + l.h*0.2, l.w*0.6, l.h*0.6);
        }
    });

    // Desenhar Faixas Diagonais
    boss.diagonalBeams.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle); // Rotaciona entre 28 e 34 graus
        
        const longLen = canvas.height * 3; // Comprimento para cobrir a tela toda
        
        if (b.state === 'warning') {
            // Efeito de Luz -> Vermelho Brilhante
            const progress = 1 - (b.timer / b.maxTimer);
            const alpha = 0.2 + 0.5 * progress;
            
            // Interpolação de cor: Branco/Luz (início) -> Vermelho Brilhante (fim)
            const g = Math.floor(255 - 200 * progress);
            const blue = Math.floor(255 - 200 * progress);
            
            ctx.fillStyle = `rgba(255, ${g}, ${blue}, ${alpha})`;
            ctx.fillRect(-longLen/2, -b.width/2, longLen, b.width);
            
            // Bordas de aviso
            ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(-longLen/2, -b.width/2, longLen, b.width);
            
        } else if (b.state === 'firing') {
            // Faixa externa (Vermelho Brilhante)
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 40;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.69)';
            ctx.fillRect(-longLen/2, -b.width/2, longLen, b.width);
            
            // Faixa interna (Vermelho Escuro "Raio")
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#a80e0e'; // Vermelho escuro sangue
            const innerWidth = b.width * 0.4;
            ctx.fillRect(-longLen/2, -innerWidth/2, longLen, innerWidth);
            
            // Efeito de raio zigue-zague dentro
            ctx.strokeStyle = '#fb8282';
            ctx.lineWidth = 3;
            ctx.beginPath();
            let lx = -longLen/2;
            ctx.moveTo(lx, 0);
            while (lx < longLen/2) {
                lx += Math.random() * 40 + 10;
                ctx.lineTo(lx, (Math.random() - 0.5) * innerWidth);
            }
            ctx.stroke();
        }
        
        ctx.restore();
    });

    // Desenhar Projéteis
    boss.projectiles.forEach(p => {
        if (p.type === 'freeze_orb') {
            ctx.fillStyle = '#ADD8E6'; // Light Blue
        } else if (p.type === 'orb_enraged') {
            ctx.fillStyle = '#FF3300'; // Vermelho-Laranja intenso
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
    let bossColor = '#000';
    if (boss.hitTimer > 0) {
        bossColor = 'red';
    } else if (isEnraged) {
        // Cor pulsante entre branco e um vermelho claro quando violento
        const phase = Math.sin(boss.frame * 1); // Pulsação mais rápida
        const r = 255;
        const g = 255 - (155 * (1 + phase) / 2); // 255 -> 100
        const b = 255 - (195 * (1 + phase) / 2); // 255 -> 100
        bossColor = `rgb(${r},${g},${b})`;
    }
    ctx.fillStyle = bossColor;

    if (boss.isHealing) {
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 30;
    } else if (isEnraged) {
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 25;
    } else {
        // Efeito de aura/fumaça fantasmagórica pulsante (Melhorado)
        const auraPulse = 0.5 + (Math.sin(boss.frame * 0.5) + 1) / 2; // Pulsação mais ampla e sinistra
        ctx.shadowColor = `rgba(0, 0, 0, ${0.8 * auraPulse})`; // Aura negra corrigida e mais forte
        ctx.shadowBlur = 20 + 20 * auraPulse; // Blur maior para destacar o boss
    }

    ctx.beginPath();
    // Cabeça
    ctx.arc(boss.x + 40, boss.y + 40, 40, Math.PI, 0); // Topo arredondado

    // Corpo e base ondulada com animação de tecido fluida
    const bottomY = boss.y + 120;
    const segments = 120; // Mais segmentos para uma curva mais suave
    const waveSpeed = isEnraged ? 4.8 : 2.4;
    const waveAmplitude = isEnraged ? 24 : 16;
    const vx = boss.x - boss.prevX;
    const vy = boss.y - boss.prevY;

    const points = [];
    for (let i = 0; i <= segments; i++) {
        const percent = i / segments; // 0 = direita, 1 = esquerda
        const currentX = boss.x + boss.width * (1 - percent);

        // Ondulação base com senos combinados para um efeito mais caótico e orgânico
        const wave1 = Math.sin(boss.frame * waveSpeed + i * 0.5) * waveAmplitude * (0.3 + (1 - percent) * 0.4);
        const wave2 = Math.sin(boss.frame * waveSpeed * 0.4 + i * 0.5) * (waveAmplitude * 0.7);
        const wave3 = Math.cos(boss.frame * waveSpeed * 1.2 + i * 0.4) * (waveAmplitude * 0.5);

        // Fator de arrasto (drag) - mais forte no meio, zero nas pontas
        const dragFactor = Math.sin(percent * Math.PI);
        // Arrasto vertical: se o boss desce (vy > 0), o tecido sobe (offset Y negativo)
        const verticalDrag = -vy * 3 * dragFactor; // Reduzido para tornar mais suave
        // Arrasto horizontal: simula a inércia do tecido para os lados
        const horizontalDrag = -vx * 5 * dragFactor;

        const currentY = bottomY + wave1 + wave2 + wave3 + verticalDrag;
        points.push({ x: currentX + horizontalDrag, y: currentY });
    }

    // Lado direito do corpo
    ctx.lineTo(boss.x + boss.width, bottomY);
    ctx.lineTo(points[0].x, points[0].y); // Conecta ao primeiro ponto da base
    for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);

    ctx.closePath(); // Fecha o caminho de volta ao início do arco (lado esquerdo da cabeça)

    // Efeito de Glitch ocasional
    if (Math.random() < 0.09 && !gameProps.isGameOver) {
        playGlitch();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Canal Magenta
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        ctx.fill(); // Preenche o caminho atual
        ctx.restore();

        // Canal Ciano
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        ctx.fill(); // Preenche o caminho atual novamente

        ctx.restore();
    } else {
        ctx.fill(); // O preenchimento principal
    }
    ctx.shadowBlur = 0; // Resetar sombra

    // Olhos do Boss
    const eyeSizeBase = isEnraged ? 14 : 10;
    const eyePulseSpeed = isEnraged ? 5 : 2;
    const eyePulseAmplitude = isEnraged ? 4 : 2;
    const eyeSize = eyeSizeBase + Math.sin(boss.frame * eyePulseSpeed) * eyePulseAmplitude; // Animação de pulsar mais agressiva
    ctx.fillStyle = isEnraged ? '#FF4500' : '#F00';
    ctx.beginPath();
    ctx.arc(boss.x + 25, boss.y + 30, eyeSize, 0, Math.PI * 2);
    ctx.arc(boss.x + 55, boss.y + 30, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Barra de Vida do Boss
    const barX = 20;
    const barWidth = canvas.width - 40; // Barra mais longa
    const hpPercent = boss.hp / boss.maxHp;

    if (boss.isHealing) {
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 40;
    }

    ctx.fillStyle = '#444';
    ctx.fillRect(barX, 20, barWidth, 20);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(barX, 20, barWidth * hpPercent, 20);

    // Visualização do estado Mortal da barra
    const isBarDeadly = boss.barCycleTimer > 324;
    if (isBarDeadly) {
        // Pisca Vermelho/Amarelo quando mortal para alertar o jogador
        const blink = Math.floor(Date.now() / 100) % 2 === 0;
        ctx.strokeStyle = blink ? '#FF0000' : '#FFFF00';
        ctx.lineWidth = 3;
    } else {
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
    }
    ctx.strokeRect(barX, 20, barWidth, 20);
    ctx.shadowBlur = 0;
}