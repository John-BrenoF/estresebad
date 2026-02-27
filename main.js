import { canvas, ctx, gameProps, resetGameProps } from './state.js';
import { DELAY_TIMES } from './constants.js';
import { checkHighScore, saveHighScore } from './storage.js';
import { bird } from './bird.js';
import { pipes, updatePipes, drawPipes } from './pipes.js';
import { initMovingTube, updateMovingTube, drawMovingTube } from './movingTube.js';
import { drawScore, drawWaitingScreen, drawGameOverScreen, drawStartScreen } from './ui.js';
import { playDie } from './audio.js';
import { createParticles, updateAndDrawParticles, clearParticles } from './particles.js';
import { initBackground, updateAndDrawBackground } from './background.js';

function gameOver() {
    gameProps.isGameOver = true;
    gameProps.lastDeathTime = Date.now();
    playDie();
    createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FF4444', 40);
    
    if (checkHighScore(gameProps.score)) {
        gameProps.isNewHighScore = true;
        saveHighScore(gameProps.score);
    }
}

function startWaitingPeriod() {
    gameProps.isWaitingToStart = true;
    gameProps.isGameOver = false;
    
    const randomIndex = Math.floor(Math.random() * DELAY_TIMES.length);
    gameProps.selectedDelay = DELAY_TIMES[randomIndex];
    gameProps.waitStartTime = Date.now();
    
    waitLoop();
}

function waitLoop() {
    if (!gameProps.isWaitingToStart) return;
    
    const elapsed = (Date.now() - gameProps.waitStartTime) / 1000;
    
    if (elapsed >= gameProps.selectedDelay) {
        gameProps.isWaitingToStart = false;
        resetGame();
    } else {
        drawWaitingScreen();
        requestAnimationFrame(waitLoop);
    }
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes.length = 0;
    clearParticles();
    
    resetGameProps();
    initMovingTube();
    initBackground();
    
    loop();
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha o fundo (Paralaxe) antes de tudo
    updateAndDrawBackground();

    // Se estiver no menu, desenha o menu e retorna
    if (gameProps.isInMenu) {
        drawStartScreen();
        requestAnimationFrame(loop);
        return;
    }

    if (gameProps.isWaitingToStart) return;

    // Atualiza lógica apenas se não for Game Over
    if (!gameProps.isGameOver) {
        gameProps.gameSpeed += gameProps.difficultyMultiplier;
        bird.update(gameOver);
        updatePipes(bird, gameOver);
        updateMovingTube(bird, gameOver);
        gameProps.frames++;
    } else {
        // Se for Game Over, desenhamos os elementos estáticos para não sumirem
        drawMovingTube();
    }

    // Desenha sempre
    bird.draw();
    drawPipes();
    updateAndDrawParticles();
    
    drawScore();

    if (gameProps.isGameOver) {
        drawGameOverScreen();
    }

    requestAnimationFrame(loop);
}

function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'keydown') e.preventDefault();
    
    if (gameProps.isInMenu) {
        gameProps.isInMenu = false;
        startWaitingPeriod();
        return;
    }

    if (gameProps.isWaitingToStart) return;
    
    if (gameProps.isGameOver) {
        // Impede reiniciar se morreu há menos de 1 segundo (evita cliques acidentais)
        if (Date.now() - gameProps.lastDeathTime < 1000) return;
        startWaitingPeriod();
    } else {
        bird.jumpAction();
    }
}

document.addEventListener('keydown', handleInput);
canvas.addEventListener('click', handleInput);

// Iniciar
initMovingTube();
initBackground();
loop();