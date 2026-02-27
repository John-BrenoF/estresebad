import { canvas, ctx, gameProps, resetGameProps } from './state.js';
import { DELAY_TIMES } from './constants.js';
import { checkHighScore, saveHighScore, saveTotalCoins, saveShopData, getShopData, getTotalCoins } from './storage.js';
import { bird } from './bird.js';
import { pipes, updatePipes, drawPipes } from './pipes.js';
import { initMovingTube, updateMovingTube, drawMovingTube } from './movingTube.js';
import { drawScore, drawWaitingScreen, drawGameOverScreen, drawStartScreen, handleMenuClick, attackButtonRect, shieldButtonRect, furyButtonRect } from './ui.js';
import { playDie, playShield, playSlowMo, playBossMusic, stopBossMusic, playPlayerAttack, playBossDefeated, playPlayerShield, playNormalMusic, stopNormalMusic } from './audio.js';
import { createParticles, updateAndDrawParticles, clearParticles } from './particles.js';
import { initBackground, updateAndDrawBackground } from './background.js';
import { updateLightning, drawLightning, resetLightning } from './lightning.js';
import { resetRain, updateAndDrawRain } from './rain.js';
import { updateAndDrawCoins, clearCoins } from './coins.js';
import { drawShop, handleShopClick, handleShopScroll } from './shop.js';
import { updateGhosts, drawGhosts, resetGhosts } from './ghost.js';
import { checkAchievements, drawAchievements, loadAchievements } from './achievements.js';
import { loadMissions, updateMissionProgress, drawMissionMap, handleMissionClick, handleMissionScroll } from './missions.js';
import { initBoss, updateBoss, drawBoss, boss } from './boss.js';
import { updateAndDrawFakeCones, resetFakeCones } from './fakeCones.js';
import { checkGeometryEvent, updateGeometryState, drawGeometryOverlay } from './geometry.js';

let screenShake = { intensity: 0, duration: 0 };

function gameOver() {
    gameProps.isGameOver = true;
    gameProps.lastDeathTime = Date.now();
    playDie();
    triggerScreenShake(10, 20);
    createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FF4444', 40);
    saveTotalCoins(gameProps.currentCoins);
    stopBossMusic();
    stopNormalMusic();
    
    if (checkHighScore(gameProps.score)) {
        gameProps.isNewHighScore = true;
        saveHighScore(gameProps.score);
    }

    updateMissionProgress();
}

function startWaitingPeriod() {
    gameProps.isWaitingToStart = true;
    gameProps.isGameOver = false;
    
    const randomIndex = Math.floor(Math.random() * DELAY_TIMES.length);
    gameProps.selectedDelay = DELAY_TIMES[randomIndex];
    gameProps.waitStartTime = Date.now();
    
    if (gameProps.isBossMode) {
        playBossMusic();
    } else {
        playNormalMusic();
    }
    
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
    resetFakeCones();
    if (gameProps.isBossMode) initBoss();
    
    loop();
}

