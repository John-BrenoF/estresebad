import { ctx, canvas, gameProps } from './state.js';
import { playScore, playExplosion } from './audio.js';
import { triggerShockwave } from './main.js';
import { createParticles } from './particles.js';
import { createCoin } from './coins.js';
import { spawnMovingTube, movingTube } from './movingTube.js';

export const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;

export function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        if (p.destroyed) continue;
        
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.fillRect(p.x, canvas.height - p.bottom, pipeWidth, p.bottom);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, pipeWidth, p.top);
        ctx.strokeRect(p.x, canvas.height - p.bottom, pipeWidth, p.bottom);
    }
}

export function updatePipes(bird, onCollision) {
    let spawnRate = Math.max(70, 120 - Math.floor(gameProps.score / 5)); 
    
    if (gameProps.frames % spawnRate === 0) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
        
        // 10% de chance de spawnar o tubo móvel no lugar de um cano normal
        // (apenas se ele não estiver ativo)
        if (!movingTube.active && !gameProps.isHardcoreMode && Math.random() < 0.1) {
            spawnMovingTube(canvas.width);
            
            // Chance de moeda no tubo móvel também
            if (Math.random() < 0.5) {
                createCoin(canvas.width + pipeWidth / 2, movingTube.baseTopHeight + pipeGap / 2);
            }
        } else {
            let bottomHeight = canvas.height - pipeGap - topHeight;
            pipes.push({
                x: canvas.width,
                top: topHeight,
                bottom: bottomHeight,
                passed: false,
                destroyed: false
            });

            // 50% de chance de gerar uma moeda no vão do cano
            if (Math.random() < 0.5) {
                createCoin(canvas.width + pipeWidth / 2, topHeight + pipeGap / 2);
            }
        }
    }

    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
        p.x -= gameProps.gameSpeed * speedMultiplier;

        // Colisão com canos fixos
        if (!p.destroyed &&
            bird.x < p.x + pipeWidth &&
            bird.x + bird.width > p.x &&
            (bird.y < p.top || bird.y + bird.height > canvas.height - p.bottom)
        ) {
            if (gameProps.isFuryActive) {
                p.destroyed = true;
                playExplosion();
                triggerShockwave(p.x + pipeWidth/2, bird.y + bird.height/2);
                createParticles(p.x + pipeWidth/2, p.top, '#FF4500', 30);
                createParticles(p.x + pipeWidth/2, canvas.height - p.bottom, '#FF4500', 30);
            } else if (!gameProps.isImmune) {
                onCollision();
            }
        }

        // Pontuação
        if (p.x + pipeWidth < bird.x && !p.passed) {
            gameProps.score++;
            try {
                playScore();
            } catch (e) {
                console.error("Erro som:", e);
            }
            
            try {
                createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FFD700', 15);
            } catch (e) {
                console.error("Erro nas partículas:", e);
            }

            if (gameProps.furyCharge < 5) {
                gameProps.furyCharge++;
            }
            
            p.passed = true;
        }

        // Remover canos que saíram da tela
        if (p.x + pipeWidth < 0) {
            pipes.shift();
            i--;
        }
    }
}