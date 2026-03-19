import { canvas, ctx, gameProps, resetGameProps } from './state.js';
import { DELAY_TIMES } from './constants.js';
import { checkHighScore, saveHighScore, saveTotalCoins, saveShopData, getShopData, getTotalCoins } from './storage.js';
import { bird } from './bird.js';
import { pipes, updatePipes, drawPipes } from './pipes.js';
import { initMovingTube, updateMovingTube, drawMovingTube, movingTube } from './movingTube.js';
import { drawScore, drawWaitingScreen, drawGameOverScreen, drawStartScreen, handleMenuClick, attackButtonRect, shieldButtonRect, furyButtonRect } from './ui.js';
import { playDie, playShield, playSlowMo, playBossMusic, stopBossMusic, playPlayerAttack, playPlayerRedShot, playBossDefeated, playPlayerShield, playNormalMusic, stopNormalMusic, resumeAudio, playGlitch, playPowerupSound } from './audio.js';
import { createParticles, updateAndDrawParticles, clearParticles } from './particles.js';
import { initBackground, updateAndDrawBackground } from './background.js';
import { updateLightning, drawLightning, resetLightning } from './lightning.js';
import { resetRain, updateAndDrawRain } from './rain.js';
import { updateAndDrawCoins, clearCoins } from './coins.js';
import { drawShop, handleShopClick, handleShopScroll } from './shop.js';
import { updateGhosts, drawGhosts, resetGhosts } from './ghost.js';
import { checkAchievements, drawAchievements, loadAchievements, checkBossAchievements } from './achievements.js';
import { loadMissions, updateMissionProgress, drawMissionMap, handleMissionClick, handleMissionScroll } from './missions.js';
import { initBoss, updateBoss, drawBoss, boss } from './boss.js';
import { updateAndDrawFakeCones, resetFakeCones } from './fakeCones.js';
import { checkGeometryEvent, updateGeometryState, drawGeometryOverlay } from './geometry.js';
 
let screenShake = { intensity: 0, duration: 0 };

