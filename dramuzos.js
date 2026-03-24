import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins } from './storage.js';
import { triggerScreenShake } from './main.js';
import { playBossDefeated, playSoundWave, playExplosion } from './audio.js';
import { createParticles } from './particles.js';

export const dramuzos = {
    x: 0,
    y: 0,
    width: 120, // Maior que o boss normal
    height: 100,
    active: false,
    hp: 600,
    maxHp: 600,
    state: 'idle',
    isDefeated: false,
    timer: 0,
    attackTimer: 0,
    frame: 0,
    projectiles: [] // Usado para as ondas sonoras
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
            dramuzos.state = 'attack_soundwave';
            dramuzos.attackTimer = 0;
            dramuzos.timer = 300; // Duração do ataque (5 segundos)
        } else {
            dramuzos.state = 'idle';
            dramuzos.timer = 90; // Descanso de 1.5s
        }
    }

    // Lógica do Ataque de Onda Sonora
    if (dramuzos.state === 'attack_soundwave') {
        dramuzos.attackTimer++;
        // Dispara uma onda a cada 60 frames (1 segundo)
        if (dramuzos.attackTimer % 60 === 0) {
            playSoundWave();
            triggerScreenShake(5, 10);
            dramuzos.projectiles.push({
                type: 'soundwave', // Identificador importante
                x: dramuzos.x + dramuzos.width / 2, // Sai do centro do boss
                y: dramuzos.y + dramuzos.height / 2,
                radius: 10,
                maxRadius: canvas.width * 1.5, // Cobre a tela toda
                speed: 6,
                width: 20 // Espessura da onda
            });
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
            
            // Verifica se o ângulo está dentro do cone do "WiFi" (aprox. 135 a 225 graus, apontando para a esquerda)
            // abs(angle) > 3*PI/4 garante que estamos no quadrante esquerdo
            const inCone = Math.abs(angle) > (Math.PI * 0.75);

            // Se a distância estiver na faixa da onda E estiver dentro do ângulo do cone
            if (dist >= p.radius - p.width && dist <= p.radius + p.width && inCone) {
                if (!gameProps.isImmune && !gameProps.isPlayerShieldActive) {
                    onCollision();
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

    // Desenhar Ondas Sonoras
    dramuzos.projectiles.forEach(p => {
        if (p.type === 'soundwave') {
        ctx.save();
        ctx.beginPath();
            // Desenha apenas o arco do "WiFi" (Cone esquerdo: 135 a 225 graus)
            ctx.arc(p.x, p.y, p.radius, Math.PI * 0.75, Math.PI * 1.25);
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