function loop() {
    ctx.save();
    
    // Efeito de Pulsação (Zoom In/Out)
    if (gameProps.pulseScale > 1.0) {
        gameProps.pulseScale -= 0.002; // Decaimento do zoom
        if (gameProps.pulseScale < 1.0) gameProps.pulseScale = 1.0;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(gameProps.pulseScale, gameProps.pulseScale);
        ctx.translate(-centerX, -centerY);
    }

    if (screenShake.duration > 0) {
        const dx = (Math.random() - 0.5) * screenShake.intensity;
        const dy = (Math.random() - 0.5) * screenShake.intensity;
        ctx.translate(dx, dy);
        screenShake.duration--;
    }

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

    // Se o mapa de missões estiver aberto
    if (gameProps.isMissionMapOpen) {
        drawMissionMap();
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

    // Atualiza estado do Geometry Mode (Cutscene e Timer)
    updateGeometryState();
    checkGeometryEvent();

    // Atualiza lógica apenas se não for Game Over
    // E SE NÃO ESTIVER NA CUTSCENE DO GEOMETRY (Pausa o jogo para o aviso)
    if (!gameProps.isGameOver && !gameProps.isGeometryCutscene) {
        // Player attack cooldown
        if (gameProps.playerAttackCooldown > 0) gameProps.playerAttackCooldown--;
        if (gameProps.playerShieldCooldown > 0) {
            gameProps.playerShieldCooldown--;
        }
        if (gameProps.playerShieldCooldown < (1.1 * 60) - 10) gameProps.isPlayerShieldActive = false; // Shield stays active for 10 frames
        if (gameProps.freezeTimer > 0) {
            gameProps.freezeTimer--;
            if (gameProps.freezeTimer <= 0) gameProps.isFrozen = false;
        }

        // Atualiza Fúria
        if (gameProps.isFuryActive) {
            gameProps.furyTimer--;
            if (gameProps.furyTimer <= 0) {
                gameProps.isFuryActive = false;
            }
        }

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
        const hardcoreMultiplier = gameProps.isHardcoreMode ? 1.5 : 1;
        gameProps.gameSpeed += gameProps.difficultyMultiplier * currentSpeedMultiplier * hardcoreMultiplier;
        bird.update(gameOver);

        if (gameProps.isBossMode) {
            updateBoss(bird, gameOver);
        } else {
            updatePipes(bird, gameOver);
            updateMovingTube(bird, gameOver);
            updateLightning(bird, gameOver);
            updateGhosts(bird, gameOver);
            updateAndDrawFakeCones(bird); // Efeito visual de cones caindo
        }
        
        updateAndDrawCoins(bird);
        checkAchievements();
        gameProps.frames++;
    } else {
        // Se for Game Over, desenhamos os elementos estáticos para não sumirem
        drawMovingTube();
    }

    // Desenha sempre
    bird.draw();
    
    if (gameProps.isBossMode) {
        drawBoss();
    } else {
        drawPipes();
        drawLightning();
        drawGhosts();
    }
    
    if (gameProps.isGameOver) updateAndDrawCoins(bird); // Desenha moedas paradas no game over
    updateAndDrawParticles();

    // Desenhar Ondas de Choque
    ctx.save();
    ctx.lineWidth = 6;
    for (let i = 0; i < gameProps.shockwaves.length; i++) {
        let sw = gameProps.shockwaves[i];
        sw.radius += sw.speed;
        sw.alpha -= 0.05;

        if (sw.alpha <= 0) {
            gameProps.shockwaves.splice(i, 1);
            i--;
            continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha})`;
        ctx.stroke();
    }
    ctx.restore();
    
    drawAchievements();
    drawScore();
    drawGeometryOverlay(); // Desenha o aviso ou a barra de tempo

    if (gameProps.isGameOver) {
        drawGameOverScreen();
    }

    // --- EFEITO DE DISTORÇÃO CROMÁTICA (RGB SPLIT SIMULADO) ---
    if (gameProps.rgbSplitTimer > 0) {
        gameProps.rgbSplitTimer--;
        
        // Intensidade baseada no tempo restante
        const intensity = (gameProps.rgbSplitTimer / 120);
        const offset = (Math.random() * 10 + 5) * intensity;

        ctx.save();
        ctx.globalCompositeOperation = 'screen'; // Mistura aditiva para simular luz
        ctx.globalAlpha = 0.6 * intensity;
        
        // Desenha a tela sobre ela mesma com deslocamentos (Simula canais desajustados)
        ctx.drawImage(canvas, offset, 0);  // Deslocamento para a direita
        ctx.drawImage(canvas, -offset, 0); // Deslocamento para a esquerda
        ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(loop);
}

export function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

export function triggerShockwave(x, y) {
    gameProps.shockwaves.push({
        x: x,
        y: y,
        radius: 10,
        alpha: 1.0,
        speed: 15
    });
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

function activatePlayerShield() {
    if (gameProps.playerShieldCooldown <= 0) {
        gameProps.isPlayerShieldActive = true; // Ativa o escudo
        gameProps.playerShieldCooldown = 1.1 * 60; // 1.1 segundos
        gameProps.shieldUsageCount++;
        playPlayerShield();
    }
}

function activateFury() {
    if (gameProps.furyCharge >= 5 && !gameProps.isFuryActive) {
        gameProps.isFuryActive = true;
        gameProps.furyCharge = 0;
        gameProps.furyTimer = 2 * 60; // 2 segundos
        // playFurySound(); // Opcional: adicionar som
    }
}

function playerAttack() {
    if (gameProps.isBossMode && gameProps.playerAttackCooldown <= 0) {
        gameProps.playerAttackCooldown = 5 * 60; // 5 segundos
        playPlayerAttack();
        boss.projectiles.push({
            x: bird.x + bird.width, y: bird.y + bird.height / 2,
            vx: 8, vy: 0, size: 12, type: 'player_shot'
        });
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
        // Adiciona o listener de scroll apenas quando a loja está aberta
        if (e.type === 'wheel') {
            handleShopScroll(e);
        }
        return;
    }

    if (gameProps.isMissionMapOpen) {
        if (e.type === 'click') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            handleMissionClick(x, y);
        }
        if (e.type === 'wheel') {
            handleMissionScroll(e);
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
            gameProps.isHardcoreMode = false;
            startWaitingPeriod();
        } else if (action === 'shop') {
            // Garante que os dados da loja e moedas estão carregados antes de abrir
            if (!gameProps.shopData) gameProps.shopData = getShopData();
            if (gameProps.totalCoins === 0) gameProps.totalCoins = getTotalCoins();

            gameProps.isShopOpen = true;
        } else if (action === 'hardcore') {
            gameProps.isInMenu = false;
            gameProps.isHardcoreMode = true;
            startWaitingPeriod();
        } else if (action === 'boss') {
            gameProps.isInMenu = false;
            gameProps.isBossMode = true;
            gameProps.isHardcoreMode = false;
            startWaitingPeriod();
        } else if (action === 'missions') {
            gameProps.isMissionMapOpen = true;
        }
        return;
    }

    // Botão de sair durante a partida
    const exitButtonRect = { x: canvas.width - 40, y: canvas.height - 40, w: 30, h: 30 };
    if (!gameProps.isGameOver && !gameProps.isInMenu && e.type === 'click') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x > exitButtonRect.x && x < exitButtonRect.x + exitButtonRect.w && y > exitButtonRect.y && y < exitButtonRect.y + exitButtonRect.h) {
            gameOver();
            return;
        }

        // Botão de Ataque (Boss Mode)
        if (gameProps.isBossMode) {
            if (x > attackButtonRect.x && x < attackButtonRect.x + attackButtonRect.w && y > attackButtonRect.y && y < attackButtonRect.y + attackButtonRect.h) {
                playerAttack();
                return;
            }
            // Botão de Escudo
            if (x > shieldButtonRect.x && x < shieldButtonRect.x + shieldButtonRect.w && y > shieldButtonRect.y && y < shieldButtonRect.y + shieldButtonRect.h) {
                activatePlayerShield();
                return;
            }
        } else {
            // Botão de Fúria (Modo Normal/Hardcore)
            if (x > furyButtonRect.x && x < furyButtonRect.x + furyButtonRect.w && y > furyButtonRect.y && y < furyButtonRect.y + furyButtonRect.h) {
                activateFury();
                return;
            }
        }
        // Se não clicou em botões, permite o pulo (tap-to-jump)
    }

    if (e.type === 'keydown' && e.code === 'KeyL' && (gameProps.isInMenu || gameProps.isGameOver)) {
        gameProps.isShopOpen = true;
        // Garante que os dados da loja e moedas estão carregados antes de abrir
        if (!gameProps.shopData) gameProps.shopData = getShopData();
        if (gameProps.totalCoins === 0) gameProps.totalCoins = getTotalCoins();

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

    if (e.type === 'keydown' && e.code === 'KeyF' && !gameProps.isGameOver) {
        playerAttack();
    }

    if (e.type === 'keydown' && e.code === 'KeyS' && !gameProps.isGameOver) {
        activatePlayerShield();
    }

    if (e.type === 'keydown' && e.code === 'KeyZ' && !gameProps.isGameOver) {
        activateFury();
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
canvas.addEventListener('wheel', handleInput);

// Suporte a Scroll por Toque (Mobile)
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (gameProps.isShopOpen) {
        e.preventDefault(); // Evita rolar a página inteira
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        handleShopScroll({ deltaY: deltaY });
        touchStartY = currentY;
    } else if (gameProps.isMissionMapOpen) {
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        handleMissionScroll({ deltaY: deltaY });
        touchStartY = currentY;
    }
}, { passive: false });

// Iniciar
initMovingTube();
initBackground();
loadAchievements();
loadMissions();
loop();