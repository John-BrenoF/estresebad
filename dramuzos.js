import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins } from './storage.js';
import { triggerScreenShake } from './main.js';
import { playBossDefeated, playSoundWave, playExplosion, playGlitch, playBossLaser } from './audio.js';
import { createParticles } from './particles.js';

export const dramuzos = {
    x: 0,
    y: 0,
    width: 90, // Reduzido (era 120)
    height: 80, // Reduzido (era 100)
    active: false,
    hp: 400,
    maxHp: 408,
    state: 'idle',
    isDefeated: false,
    timer: 0,
    attackTimer: 0,
    frame: 0,
    projectiles: [], // Usado para as ondas sonoras
    bloodLightnings: [], // Novo array para os raios de sangue
    invertAttackCheckTimer: 0,
    tookDamageSinceLastInvertCheck: false,
    lasers: [],
    breathParticles: [] // Partículas do Bafo da Morte
};

export function initDramuzos() {
    dramuzos.active = true;
    dramuzos.x = canvas.width - 150;
    dramuzos.y = canvas.height / 2 - 50;
    dramuzos.isDefeated = false;
    dramuzos.state = 'idle';
    dramuzos.hp = dramuzos.maxHp;
    dramuzos.timer = 60;
    dramuzos.attackTimer = 0;
    dramuzos.frame = 0;
    dramuzos.projectiles = [];
    dramuzos.bloodLightnings = [];
    dramuzos.invertAttackCheckTimer = 0;
    dramuzos.tookDamageSinceLastInvertCheck = false;
    dramuzos.lasers = [];
    dramuzos.breathParticles = [];
}

