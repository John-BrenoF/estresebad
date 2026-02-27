import { ctx, canvas, gameProps } from './state.js';
import { createParticles } from './particles.js';
import { playExplosion } from './audio.js';
import { triggerShockwave } from './main.js';

const pipeGap = 150;

export let movingTube = {
    x: 300,
    y: 0,
    width: 50,
    height: 200,
    topHeight: 200,
    bottomHeight: 400,
    baseTopHeight: 200, // Altura base para oscilação
    oscillationSpeed: 0.05,
    oscillationAmplitude: 100,
    active: false
};

export function initMovingTube() {
    movingTube.active = false;
    movingTube.x = canvas.width + 500;
}

export function spawnMovingTube(x) {
    movingTube.active = true;
    movingTube.x = x;
    movingTube.baseTopHeight = Math.random() * (canvas.height - pipeGap - 200) + 100;
}

export function updateMovingTube(bird, onCollision) {
    if (!movingTube.active) return;

    // Movimento horizontal
    const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
    movingTube.x -= gameProps.gameSpeed * speedMultiplier; // Mesma velocidade dos canos para manter o fluxo
    
    // Movimento Vertical (Oscilação Senoidal)
    // Usa gameProps.frames para criar um movimento suave de sobe e desce
    const oscillation = Math.sin(gameProps.frames * movingTube.oscillationSpeed) * movingTube.oscillationAmplitude;
    
    movingTube.topHeight = movingTube.baseTopHeight + oscillation;
    movingTube.bottomHeight = canvas.height - pipeGap - movingTube.topHeight;
    
    // Se saiu da tela pela esquerda, reposiciona lá na frente
    if (movingTube.x + movingTube.width < 0) {
        movingTube.active = false;
    }
    
    drawMovingTube();
    checkMovingTubeCollision(bird, onCollision);
}

export function drawMovingTube() {
    if (!movingTube.active) return;

    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
    ctx.fillRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
    ctx.strokeRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
}

function checkMovingTubeCollision(bird, onCollision) {
    if (!movingTube.active) return;

    if (bird.x < movingTube.x + movingTube.width && bird.x + bird.width > movingTube.x && (bird.y < movingTube.topHeight || bird.y + bird.height > canvas.height - movingTube.bottomHeight)) {
        if (gameProps.isFuryActive) {
            movingTube.active = false; // Destrói o tubo móvel
            playExplosion();
            triggerShockwave(movingTube.x + movingTube.width/2, bird.y + bird.height/2);
            createParticles(movingTube.x + movingTube.width/2, movingTube.topHeight, '#FF4500', 40);
        } else if (!gameProps.isImmune) {
            onCollision();
        }
    }
}