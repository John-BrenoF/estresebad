import { ctx, canvas, gameProps } from './state.js';

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
    oscillationAmplitude: 100
};

export function initMovingTube() {
    // Começa longe da tela
    movingTube.x = canvas.width + 500; 
    movingTube.baseTopHeight = canvas.height / 2 - pipeGap / 2;
}

export function updateMovingTube(bird, onCollision) {
    // Movimento horizontal
    const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
    movingTube.x -= gameProps.gameSpeed * 1.2 * speedMultiplier; // Um pouco mais rápido que os canos normais
    
    // Movimento Vertical (Oscilação Senoidal)
    // Usa gameProps.frames para criar um movimento suave de sobe e desce
    const oscillation = Math.sin(gameProps.frames * movingTube.oscillationSpeed) * movingTube.oscillationAmplitude;
    
    movingTube.topHeight = movingTube.baseTopHeight + oscillation;
    movingTube.bottomHeight = canvas.height - pipeGap - movingTube.topHeight;
    
    // Se saiu da tela pela esquerda, reposiciona lá na frente
    if (movingTube.x + movingTube.width < 0) {
        movingTube.x = canvas.width + 300 + Math.random() * 400;
        // Define uma nova altura base aleatória para a próxima passagem
        movingTube.baseTopHeight = Math.random() * (canvas.height - pipeGap - 200) + 100;
    }
    
    drawMovingTube();
    checkMovingTubeCollision(bird, onCollision);
}

export function drawMovingTube() {
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
    ctx.fillRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
    ctx.strokeRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
}

function checkMovingTubeCollision(bird, onCollision) {
    if (!gameProps.isImmune && bird.x < movingTube.x + movingTube.width && bird.x + bird.width > movingTube.x && (bird.y < movingTube.topHeight || bird.y + bird.height > canvas.height - movingTube.bottomHeight)) {
        onCollision();
    }
}