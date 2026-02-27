import { canvas, ctx, gameProps, resetGameProps } from './state.js';
import { DELAY_TIMES } from './constants.js';
import { checkHighScore, saveHighScore, saveTotalCoins, saveShopData } from './storage.js';
import { bird } from './bird.js';
import { pipes, updatePipes, drawPipes } from './pipes.js';
import { initMovingTube, updateMovingTube, drawMovingTube } from './movingTube.js';
import { drawScore, drawWaitingScreen, drawGameOverScreen, drawStartScreen, handleMenuClick } from './ui.js';
import { playDie, playShield, playSlowMo } from './audio.js';
import { createParticles, updateAndDrawParticles, clearParticles } from './particles.js';
import { initBackground, updateAndDrawBackground } from './background.js';
import { updateLightning, drawLightning, resetLightning } from './lightning.js';
import { resetRain, updateAndDrawRain } from './rain.js';
import { updateAndDrawCoins, clearCoins } from './coins.js';
import { drawShop, handleShopClick } from './shop.js';
import { updateGhosts, drawGhosts, resetGhosts } from './ghost.js';

function gameOver() {
    gameProps.isGameOver = true;
    gameProps.lastDeathTime = Date.now();
    playDie();
    createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FF4444', 40);
    saveTotalCoins(gameProps.currentCoins);
    
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
    clearCoins();
    
    resetGameProps();
    initMovingTube();
    initBackground();
    resetLightning();
    resetRain();
    resetGhosts();
    
    loop();
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha o fundo (Paralaxe) antes de tudo
    updateAndDrawBackground();
    
    // 2. Desenha a chuva (atrás dos canos)
    updateAndDrawRain();

    // Se a loja estiver aberta, desenha a loja e para o loop
    if (gameProps.isShopOpen) {
        drawShop();
        requestAnimationFrame(loop);
        return;
    }

    // Se estiver no menu, desenha o menu e retorna
    if (gameProps.isInMenu) {
        drawStartScreen();
        requestAnimationFrame(loop);
        return;
    }

    if (gameProps.isWaitingToStart) return;

    // Atualiza lógica apenas se não for Game Over
    if (!gameProps.isGameOver) {
        // Atualiza timers do ímã
        if (gameProps.magnetCooldownTimer > 0) gameProps.magnetCooldownTimer--;
        if (gameProps.magnetTimer > 0) {
            gameProps.magnetTimer--;
            if (gameProps.magnetTimer <= 0) {
                gameProps.isMagnetActive = false;
            }
        }

        // Atualiza timers do Slow-Mo
        if (gameProps.slowMoCooldownTimer > 0) gameProps.slowMoCooldownTimer--;
        if (gameProps.slowMoTimer > 0) {
            gameProps.slowMoTimer--;
            if (gameProps.slowMoTimer <= 0) {
                gameProps.isSlowMoActive = false;
            }
        }

        // Atualiza timers de imunidade
        if (gameProps.cardCooldownTimer > 0) gameProps.cardCooldownTimer--;
        if (gameProps.immunityTimer > 0) {
            gameProps.immunityTimer--;
            if (gameProps.immunityTimer <= 0) {
                gameProps.isImmune = false;
            }
        }

        const currentSpeedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
        gameProps.gameSpeed += gameProps.difficultyMultiplier * currentSpeedMultiplier;
        bird.update(gameOver);
        updatePipes(bird, gameOver);
        updateMovingTube(bird, gameOver);
        updateLightning(bird, gameOver);
        updateGhosts(bird, gameOver);
        updateAndDrawCoins(bird);
        gameProps.frames++;
    } else {
        // Se for Game Over, desenhamos os elementos estáticos para não sumirem
        drawMovingTube();
    }

    // Desenha sempre
    bird.draw();
    drawPipes();
    if (gameProps.isGameOver) updateAndDrawCoins(bird); // Desenha moedas paradas no game over
    updateAndDrawParticles();
    drawLightning();
    drawGhosts();
    
    drawScore();

    if (gameProps.isGameOver) {
        drawGameOverScreen();
    }

    requestAnimationFrame(loop);
}

function activateImmunityCard() {
    if (gameProps.shopData.immunityCards > 0 && gameProps.cardCooldownTimer <= 0 && !gameProps.isImmune) {
        gameProps.isImmune = true;
        gameProps.immunityTimer = 3 * 60; // 3 segundos
        gameProps.cardCooldownTimer = 30 * 60; // 30 segundos
        gameProps.shopData.immunityCards--;
        saveShopData(gameProps.shopData);
        playShield();
    }
}

function activateSlowMo() {
    if (gameProps.shopData.slowMoCharges > 0 && gameProps.slowMoCooldownTimer <= 0 && !gameProps.isSlowMoActive) {
        gameProps.isSlowMoActive = true;
        gameProps.slowMoTimer = 5 * 60; // 5 segundos
        gameProps.slowMoCooldownTimer = 20 * 60; // 20 segundos
        gameProps.shopData.slowMoCharges--;
        saveShopData(gameProps.shopData);
        playSlowMo();
    }
}

function activateMagnet() {
    if (gameProps.magnetCooldownTimer <= 0 && !gameProps.isMagnetActive) {
        gameProps.isMagnetActive = true;
        gameProps.magnetTimer = 5 * 60; // 5 segundos
        gameProps.magnetCooldownTimer = 10 * 60; // 10 segundos
        // playMagnetSound(); // TODO: Add a sound for this
    }
}

function handleInput(e) {
    if (gameProps.isShopOpen) {
        if (e.type === 'click') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            handleShopClick(x, y);
        }
        return;
    }

    if (gameProps.isInMenu && e.type === 'click') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const action = handleMenuClick(x, y);
        if (action === 'start') {
            gameProps.isInMenu = false;
            startWaitingPeriod();
        } else if (action === 'shop') {
            gameProps.isShopOpen = true;
        }
        return;
    }

    if (e.type === 'keydown' && e.code === 'KeyL' && (gameProps.isInMenu || gameProps.isGameOver)) {
        gameProps.isShopOpen = true;
        return;
    }

    if (e.type === 'keydown' && e.code === 'KeyE' && !gameProps.isGameOver) {
        activateImmunityCard();
    }

    if (e.type === 'keydown' && e.code === 'KeyT' && !gameProps.isGameOver) {
        activateSlowMo();
    }

    if (e.type === 'keydown' && e.code === 'KeyM' && !gameProps.isGameOver) {
        activateMagnet();
    }

    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'keydown') e.preventDefault();
    
    if (gameProps.isInMenu && e.type === 'keydown') {
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