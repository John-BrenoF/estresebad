import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins } from './storage.js';
import { triggerScreenShake } from './main.js';
import { playBossDefeated, playSoundWave, playExplosion, playGlitch, playBossLaser } from './audio.js';
import { createParticles } from './particles.js';

export const dramuzos = {
    x: 0,
    y: 0,
    width: 120, // Maior que o boss normal
    height: 100,
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
    lasers: []
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
            // Escolhe um ataque aleatório
            const attacks = ['attack_soundwave', 'attack_laser'];
            dramuzos.state = attacks[Math.floor(Math.random() * attacks.length)];
            dramuzos.attackTimer = 0;
            
            if (dramuzos.state === 'attack_soundwave') {
                dramuzos.timer = 300; // Duração do ataque de onda (5s)
            } else { // attack_laser
                dramuzos.timer = 240; // Duração do ataque de laser (4s)
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
        } else if (p.type === 'player_shot' || p.type === 'player_shot_red') {
            // Desenha os tiros do jogador corretamente
            ctx.beginPath();
            ctx.fillStyle = p.type === 'player_shot_red' ? '#FF0000' : '#00FFFF';
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Desenhar Dramuzos (Morcego Gigante)
    ctx.save();
    ctx.translate(dramuzos.x + dramuzos.width/2, dramuzos.y + dramuzos.height/2);
    
    // Animação de voo lenta e pesada
    const wingY = Math.sin(dramuzos.frame * 0.5) * 30;
    
    // --- NOVAS ANIMAÇÕES ---
    // Inclinação sutil do corpo durante o voo
    const bodyTilt = Math.cos(dramuzos.frame * 0.5) * 0.1; // Inclina ~5.7 graus
    ctx.rotate(bodyTilt);
    // Efeito de "respirar" ou "esmagar e esticar"
    const bodySquash = 1 + Math.sin(dramuzos.frame * 0.5) * 0.05;
    ctx.scale(1, bodySquash);
    // --- FIM NOVAS ANIMAÇÕES ---
    
    // Asas Gigantes
    ctx.fillStyle = '#1a0505'; // Quase preto
    ctx.beginPath();
    // Asa Esq
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-80, wingY - 80, -180, wingY - 20);
    ctx.quadraticCurveTo(-120, wingY + 60, -80, wingY + 40);
    ctx.quadraticCurveTo(-50, wingY + 50, -20, 20);
    // Asa Dir
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(80, wingY - 80, 180, wingY - 20);
    ctx.quadraticCurveTo(120, wingY + 60, 80, wingY + 40);
    ctx.quadraticCurveTo(50, wingY + 50, 20, 20);
    ctx.fill();
    
    // Estrutura óssea da asa (vermelho escuro)
    ctx.strokeStyle = '#500';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Corpo
    ctx.fillStyle = '#2d0a0a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos (Amarelo brilhante)
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(-15, -10, 8, 0, Math.PI*2);
    ctx.arc(15, -10, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Boca/Dentes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(-10, 10); ctx.lineTo(-5, 25); ctx.lineTo(0, 10);
    ctx.moveTo(0, 10); ctx.lineTo(5, 25); ctx.lineTo(10, 10);
    ctx.fill();

    ctx.restore();

    // Barra de Vida
    const barX = 20;
    const barWidth = canvas.width - 40;
    ctx.fillStyle = '#444'; ctx.fillRect(barX, 20, barWidth, 20);
    ctx.fillStyle = '#8B0000'; ctx.fillRect(barX, 20, barWidth * (dramuzos.hp / dramuzos.maxHp), 20); // Vermelho escuro
    ctx.strokeStyle = '#FFF'; ctx.strokeRect(barX, 20, barWidth, 20);
}