function gameOver() {
    if (gameProps.isBossMode && !boss.isDefeated) {
        gameProps.bossPlayerTookDamage = true;
    }

    gameProps.isGameOver = true;
    gameProps.lastDeathTime = Date.now();
    gameProps.menuFadeInTimer = 30; // Ativa a animação de fade-in para a tela de game over
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
    // Verifica conquistas de final de jogo (como a do boss)
    if (gameProps.isBossMode) {
        checkBossAchievements();
    }
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
    gameProps.glitchEffectTimer = 0;
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
        if (gameProps.playerShieldTimer > 0) {
            gameProps.playerShieldTimer--;
            if (gameProps.playerShieldTimer <= 0) {
                gameProps.isPlayerShieldActive = false;
            }
        }
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

        // Atualiza Triple Shot
        if (gameProps.isTripleShotActive) {
            gameProps.tripleShotTimer--;
            if (gameProps.tripleShotTimer <= 0) {
                gameProps.isTripleShotActive = false;
            }
        }

        // Atualiza Timer do Toque de Midas (Transformar em Moedas)
        if (gameProps.isCoinTransformActive) {
            gameProps.coinTransformTimer--;
            if (gameProps.coinTransformTimer <= 0) gameProps.isCoinTransformActive = false;
        }

        // Atualiza o ciclo de dia/noite
        gameProps.timeOfDay += gameProps.dayNightCycleSpeed;
        if (gameProps.timeOfDay > 1) gameProps.timeOfDay -= 1;

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
    
    // --- EFEITO VINHETA (Cinematográfico) ---
    // Escurece as bordas da tela
    const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/2.5, canvas.width/2, canvas.height/2, canvas.height);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawAchievements();
    drawScore();
    drawGeometryOverlay(); // Desenha o aviso ou a barra de tempo

    if (gameProps.isGameOver) {
        drawGameOverScreen();
    }

    // --- EFEITO DE GLITCH ALEATÓRIO ---
    if (!gameProps.isGameOver && !gameProps.isInMenu && !gameProps.isShopOpen && !gameProps.isMissionMapOpen) {
        // A cada ~5 segundos, 10% de chance de ativar
        if (gameProps.frames > 0 && gameProps.frames % 300 === 0 && Math.random() < 0.10) {
            gameProps.glitchEffectTimer = 15; // Duração de 15 frames
        }
    }

    if (gameProps.glitchEffectTimer > 0) {
        gameProps.glitchEffectTimer--;
        if (gameProps.glitchEffectTimer % 4 === 0) playGlitch(); // Toca o som com menos frequência que o efeito visual
        
        const intensity = (Math.random() * 25 + 5);
        ctx.save();
        // Simula um "RGB split" desenhando a tela deslocada com cores aditivas
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6;
        ctx.drawImage(canvas, intensity, Math.random() * 8 - 4); // Canal R/G
        ctx.drawImage(canvas, -intensity, Math.random() * 8 - 4); // Canal B/G
        ctx.restore();
    }

    // --- EFEITO DE FADE-IN GLITCH PARA MENUS ---
    if (gameProps.menuFadeInTimer > 0) {
        const progress = 1 - (gameProps.menuFadeInTimer / 30.0); // 0 a 1
        
        // 1. Efeito Glitch
        if (Math.random() < 0.7) { // Alta chance de glitch durante o fade-in
            const intensity = 1 - progress; // 1 a 0
            const offset = (Math.random() * 20 + 10) * intensity;

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.7 * intensity;
            ctx.drawImage(canvas, offset, 0);
            ctx.drawImage(canvas, -offset, 0);
            ctx.restore();
            
            if(gameProps.menuFadeInTimer % 5 === 0) playGlitch();
        }

        // 2. Fade-in (overlay preto que desaparece)
        // Desenhado por último para cobrir tudo
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - progress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        gameProps.menuFadeInTimer--;
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
        gameProps.isPlayerShieldActive = true;
        gameProps.playerShieldTimer = 3 * 60; // Duração de 3 segundos
        gameProps.playerShieldCooldown = 10 * 60; // Recarga de 10 segundos
        gameProps.shieldUsageCount++;
        playPlayerShield();

        // 9% de chance de curar o boss
        if (gameProps.isBossMode && Math.random() < 0.09) {
            if (boss.hp < boss.maxHp) {
                const healthToHeal = (boss.maxHp - boss.hp) * 0.10;
                boss.hp = Math.min(boss.maxHp, boss.hp + healthToHeal);
                // Efeito visual de cura no boss
                createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#00FF00', 30);
            }
        }
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

function activateTripleShot() {
    // Este item é comprado na loja, a lógica de compra deve ser adicionada em shop.js
    if (gameProps.shopData.tripleShotCharges > 0 && !gameProps.isTripleShotActive) {
        gameProps.isTripleShotActive = true;
        gameProps.tripleShotTimer = 7 * 60; // 7 segundos de duração
        gameProps.shopData.tripleShotCharges--;
        saveShopData(gameProps.shopData);
        playPowerupSound();
    }
}

function playerAttack() {
    if (gameProps.isBossMode && gameProps.playerAttackCooldown <= 0) {
        // Chance de 2% de ser um tiro vermelho (Crítico - Dobro de dano)
        const isCritical = Math.random() < 0.02;
        const type = isCritical ? 'player_shot_red' : 'player_shot';
        const size = isCritical ? 15 : 12;

        if (isCritical) {
            playPlayerRedShot();
        } else {
            playPlayerAttack();
        }

        if (gameProps.isTripleShotActive) {
            // Tiro triplo
            playPlayerAttack(); // Toca o som uma vez
            // Tiro central
            boss.projectiles.push({ x: bird.x + bird.width, y: bird.y + bird.height / 2, vx: 8, vy: 0, size: size, type: type });
            // Tiro superior (diagonal)
            boss.projectiles.push({ x: bird.x + bird.width, y: bird.y + bird.height / 2, vx: 7.5, vy: -1.5, size: size * 0.8, type: type });
            // Tiro inferior (diagonal)
            boss.projectiles.push({ x: bird.x + bird.width, y: bird.y + bird.height / 2, vx: 7.5, vy: 1.5, size: size * 0.8, type: type });
        } else {
            // Tiro normal
            boss.projectiles.push({
                x: bird.x + bird.width, y: bird.y + bird.height / 2,
                vx: 8, vy: 0, size: size, type: type
            });
        }

        gameProps.playerShotsFired++;
        if (gameProps.playerShotsFired >= 2) {
            gameProps.playerAttackCooldown = 240; // Recarga de 4 segundos após 2 tiros
            gameProps.playerShotsFired = 0;
        } else {
            gameProps.playerAttackCooldown = 10; // Tiro rápido no burst (mais ágil)
        }
    }
}

function handleInput(e) {
    // Tenta retomar o contexto de áudio em qualquer interação do usuário
    resumeAudio();

    // Normalização de input (Touch vs Mouse)
    let clientX, clientY;
    if (e.type === 'touchstart') {
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
    } else if (e.type === 'click' || e.type === 'wheel') {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Calcular posição relativa ao canvas
    let x, y;
    if (clientX !== undefined && clientY !== undefined) {
        const rect = canvas.getBoundingClientRect();
        x = clientX - rect.left;
        y = clientY - rect.top;
    }

    if (gameProps.isShopOpen) {
        if (e.type === 'click') {
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
            handleMissionClick(x, y);
        }
        if (e.type === 'wheel') {
            handleMissionScroll(e);
        }
        return;
    }

    // Para Gameplay e Menu, usamos touchstart para resposta instantânea
    const isAction = e.type === 'click' || e.type === 'touchstart';

    // Prevenir comportamento padrão no touchstart (zoom, scroll, clique fantasma)
    // Apenas se não estivermos na loja/missões
    if (e.type === 'touchstart' && e.cancelable) {
        e.preventDefault();
    }

    if (gameProps.isInMenu && isAction) {
        const action = handleMenuClick(x, y);
        if (action) playGlitch();

        if (action === 'start') {
            gameProps.isInMenu = false;
            gameProps.isHardcoreMode = false;
            startWaitingPeriod();
        } else if (action === 'shop') {
            // Garante que os dados da loja e moedas estão carregados antes de abrir
            if (!gameProps.shopData) gameProps.shopData = getShopData();
            if (gameProps.totalCoins === 0) gameProps.totalCoins = getTotalCoins();

            gameProps.isShopOpen = true;
            gameProps.menuFadeInTimer = 30;
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
            gameProps.menuFadeInTimer = 30;
        }
        return;
    }

    // Botão de sair durante a partida
    const exitButtonRect = { x: canvas.width - 40, y: canvas.height - 40, w: 30, h: 30 };
    if (!gameProps.isGameOver && !gameProps.isInMenu && isAction) {
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
        // Se não clicou em botões, o código continuará para processar o pulo
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

    if (e.type === 'keydown' && e.code === 'KeyG' && !gameProps.isGameOver) {
        activateTripleShot();
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
        
        if (isAction || (e.type === 'keydown' && e.code === 'Space')) {
            playGlitch(); // Som de clique ao reiniciar
            startWaitingPeriod();
        }
    } else {
        if (isAction || (e.type === 'keydown' && e.code === 'Space')) {
            bird.jumpAction();
        }
    }
}

document.addEventListener('keydown', handleInput);
canvas.addEventListener('click', handleInput);
canvas.addEventListener('wheel', handleInput);

// Suporte a Scroll por Toque (Mobile) e Resposta Rápida (Jump)
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    handleInput(e); // Passa o evento touchstart para processamento imediato
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

// Efeito de Paralaxe com Giroscópio (Mobile)
window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null && e.beta !== null) {
        // Limita o tilt para evitar movimentos exagerados
        const tiltX = Math.min(Math.max(e.gamma, -30), 30); 
        const tiltY = Math.min(Math.max(e.beta, -30), 30);
        
        gameProps.deviceOffsetX = tiltX; 
        gameProps.deviceOffsetY = tiltY;
    }
});

// Definir ícone do site
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.href = 'iconsite.png';
document.head.appendChild(favicon);

// Iniciar
initMovingTube();
initBackground();
loadAchievements();
loadMissions();
loop();