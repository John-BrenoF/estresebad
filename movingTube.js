import { ctx, canvas, gameProps } from './state.js';
import { createParticles, createDust } from './particles.js';
import { playExplosion, playBuy } from './audio.js';
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
    
    // Efeito de Poeira
    if (!gameProps.isGameOver && gameProps.frames % 10 === 0) {
        createDust(movingTube.x + movingTube.width / 2, canvas.height - 5);
    }

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

    // --- MODO GEOMETRY (Pilar de Laser) ---
    if (gameProps.isGeometryMode) {
        ctx.save();
        ctx.fillStyle = '#220000';
        ctx.strokeStyle = '#FF0000'; // Vermelho Neon
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF0000';

        ctx.fillRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
        ctx.strokeRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
        ctx.fillRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
        ctx.strokeRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
        ctx.restore();
        return;
    }
    // --------------------------------------

    // Gradiente Industrial (Laranja Metálico)
    let color1 = '#8B2500';
    let color2 = '#FF6B35';
    let color3 = '#FF9F75';

    if (gameProps.isCoinTransformActive) {
        color1 = '#DAA520';
        color2 = '#FFD700';
        color3 = '#FFFFE0';
    }

    const gradient = ctx.createLinearGradient(movingTube.x, 0, movingTube.x + movingTube.width, 0);
    gradient.addColorStop(0, color1); // Ferrugem/Sombra
    gradient.addColorStop(0.2, color2); // Laranja Base
    gradient.addColorStop(0.5, color3); // Brilho
    gradient.addColorStop(0.8, color2);
    gradient.addColorStop(1, color1);

    ctx.fillStyle = gradient;
    ctx.fillRect(movingTube.x, 0, movingTube.width, movingTube.topHeight);
    ctx.fillRect(movingTube.x, canvas.height - movingTube.bottomHeight, movingTube.width, movingTube.bottomHeight);
    
    // Tampas Metálicas (Cinza Escuro)
    const capHeight = 20;
    const capOverhang = 3;
    
    ctx.fillStyle = '#444'; // Metal escuro
    ctx.fillRect(movingTube.x - capOverhang, movingTube.topHeight - capHeight, movingTube.width + capOverhang*2, capHeight);
    ctx.fillRect(movingTube.x - capOverhang, canvas.height - movingTube.bottomHeight, movingTube.width + capOverhang*2, capHeight);
    
    // Bordas
    ctx.strokeStyle = '#222';
    ctx.strokeRect(movingTube.x - capOverhang, movingTube.topHeight - capHeight, movingTube.width + capOverhang*2, capHeight);
    ctx.strokeRect(movingTube.x - capOverhang, canvas.height - movingTube.bottomHeight, movingTube.width + capOverhang*2, capHeight);
}

function checkMovingTubeCollision(bird, onCollision) {
    if (!movingTube.active) return;

    if (bird.x < movingTube.x + movingTube.width && bird.x + bird.width > movingTube.x && (bird.y < movingTube.topHeight || bird.y + bird.height > canvas.height - movingTube.bottomHeight)) {
        if (gameProps.isFuryActive) {
            movingTube.active = false; // Destrói o tubo móvel
            playExplosion();
            triggerShockwave(movingTube.x + movingTube.width/2, bird.y + bird.height/2);
            createParticles(movingTube.x + movingTube.width/2, movingTube.topHeight, '#FF4500', 40);
        } else if (gameProps.isCoinTransformActive) {
            movingTube.active = false;
            gameProps.currentCoins += 10; // Bônus maior
            playBuy();
            createParticles(movingTube.x + movingTube.width/2, movingTube.topHeight, '#FFD700', 30);
        } else if (!gameProps.isImmune) {
            onCollision();
        }
    }
}