export function updateDramuzos(bird, onCollision) {
    if (!dramuzos.active || dramuzos.isDefeated) return;

    if (dramuzos.hp <= 0 && !dramuzos.isDefeated) {
        defeatDramuzos(onCollision);
        return;
    }

    dramuzos.frame += 0.05;

    // Movimento Pesado e Flutuante
    const centerY = canvas.height / 2 - 50;
    dramuzos.y = centerY + Math.sin(dramuzos.frame) * 120; // Amplitude vertical grande

    // Máquina de Estados
    dramuzos.timer--;
    if (dramuzos.timer <= 0) {
        if (dramuzos.state === 'idle') {
            // 10% de chance de usar o ataque teleguiado
            if (Math.random() < 0.10) {
                dramuzos.state = 'attack_homing';
                dramuzos.attackTimer = 0;
                dramuzos.timer = 180; // 3 segundos
            } else {
                // Escolhe um ataque aleatório dos outros
                const attacks = ['attack_soundwave', 'attack_laser', 'attack_breath'];
                dramuzos.state = attacks[Math.floor(Math.random() * attacks.length)];
                dramuzos.attackTimer = 0;
                
                if (dramuzos.state === 'attack_soundwave') {
                    dramuzos.timer = 300; // Duração do ataque de onda (5s)
                } else if (dramuzos.state === 'attack_laser') {
                    dramuzos.timer = 240; // Duração do ataque de laser (4s)
                } else if (dramuzos.state === 'attack_breath') {
                    dramuzos.timer = 180; // Reduzido duração pois é tiro único
                }
            }
        } else {
            dramuzos.state = 'idle';
            dramuzos.timer = 90; // Descanso de 1.5s
            dramuzos.lasers = []; // Limpa os lasers ao final do ataque
        }
    }

    // --- Ataque de Inverter Controles ---
    dramuzos.invertAttackCheckTimer++;
    // A cada 10 segundos (600 frames)
    if (dramuzos.invertAttackCheckTimer >= 600) {
        dramuzos.invertAttackCheckTimer = 0;
        // 15% de chance se tomou dano nesse intervalo
        if (dramuzos.tookDamageSinceLastInvertCheck && Math.random() < 0.15) {
            gameProps.areControlsInverted = true;
            gameProps.invertControlsTimer = 180; // 3 segundos
            playGlitch(); // Som de confusão
            createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FF00FF', 30);
        }
        dramuzos.tookDamageSinceLastInvertCheck = false; // Reseta para o próximo ciclo
    }

    // Lógica do Ataque de Onda Sonora
    if (dramuzos.state === 'attack_soundwave') {
        dramuzos.attackTimer++;
        // Dispara uma onda a cada 150 frames (2.5 segundos) - Mais lento para dar tempo de desviar
        if (dramuzos.attackTimer % 150 === 0) {
            playSoundWave();
            triggerScreenShake(5, 10);
            dramuzos.projectiles.push({
                type: 'soundwave', // Identificador importante
                x: dramuzos.x + dramuzos.width / 2, // Sai do centro do boss
                y: dramuzos.y + dramuzos.height / 2,
                radius: 10,
                maxRadius: (canvas.width * 1.5) * 0.47, // Reduzido para 47% do tamanho original
                speed: 6,
                width: 15 // Espessura da onda
            });
        }
    }

    // NOVO: Ataque de Feixe de Luz (Laser)
    if (dramuzos.state === 'attack_laser') {
        dramuzos.attackTimer++;
        // Dispara 3 lasers durante o ataque
        if (dramuzos.attackTimer % 70 === 0 && dramuzos.attackTimer < 220) {
            const yPos = Math.random() * (canvas.height - 50);
            triggerScreenShake(4, 15);
            playBossLaser();
            dramuzos.lasers.push({ 
                x: 0, 
                y: yPos, 
                w: canvas.width, 
                h: 16, 
                warning: true, 
                timer: 14 // 10% mais rápido que o do boss normal (16 -> ~14)
            });
        }
    }

    // NOVO: Ataque Bafo da Morte (Breath of Death)
    if (dramuzos.state === 'attack_breath') {
        dramuzos.attackTimer++;
        
        // ALTERADO: Rajada única direcional (Shotgun de fumaça) ao invés de contínuo
        if (dramuzos.attackTimer === 30) {
            // Origem na "boca" do boss
            const startX = dramuzos.x + 20;
            const startY = dramuzos.y + 50;
            
            // Calcula ângulo em direção ao player com leve dispersão
            const dx = (bird.x + bird.width/2) - startX;
            const dy = (bird.y + bird.height/2) - startY;
            const baseAngle = Math.atan2(dy, dx);

            // Dispara 15 partículas de uma vez (rajada)
            for (let i = 0; i < 15; i++) {
                const angle = baseAngle + (Math.random() - 0.5) * 0.5; // Dispersão em cone
                dramuzos.breathParticles.push({
                    x: startX,
                    y: startY,
                    vx: Math.cos(angle) * (6 + Math.random() * 3), // Mais rápido
                    vy: Math.sin(angle) * (6 + Math.random() * 3),
                    life: 1.0, // Vida cheia (100%)
                    maxLife: 1.0,
                    size: 12 + Math.random() * 8
                });
            }
            playBossLaser(); // Som de disparo
        }
    }

    // NOVO: Ataque Teleguiado (Homing) - 10% chance
    if (dramuzos.state === 'attack_homing') {
        dramuzos.attackTimer++;
        // Dispara 2 orbes teleguiados
        if (dramuzos.attackTimer === 30 || dramuzos.attackTimer === 80) {
            const angle = Math.atan2((bird.y + bird.height/2) - (dramuzos.y + 40), (bird.x + bird.width/2) - dramuzos.x);
            dramuzos.projectiles.push({
                x: dramuzos.x, 
                y: dramuzos.y + 40,
                vx: Math.cos(angle) * 5, 
                vy: Math.sin(angle) * 5,
                size: 14, 
                type: 'homing_orb' // Tipo novo
            });
            playBossLaser();
        }
    }

    // --- Lógica do Raio de Sangue (Blood Lightning) ---
    // 12% de chance a cada 40 frames (1 segundo)
    if (gameProps.frames % 40 === 0 && Math.random() < 0.12) {
        // Definição do ângulo: Diagonal subindo para direita / descendo para esquerda
        const angleDeg = -45; 
        const angleRad = angleDeg * (Math.PI / 180);

        dramuzos.bloodLightnings.push({
            x: bird.x + bird.width / 2, // Mira no player
            y: bird.y + bird.height / 2,
            angle: angleRad,
            width: 40,
            timer: 45, // Tempo de aviso (warning)
            phase: 'warning',
            active: true
        });
    }

    // Atualizar Raios de Sangue
    for (let i = 0; i < dramuzos.bloodLightnings.length; i++) {
        let b = dramuzos.bloodLightnings[i];
        b.timer--;

        if (b.phase === 'warning') {
            if (b.timer <= 0) {
                b.phase = 'strike';
                b.timer = 15; // Duração do raio ativo
                triggerScreenShake(10, 10);
                // Som de trovão (reutilizando existente ou novo se houver)
            }
        } else if (b.phase === 'strike') {
            // Verifica colisão apenas no primeiro frame do strike ou durante todo ele?
            // Vamos verificar enquanto estiver ativo, mas processar o efeito apenas uma vez
            if (b.active && !gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                // Lógica de colisão de linha rotacionada simplificada (Check proximo ao centro)
                // Como o raio é desenhado centrado em b.x, b.y com rotação:
                const dx = (bird.x + bird.width/2) - b.x;
                const dy = (bird.y + bird.height/2) - b.y;
                // Rotaciona o ponto do pássaro para o sistema de coordenadas do raio
                const rotX = dx * Math.cos(-b.angle) - dy * Math.sin(-b.angle);
                const rotY = dx * Math.sin(-b.angle) + dy * Math.cos(-b.angle);
                
                // Verifica se está dentro da largura do raio (eixo Y local pós rotação, pois raio é desenhado no eixo X ou Y dependendo da implementação)
                // Aqui assumimos desenhar uma linha longa cruzando o ponto (b.x, b.y)
                // Distância perpendicular à linha
                const dist = Math.abs(dx * Math.sin(b.angle) - dy * Math.cos(b.angle)); // Distância ponto-reta
                
                if (dist < b.width / 2) {
                    b.active = false; // Já atingiu, não atinge de novo no mesmo raio
                    const chance = Math.random();
                    
                    if (chance < 0.46) { // 46% Morre
                        onCollision();
                    } else if (chance < 0.50) { // 10% Regenera Boss (0.40 a 0.50)
                        const missingHp = dramuzos.maxHp - dramuzos.hp;
                        dramuzos.hp += missingHp * 0.15;
                        createParticles(dramuzos.x + dramuzos.width/2, dramuzos.y + dramuzos.height/2, '#00FF00', 20);
                    } 
                    // 50% Sobrevive (Nada acontece, além do susto)
                }
            }
            
            if (b.timer <= 0) {
                dramuzos.bloodLightnings.splice(i, 1);
                i--;
            }
        }
    }

    // NOVO: Atualizar Lasers
    dramuzos.lasers.forEach((l) => {
        if (l.warning) {
            l.timer--;
            if (l.timer <= 0) l.warning = false;
        }
        // Colisão Laser
        if (!l.warning && !gameProps.isImmune && !gameProps.isPlayerShieldActive) {
            if (bird.x < l.x + l.w && bird.x + bird.width > l.x &&
                bird.y < l.y + l.h && bird.y + bird.height > l.y) {
                onCollision();
            }
        }
    });

    // NOVO: Atualizar Partículas do Bafo da Morte
    for (let i = 0; i < dramuzos.breathParticles.length; i++) {
        let b = dramuzos.breathParticles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.size += 0.3; // Fumaça expande
        b.life -= 0.015; // Fumaça desaparece gradualmente

        // Colisão com o Player
        const dx = (bird.x + bird.width/2) - b.x;
        const dy = (bird.y + bird.height/2) - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < b.size + bird.width/2) {
            if (!gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                // Lógica de Letalidade baseada na "vida" da fumaça
                // Quanto mais some (menor life), menor a chance de matar
                // Perde 10% a cada vez enfraquecida (proporcional ao life)
                const killChance = b.life; 

                if (Math.random() < killChance) {
                    onCollision();
                } else {
                    // Sobreviveu (efeito visual de tosse/fumaça)
                    createParticles(bird.x, bird.y, '#555', 2);
                }
            }
            // Remove partícula após colisão para não hitar múltiplos frames seguidos
            b.life = 0; 
        }

        if (b.life <= 0) {
            dramuzos.breathParticles.splice(i, 1);
            i--;
        }
    }

    // Atualizar Projéteis (Ondas Sonoras)
    for (let i = 0; i < dramuzos.projectiles.length; i++) {
        let p = dramuzos.projectiles[i];
        
        if (p.type === 'soundwave') {
            p.radius += p.speed;
            
            // Colisão "WiFi" (Cone direcionado para a esquerda)
            const dx = (bird.x + bird.width/2) - p.x;
            const dy = (bird.y + bird.height/2) - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Calcula o ângulo entre o centro da onda e o pássaro
            const angle = Math.atan2(dy, dx);
            
            // Verifica se o ângulo está dentro do cone do "WiFi" REDUZIDO (60% do tamanho original)
            // Antes era 0.85 PI (54 graus). Agora usamos 0.90 PI (aprox 36 graus) para ser mais fácil.
            // Isso fecha o leque, exigindo menos movimento vertical para esquivar
            const inCone = Math.abs(angle) > (Math.PI * 0.90);

            // Se a distância estiver na faixa da onda E estiver dentro do ângulo do cone
            if (dist >= p.radius - p.width && dist <= p.radius + p.width && inCone) {
                if (!gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                    // Chance de matar diminui com a distância (conforme a onda some)
                    const progress = p.radius / p.maxRadius; // 0.0 a 1.0
                    const killChance = 1.0 - (progress * 0.20); // Chance de 100% no início, 80% no fim

                    if (Math.random() < killChance) {
                        onCollision();
                    } else {
                        // Sobreviveu ao hit, apenas um efeito visual de "raspão"
                        createParticles(bird.x + bird.width/2, bird.y + bird.height/2, '#FFFFFF', 5);
                    }
                }
            }

            if (p.radius > p.maxRadius) {
                dramuzos.projectiles.splice(i, 1);
                i--;
            }
            continue;
        }
        
        // Lógica para Orbes Teleguiados (Homing Orb)
        if (p.type === 'homing_orb') {
            p.x += p.vx;
            p.y += p.vy;
            
            // Colisão simples circular
            const dx = (bird.x + bird.width/2) - p.x;
            const dy = (bird.y + bird.height/2) - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < p.size + bird.width/2) {
                 if (!gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                     onCollision();
                 }
                 dramuzos.projectiles.splice(i, 1);
                 i--;
            }
            
            // Remove se sair da tela
            if (p.x < -50 || p.y < -50 || p.y > canvas.height + 50 || p.x > canvas.width + 50) {
                 dramuzos.projectiles.splice(i, 1);
                 i--;
            }
            continue;
        }

        // Colisão do tiro do jogador com o Dramuzos (Adicionado para funcionar a batalha)
        if ((p.type === 'player_shot' || p.type === 'player_shot_red') && p.x > dramuzos.x && p.x < dramuzos.x + dramuzos.width && p.y > dramuzos.y && p.y < dramuzos.y + dramuzos.height) {
            const damage = p.type === 'player_shot_red' ? 40 : 20; // Dano base
            dramuzos.hp -= damage;
            dramuzos.tookDamageSinceLastInvertCheck = true; // Flag para o ataque de inversão
            playExplosion();
            const particleColor = p.type === 'player_shot_red' ? '#FF4500' : '#FFFFFF';
            createParticles(p.x, p.y, particleColor, 15);
            dramuzos.projectiles.splice(i, 1);
            i--;
            continue;
        } else if (p.type === 'player_shot' || p.type === 'player_shot_red') {
             // Move o tiro do jogador
             p.x += p.vx;
             p.y += p.vy;
             
             // Remove se sair da tela
             if (p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                 dramuzos.projectiles.splice(i, 1);
                 i--;
             }
        }
    }
}

