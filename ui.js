import { ctx, canvas, gameProps } from './state.js';
import { getHighScores } from './storage.js';

export const attackButtonRect = { x: 20, y: canvas.height - 150, w: 70, h: 70 };
export const shieldButtonRect = { x: canvas.width - 90, y: canvas.height - 150, w: 70, h: 70 };
export const furyButtonRect = { x: canvas.width - 90, y: canvas.height - 230, w: 70, h: 70 };

export function drawScore() {
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.font = "35px Arial";
    ctx.fillText(gameProps.score, canvas.width / 2 - 10, 50);
    ctx.strokeText(gameProps.score, canvas.width / 2 - 10, 50);

    // Botão de Sair
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 40, canvas.height - 40, 30, 30);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - 40, canvas.height - 40, 30, 30);
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('X', canvas.width - 33, canvas.height - 17);
    
    ctx.font = "12px Arial";
    ctx.fillText("Vel: " + gameProps.gameSpeed.toFixed(1), 10, 20);

    // Desenhar Moedas
    ctx.fillStyle = '#FFD700';
    ctx.fillText("💰 " + gameProps.currentCoins, 10, 40);

    // UI da Carta de Imunidade
    if (gameProps.shopData) {
        ctx.font = "14px Arial";
        if (gameProps.isHardcoreMode) {
            ctx.fillStyle = '#FF4444';
            ctx.fillText('HARDCORE', canvas.width - 120, 20);
            return; // Não mostra outros powerups no modo hardcore
        }
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Imune [E]: ${gameProps.shopData.immunityCards}`, canvas.width - 120, 20);
        if (gameProps.isImmune) {
            ctx.fillStyle = '#00FFFF';
            ctx.fillText(`ATIVO!`, canvas.width - 120, 40);
        } else if (gameProps.cardCooldownTimer > 0) {
            ctx.fillStyle = '#FF6B6B';
            const cooldown = (gameProps.cardCooldownTimer / 60).toFixed(1);
            ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - 120, 40);
        }

        // UI do Ímã
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Ímã [M]`, canvas.width - 120, 60);
        if (gameProps.isMagnetActive) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`ATIVO!`, canvas.width - 120, 80);
        } else if (gameProps.magnetCooldownTimer > 0) {
            ctx.fillStyle = '#FF6B6B';
            const cooldown = (gameProps.magnetCooldownTimer / 60).toFixed(1);
            ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - 120, 80);
        }

        // UI do Slow-Mo
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Slow-Mo [T]: ${gameProps.shopData.slowMoCharges}`, canvas.width - 120, 100);
        if (gameProps.isSlowMoActive) {
            ctx.fillStyle = '#4ECDC4';
            ctx.fillText(`ATIVO!`, canvas.width - 120, 120);
        } else if (gameProps.slowMoCooldownTimer > 0) {
            ctx.fillStyle = '#FF6B6B';
            const cooldown = (gameProps.slowMoCooldownTimer / 60).toFixed(1);
            ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - 120, 120);
        }

        // UI do Player Attack (somente no modo boss)
        if (gameProps.isBossMode) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(`Ataque [F]`, canvas.width - 120, 140);
            if (gameProps.playerAttackCooldown > 0) {
                ctx.fillStyle = '#FF6B6B';
                const cooldown = (gameProps.playerAttackCooldown / 60).toFixed(1);
                ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - 120, 160);
            }

            // Botão de Ataque (Mobile)
            ctx.fillStyle = gameProps.playerAttackCooldown > 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(attackButtonRect.x, attackButtonRect.y, attackButtonRect.w, attackButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(attackButtonRect.x, attackButtonRect.y, attackButtonRect.w, attackButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("⚔️", attackButtonRect.x + attackButtonRect.w/2, attackButtonRect.y + 50);
            ctx.textAlign = "left";

            // Botão de Escudo (Mobile)
            ctx.fillStyle = gameProps.playerShieldCooldown > 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 100, 255, 0.5)';
            ctx.fillRect(shieldButtonRect.x, shieldButtonRect.y, shieldButtonRect.w, shieldButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(shieldButtonRect.x, shieldButtonRect.y, shieldButtonRect.w, shieldButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🛡️", shieldButtonRect.x + shieldButtonRect.w/2, shieldButtonRect.y + 50);
            ctx.textAlign = "left";

            // Cooldown do Escudo
            if (gameProps.playerShieldCooldown > 0) {
                ctx.fillStyle = '#FFF';
                ctx.font = "20px Arial";
                ctx.fillText((gameProps.playerShieldCooldown / 60).toFixed(1), shieldButtonRect.x + 25, shieldButtonRect.y + 40);
            }
        } else {
            // UI da Fúria (Modo Normal)
            ctx.fillStyle = '#FFF';
            ctx.font = "14px Arial";
            ctx.fillText(`Fúria [Z]: ${gameProps.furyCharge}/5`, canvas.width - 120, 140);

            // Botão de Fúria
            const isReady = gameProps.furyCharge >= 5;
            ctx.fillStyle = isReady ? 'rgba(255, 69, 0, 0.8)' : 'rgba(100, 100, 100, 0.5)';
            ctx.fillRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            ctx.strokeStyle = isReady ? '#FFD700' : '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🔥", furyButtonRect.x + furyButtonRect.w/2, furyButtonRect.y + 50);
            ctx.textAlign = "left";
        }
    }
}

export function drawHighScores() {
    const highScores = getHighScores();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆 RANKING", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = "16px Arial";
    ctx.fillStyle = '#FFF';
    
    if (highScores.length === 0) {
        ctx.fillText("Sem pontuações ainda!", canvas.width / 2, canvas.height / 2 - 30);
    } else {
        highScores.forEach((s, index) => {
            ctx.fillText(`${index + 1}º - ${s.score} pts`, canvas.width / 2, canvas.height / 2 - 30 + (index * 25));
        });
    }
    
    ctx.textAlign = "left";
}

export function drawWaitingScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const elapsed = (Date.now() - gameProps.waitStartTime) / 1000;
    const remaining = Math.max(0, gameProps.selectedDelay - elapsed);
    const displayTime = remaining.toFixed(1);
    
    ctx.fillStyle = '#FF6B6B';
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⏰ AGUARDE!", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.fillStyle = '#4ECDC4';
    ctx.font = "bold 60px Arial";
    ctx.fillText(displayTime + "s", canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "16px Arial";
    ctx.fillText("O jogo iniciará automaticamente", canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText("após a contagem regressiva.", canvas.width / 2, canvas.height / 2 + 75);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = "14px Arial";
    let timeText = "";
    if (gameProps.selectedDelay === 0.2) timeText = "Rápido! (0.2s)";
    else if (gameProps.selectedDelay === 1) timeText = "Curto (1s)";
    else if (gameProps.selectedDelay === 3) timeText = "Médio (3s)";
    else if (gameProps.selectedDelay === 10) timeText = "Longo (10s)";
    ctx.fillText("Tempo sorteado: " + timeText, canvas.width / 2, canvas.height / 2 + 110);
    
    ctx.textAlign = "left";
}

export function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF4444';
    ctx.font = "35px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 100);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "25px Arial";
    ctx.fillText("Pontuação: " + gameProps.score, canvas.width / 2, canvas.height / 2 - 55);

    ctx.fillStyle = '#FFD700';
    ctx.font = "20px Arial";
    ctx.fillText("💰 Moedas: " + (gameProps.totalCoins + gameProps.currentCoins), canvas.width / 2, canvas.height / 2 - 80);

    ctx.fillStyle = '#FFFF00';
    ctx.font = "18px Arial";
    ctx.fillText("⚡ Raios Sobrevividos: " + gameProps.lightningSurvived, canvas.width / 2, canvas.height / 2 - 25);
    
    if (gameProps.isNewHighScore) {
        ctx.fillStyle = '#FFD700';
        ctx.font = "bold 22px Arial";
        ctx.fillText("⭐ NOVO RECORDE! ⭐", canvas.width / 2, canvas.height / 2 - 20);
    }
    
    drawHighScores();
    
    ctx.fillStyle = '#70c5ce';
    ctx.font = "18px Arial";
    ctx.fillText("Clique ou Espaço para sortear tempo", canvas.width / 2, canvas.height - 60);
    ctx.fillText("e iniciar nova partida", canvas.width / 2, canvas.height - 35);
    ctx.fillText("Pressione 'L' para ir à Loja", canvas.width / 2, canvas.height - 10);
    
    ctx.textAlign = "left";
}

const startButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 - 30, w: 250, h: 50 };
const hardcoreButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 30, w: 250, h: 50 };
const bossButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 90, w: 250, h: 50 };
const shopButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 150, w: 120, h: 50 };
const missionsButton = { x: canvas.width / 2 + 5, y: canvas.height / 2 + 150, w: 120, h: 50 };

export function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título Pulsante
    const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 - 120);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MORCEGO FLAP", 0, 0);
    ctx.restore();
    
    // Botão Iniciar
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(startButton.x, startButton.y, startButton.w, startButton.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "30px Arial";
    ctx.fillText("Iniciar", canvas.width / 2, startButton.y + 35);

    // Botão Hardcore
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(hardcoreButton.x, hardcoreButton.y, hardcoreButton.w, hardcoreButton.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "30px Arial";
    ctx.fillText("Hardcore", canvas.width / 2, hardcoreButton.y + 36);

    // Botão Boss Rush
    ctx.fillStyle = '#800080';
    ctx.fillRect(bossButton.x, bossButton.y, bossButton.w, bossButton.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "30px Arial";
    ctx.fillText("Boss Rush", canvas.width / 2, bossButton.y + 36);

    // Botão Loja
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(shopButton.x, shopButton.y, shopButton.w, shopButton.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "24px Arial";
    ctx.fillText("Loja", shopButton.x + shopButton.w / 2, shopButton.y + 34);

    // Botão Missões
    ctx.fillStyle = '#663399';
    ctx.fillRect(missionsButton.x, missionsButton.y, missionsButton.w, missionsButton.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "24px Arial";
    ctx.fillText("Missões", missionsButton.x + missionsButton.w / 2, missionsButton.y + 34);

    ctx.textAlign = "left";
}

export function handleMenuClick(x, y) {
    // Clicou em Iniciar
    if (x > startButton.x && x < startButton.x + startButton.w && y > startButton.y && y < startButton.y + startButton.h) {
        return 'start';
    }
    // Clicou em Hardcore
    if (x > hardcoreButton.x && x < hardcoreButton.x + hardcoreButton.w && y > hardcoreButton.y && y < hardcoreButton.y + hardcoreButton.h) {
        return 'hardcore';
    }
    // Clicou em Boss
    if (x > bossButton.x && x < bossButton.x + bossButton.w && y > bossButton.y && y < bossButton.y + bossButton.h) {
        return 'boss';
    }
    // Clicou em Loja
    if (x > shopButton.x && x < shopButton.x + shopButton.w && y > shopButton.y && y < shopButton.y + shopButton.h) {
        return 'shop';
    }
    // Clicou em Missões
    if (x > missionsButton.x && x < missionsButton.x + missionsButton.w && y > missionsButton.y && y < missionsButton.y + missionsButton.h) {
        return 'missions';
    }
    return null;
}