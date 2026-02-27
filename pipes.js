import { ctx, canvas, gameProps } from './state.js';
import { playScore } from './audio.js';
import { createParticles } from './particles.js';
import { createCoin } from './coins.js';

export const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;

export function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        
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
        let bottomHeight = canvas.height - pipeGap - topHeight;
        
        pipes.push({
            x: canvas.width,
            top: topHeight,
            bottom: bottomHeight,
            passed: false
        });

        // 50% de chance de gerar uma moeda no vão do cano
        if (Math.random() < 0.5) {
            createCoin(canvas.width + pipeWidth / 2, topHeight + pipeGap / 2);
        }
    }

    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
        p.x -= gameProps.gameSpeed * speedMultiplier;

        // Colisão com canos fixos
        if (!gameProps.isImmune &&
            bird.x < p.x + pipeWidth &&
            bird.x + bird.width > p.x &&
            (bird.y < p.top || bird.y + bird.height > canvas.height - p.bottom)
        ) {
            onCollision();
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
            
            p.passed = true;
        }

        // Remover canos que saíram da tela
        if (p.x + pipeWidth < 0) {
            pipes.shift();
            i--;
        }
    }
}