function defeatDramuzos(onCollision) {
    dramuzos.isDefeated = true;
    gameProps.didDefeatBoss = true; // Conta como boss derrotado para missões
    playBossDefeated();
    triggerScreenShake(30, 100);
    saveTotalCoins(2000); // Recompensa maior
    setTimeout(() => {
        gameProps.score += 500;
        onCollision();
    }, 3000);
}

export function drawDramuzos() {
    if (!dramuzos.active || dramuzos.isDefeated) return;

    // Desenhar Raios de Sangue
    dramuzos.bloodLightnings.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        const length = canvas.height * 2; // Comprimento para sair da tela

        if (b.phase === 'warning') {
            // Linha fina de aviso
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.random() * 0.2})`;
            ctx.fillRect(-length/2, -2, length, 4);
        } else if (b.phase === 'strike') {
            // Raio Principal
            // Animação: Varia a largura e o blur para dar efeito de pulsação elétrica
            const pulse = Math.random() * 10;
            const currentWidth = b.width + pulse;
            
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 30 + Math.random() * 20;
            ctx.fillStyle = '#8B0000'; // Vermelho Sangue
            ctx.fillRect(-length/2, -currentWidth/2, length, currentWidth);
            
            // Núcleo interno instável
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(-length/2, -currentWidth/4, length, currentWidth/2);
            
            ctx.shadowBlur = 0;

            // Efeito de Eletricidade/Raio interno (Zigue-Zague)
            ctx.strokeStyle = '#FFC0CB'; // Rosado brilhante
            ctx.lineWidth = 2;
            ctx.beginPath();
            let lx = -length/2;
            ctx.moveTo(lx, 0);
            while (lx < length/2) {
                lx += Math.random() * 30 + 10; // Avança
                ctx.lineTo(lx, (Math.random() - 0.5) * currentWidth); // Varia na vertical local
            }
            ctx.stroke();
        }

        ctx.restore();
    });

    // NOVO: Desenhar Lasers
    dramuzos.lasers.forEach(l => {
        if (l.warning) {
            // Efeito de aviso piscando
            const alpha = l.timer % 10 < 5 ? 0.5 : 0.9;
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.fillRect(l.x, l.y, l.w, l.h);
        } else {
            // Feixe de luz vermelho sólido
            ctx.fillStyle = `#FF0000`; // Borda vermelha
            ctx.fillRect(l.x, l.y, l.w, l.h);
            ctx.fillStyle = '#FF8888'; // Centro rosa/vermelho claro
            ctx.fillRect(l.x, l.y + l.h * 0.2, l.w, l.h * 0.6);
        }
    });

    // NOVO: Desenhar Bafo da Morte
    dramuzos.breathParticles.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life; // Opacidade baseada na vida
        // Cor oscila entre verde tóxico e cinza escuro
        const isToxic = Math.random() > 0.5;
        ctx.fillStyle = isToxic ? '#32CD32' : '#2F4F4F';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Desenhar Ondas Sonoras
    dramuzos.projectiles.forEach(p => {
        if (p.type === 'soundwave') {
        ctx.save();
        ctx.beginPath();
            // Desenha apenas o arco do "WiFi" ainda mais reduzido (36 graus)
            ctx.arc(p.x, p.y, p.radius, Math.PI * 0.90, Math.PI * 1.10);
        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - (p.radius / p.maxRadius)})`; // Cyan fade out
        ctx.lineWidth = p.width;
        ctx.stroke();
        ctx.restore();
        } else if (p.type === 'homing_orb') {
            // Desenho do Orbe Teleguiado (Roxo/Negro)
            ctx.beginPath();
            ctx.fillStyle = '#4B0082'; // Indigo
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (p.type === 'player_shot' || p.type === 'player_shot_red') {
            // Desenha os tiros do jogador corretamente
            ctx.beginPath();
            ctx.fillStyle = p.type === 'player_shot_red' ? '#FF0000' : '#00FFFF';
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

        // Desenhar Dramuzos (Boss Morcego)
ctx.save();

// Sistema de ativação do glitch
if (Math.random() < 0.005 && dramuzos.glitchTimer <= 0) {
    dramuzos.glitchTimer = 180; // duração ~3 segundos
}

// Variáveis do glitch
let glitchOffsetX = 0;
let glitchOffsetY = 0;
let glitchActive = dramuzos.glitchTimer > 0;

// Aplica tremor quando glitch ativo
if (glitchActive) {
    glitchOffsetX = (Math.random() - 0.5) * 20;
    glitchOffsetY = (Math.random() - 0.5) * 20;
    dramuzos.glitchTimer--;
}

// Centraliza o boss + deslocamento do glitch
ctx.translate(
    dramuzos.x + dramuzos.width / 2 + glitchOffsetX,
    dramuzos.y + dramuzos.height / 2 + glitchOffsetY
);

// Animações naturais
const wingY = Math.sin(dramuzos.frame * 0.35) * 40;
const wingCurve = Math.sin(dramuzos.frame * 0.2) * 20;
const bodyBreath = Math.sin(dramuzos.frame * 0.1) * 3;

// Cor base (preto profundo com glow)
ctx.fillStyle = '#000000';
ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
ctx.shadowBlur = 30;

// Asas
ctx.beginPath();

// Asa esquerda
ctx.moveTo(-20, 0);
ctx.quadraticCurveTo(-90, wingY - 90 + wingCurve, -180, wingY - 20);
ctx.lineTo(-150, wingY);
ctx.quadraticCurveTo(-120, wingY + 60, -80, wingY + 40);
ctx.lineTo(-50, wingY + 55);
ctx.quadraticCurveTo(-40, wingY + 30, -20, 20);

// Asa direita
ctx.moveTo(20, 0);
ctx.quadraticCurveTo(90, wingY - 90 + wingCurve, 180, wingY - 20);
ctx.lineTo(150, wingY);
ctx.quadraticCurveTo(120, wingY + 60, 80, wingY + 40);
ctx.lineTo(50, wingY + 55);
ctx.quadraticCurveTo(40, wingY + 30, 20, 20);

ctx.fill();

// Corpo com leve respiração
ctx.shadowBlur = 25;
ctx.fillStyle = '#010101';
ctx.beginPath();
ctx.ellipse(0, bodyBreath, 40, 50 + bodyBreath, 0, 0, Math.PI * 2);
ctx.fill();

// Orelhas
ctx.beginPath();
ctx.moveTo(-20, -40);
ctx.lineTo(-10, -70);
ctx.lineTo(0, -40);

ctx.moveTo(20, -40);
ctx.lineTo(10, -70);
ctx.lineTo(0, -40);
ctx.fill();

// Olhos vermelhos com brilho
ctx.fillStyle = '#ff0000';
ctx.shadowColor = 'rgba(255, 0, 0, 0.9)';
ctx.shadowBlur = 25;

ctx.beginPath();
ctx.arc(-15, -10, 8, 0, Math.PI * 2);
ctx.arc(15, -10, 8, 0, Math.PI * 2);
ctx.fill();

ctx.shadowBlur = 0;

// Boca / dentes
ctx.fillStyle = '#FFF';
ctx.beginPath();
ctx.moveTo(-10, 10); ctx.lineTo(-5, 25); ctx.lineTo(0, 10);
ctx.moveTo(0, 10); ctx.lineTo(5, 25); ctx.lineTo(10, 10);
ctx.fill();

// Fumaça sutil nos cantos
ctx.fillStyle = 'rgba(30, 30, 30, 0.25)';
for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const x = Math.cos(angle) * 50;
    const y = Math.sin(angle) * 50 + bodyBreath;

    ctx.beginPath();
    ctx.arc(
        x + Math.sin(dramuzos.frame * 0.2 + i) * 5,
        y + Math.cos(dramuzos.frame * 0.2 + i) * 5,
        8 + Math.sin(dramuzos.frame * 0.3 + i) * 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Glitch visual baseado na própria silhueta
if (glitchActive) {

    // Eco da imagem (duplicação leve)
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3; i++) {
        let offsetX = (Math.random() - 0.5) * 25;
        let offsetY = (Math.random() - 0.5) * 25;

        ctx.drawImage(
            canvas,
            dramuzos.x,
            dramuzos.y,
            dramuzos.width,
            dramuzos.height,
            dramuzos.x + offsetX,
            dramuzos.y + offsetY,
            dramuzos.width,
            dramuzos.height
        );
    }
    ctx.globalAlpha = 1;

    // Rasgo horizontal (efeito bug de render)
    for (let i = 0; i < 4; i++) {
        let y = (Math.random() - 0.5) * dramuzos.height;
        let h = Math.random() * 8 + 3;
        let shift = (Math.random() - 0.5) * 50;

        ctx.drawImage(
            canvas,
            dramuzos.x,
            dramuzos.y + y,
            dramuzos.width,
            h,
            dramuzos.x + shift,
            dramuzos.y + y,
            dramuzos.width,
            h
        );
    }

    // leve falha de opacidade
    ctx.globalAlpha = 0.85 + Math.random() * 0.15;
}

ctx.restore();
    
    
   // ================= SISTEMA DE SANGRAMENTO NATURAL =================
if (!dramuzos.bleed) {
    dramuzos.bleed = {
        active: false,
        timer: 0,
        duration: 4500,
        nextCheck: 0,
        drips: []
    };
}

const now = Date.now();

// Checagem a cada 5s
if (now > dramuzos.bleed.nextCheck) {
    dramuzos.bleed.nextCheck = now + 5000;
    
    if (Math.random() < 0.3) {
        dramuzos.bleed.active = true;
        dramuzos.bleed.timer = now;
        
        // cria pontos fixos de sangramento (tipo "cortes")
        dramuzos.bleed.drips = [];
        const count = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < count; i++) {
            dramuzos.bleed.drips.push({
                x: Math.random(), // posição relativa (0 a 1)
                length: 0,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }
}

// Desativa
if (dramuzos.bleed.active && now - dramuzos.bleed.timer > dramuzos.bleed.duration) {
    dramuzos.bleed.active = false;
}


// ================= BARRA DE VIDA =================
const barX = 20;
const barWidth = canvas.width - 40;
const barY = 20;
const barHeight = 20;

// Fundo
ctx.fillStyle = '#0b0b0b';
ctx.fillRect(barX, barY, barWidth, barHeight);

// Gradiente fundo
const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
bgGradient.addColorStop(0, '#1a1a1a');
bgGradient.addColorStop(1, '#000');
ctx.fillStyle = bgGradient;
ctx.fillRect(barX, barY, barWidth, barHeight);

// Vida
const hpRatio = dramuzos.hp / dramuzos.maxHp;

const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
hpGradient.addColorStop(0, '#2a0000');
hpGradient.addColorStop(0.6, '#8B0000');
hpGradient.addColorStop(1, '#ff1a1a');

ctx.fillStyle = hpGradient;
ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

// brilho leve
ctx.globalAlpha = 0.12;
ctx.fillStyle = '#fff';
ctx.fillRect(barX, barY, barWidth * hpRatio, 3);
ctx.globalAlpha = 1;


// ================= BORDAS GÓTICAS MINIMALISTAS =================

// sombra externa (profundidade)
ctx.shadowColor = 'rgba(0,0,0,0.7)';
ctx.shadowBlur = 6;

// moldura principal
ctx.lineWidth = 2;
ctx.strokeStyle = '#3a3a3a';
ctx.strokeRect(barX, barY, barWidth, barHeight);

// linha interna fina (detalhe elegante)
ctx.shadowBlur = 0;
ctx.lineWidth = 1;
ctx.strokeStyle = '#000';
ctx.strokeRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);

// detalhe superior (linha quase imperceptível)
ctx.strokeStyle = '#222';
ctx.beginPath();
ctx.moveTo(barX, barY);
ctx.lineTo(barX + barWidth, barY);
ctx.stroke();

// detalhe inferior (peso visual)
ctx.strokeStyle = '#111';
ctx.beginPath();
ctx.moveTo(barX, barY + barHeight);
ctx.lineTo(barX + barWidth, barY + barHeight);
ctx.stroke();


// ================= SANGUE ESCORRENDO (NATURAL) =================
if (dramuzos.bleed.active) {
    ctx.fillStyle = '#6a0000';
    
    dramuzos.bleed.drips.forEach(drip => {
        const x = barX + drip.x * (barWidth * hpRatio);
        
        // crescimento gradual
        drip.length += drip.speed;
        
        // leve oscilação pra parecer orgânico
        const sway = Math.sin(now * 0.01 + drip.x * 10) * 1.5;
        
        ctx.beginPath();
        ctx.moveTo(x, barY + barHeight);
        ctx.lineTo(x + sway, barY + barHeight + drip.length);
        ctx.lineTo(x - sway, barY + barHeight + drip.length);
        ctx.closePath();
        ctx.fill();
        
        // gotinha na ponta
        ctx.beginPath();
        ctx.arc(x, barY + barHeight + drip.length, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}}