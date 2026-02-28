import { ctx, canvas, gameProps } from './state.js';
import { getHighScores } from './storage.js';

export const attackButtonRect = { x: 20, y: canvas.height - 150, w: 70, h: 70 };
export const shieldButtonRect = { x: canvas.width - 90, y: canvas.height - 150, w: 70, h: 70 };
export const furyButtonRect = { x: canvas.width - 90, y: canvas.height - 230, w: 70, h: 70 };

export function drawScore() {
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.font = "35px Changa";
    ctx.fillText(gameProps.score, canvas.width / 2 - 10, 50);
    ctx.strokeText(gameProps.score, canvas.width / 2 - 10, 50);

    // Botão de Sair
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 40, canvas.height - 40, 30, 30);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - 40, canvas.height - 40, 30, 30);
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Changa';
    ctx.fillText('X', canvas.width - 33, canvas.height - 17);
    
    ctx.font = "12px Changa";
    ctx.fillText("Vel: " + gameProps.gameSpeed.toFixed(1), 10, 20);

    // Desenhar Moedas
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.fillText("💰 " + gameProps.currentCoins, 10, 40);

    // UI da Carta de Imunidade
    if (gameProps.shopData) {
        ctx.font = "14px Changa";
        if (gameProps.isHardcoreMode) {
            ctx.fillStyle = '#FF4444';
            ctx.fillText('HARDCORE', canvas.width - 120, 20);
            return; // Não mostra outros powerups no modo hardcore
        }
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Imune [E]: ${gameProps.shopData.immunityCards}`, canvas.width - 120, 20);
        if (gameProps.isImmune) {
            ctx.fillStyle = '#8A2BE2'; // Roxo
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
            ctx.fillStyle = '#8A2BE2'; // Roxo
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
            ctx.fillStyle = '#8A2BE2'; // Roxo
            ctx.fillText(`ATIVO!`, canvas.width - 120, 120);
        } else if (gameProps.slowMoCooldownTimer > 0) {
            ctx.fillStyle = '#FF6B6B';
            const cooldown = (gameProps.slowMoCooldownTimer / 60).toFixed(1);
            ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - 120, 120);
        }

        // UI do Player Attack (somente no modo boss)
        if (gameProps.isBossMode) {
            ctx.fillStyle = '#FFF';
            ctx.font = "14px Changa";
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
            ctx.font = "40px Changa";
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
            ctx.font = "40px Changa";
            ctx.textAlign = "center";
            ctx.fillText("🛡️", shieldButtonRect.x + shieldButtonRect.w/2, shieldButtonRect.y + 50);
            ctx.textAlign = "left";

            // Cooldown do Escudo
            if (gameProps.playerShieldCooldown > 0) {
                ctx.fillStyle = '#FFF';
                ctx.font = "20px Changa";
                ctx.fillText((gameProps.playerShieldCooldown / 60).toFixed(1), shieldButtonRect.x + 25, shieldButtonRect.y + 40);
            }
        } else {
            // UI da Fúria (Modo Normal)
            ctx.fillStyle = '#FFF';
            ctx.font = "14px Changa";
            ctx.fillText(`Fúria [Z]: ${gameProps.furyCharge}/5`, canvas.width - 120, 140);

            // Botão de Fúria
            const isReady = gameProps.furyCharge >= 5;
            ctx.fillStyle = isReady ? '#6A0DAD' : 'rgba(100, 100, 100, 0.5)'; // Roxo
            ctx.fillRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            ctx.strokeStyle = isReady ? '#8A2BE2' : '#FFF'; // Roxo
            ctx.lineWidth = 3;
            ctx.strokeRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = "40px Changa";
            ctx.textAlign = "center";
            ctx.fillText("🔥", furyButtonRect.x + furyButtonRect.w/2, furyButtonRect.y + 50);
            ctx.textAlign = "left";
        }
    }
}

export function drawWaitingScreen() {
    ctx.fillStyle = '#000000'; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const elapsed = (Date.now() - gameProps.waitStartTime) / 1000;
    const remaining = Math.max(0, gameProps.selectedDelay - elapsed);
    const displayTime = remaining.toFixed(1);
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 28px Changa";
    ctx.textAlign = "center";
    ctx.fillText("⏰ AGUARDE!", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 60px Changa";
    ctx.fillText(displayTime + "s", canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "16px Changa";
    ctx.fillText("O jogo iniciará automaticamente", canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText("após a contagem regressiva.", canvas.width / 2, canvas.height / 2 + 75);
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "14px Changa";
    let timeText = "";
    if (gameProps.selectedDelay === 0.2) timeText = "Rápido! (0.2s)";
    else if (gameProps.selectedDelay === 1) timeText = "Curto (1s)";
    else if (gameProps.selectedDelay === 3) timeText = "Médio (3s)";
    else if (gameProps.selectedDelay === 10) timeText = "Longo (10s)";
    ctx.fillText("Tempo sorteado: " + timeText, canvas.width / 2, canvas.height / 2 + 110);
    
    ctx.textAlign = "left";
}

export function drawGameOverScreen() {
    ctx.fillStyle = '#000000'; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let currentY = 200;

    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 40px Changa";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, currentY);
    
    currentY += 80;

    ctx.fillStyle = '#FFF';
    ctx.font = "28px Changa";
    ctx.fillText("Pontuação: " + gameProps.score, canvas.width / 2, currentY);
    
    if (gameProps.isNewHighScore) {
        currentY += 40;
        ctx.fillStyle = '#8A2BE2'; // Roxo
        ctx.font = "bold 26px Changa";
        ctx.fillText("⭐ NOVO RECORDE! ⭐", canvas.width / 2, currentY);
    }

    currentY += 60;

    // Estatísticas secundárias
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "22px Changa";
    ctx.fillText("💰 Moedas Coletadas: " + gameProps.currentCoins, canvas.width / 2, currentY);
    
    currentY += 35;
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "22px Changa";
    ctx.fillText("⚡ Raios Sobrevividos: " + gameProps.lightningSurvived, canvas.width / 2, currentY);

    // Instruções na parte inferior
    ctx.fillStyle = '#AAAAAA'; // Cinza
    ctx.font = "18px Changa";
    ctx.fillText("Clique ou Espaço para sortear tempo", canvas.width / 2, canvas.height - 80);
    ctx.fillText("e iniciar nova partida", canvas.width / 2, canvas.height - 55);
    ctx.fillText("Pressione 'L' para ir à Loja", canvas.width / 2, canvas.height - 30);
    
    ctx.textAlign = "left";
}

const startButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 - 30, w: 250, h: 50 };
const hardcoreButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 30, w: 250, h: 50 };
const bossButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 90, w: 250, h: 50 };
const shopButton = { x: canvas.width / 2 - 125, y: canvas.height / 2 + 150, w: 120, h: 50 };
const missionsButton = { x: canvas.width / 2 + 5, y: canvas.height / 2 + 150, w: 120, h: 50 };

// Função auxiliar para desenhar botões 3D
function draw3DButton(rect, color, text, fontSize = "30px") {
    // Sombra (Profundidade)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w, rect.h);

    // Borda Escura (Bottom/Right)
    ctx.fillStyle = '#555555'; // Cinza
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Cor Principal (Top/Left - Efeito de luz)
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.w - 4, rect.h - 4);

    // Texto
    ctx.fillStyle = '#FFF';
    ctx.font = fontSize + " Changa";
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;

    // Efeito Glitch no texto
    if (gameProps.rgbSplitTimer > 0 && Math.random() < 0.5) {
        const xOff = (Math.random() - 0.5) * 8;
        const yOff = (Math.random() - 0.5) * 8;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillText(text, rect.x + rect.w / 2 - 2 + xOff, rect.y + rect.h / 2 + 10 + yOff);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText(text, rect.x + rect.w / 2 - 2 - xOff, rect.y + rect.h / 2 + 10 - yOff);
        ctx.restore();
    }

    ctx.fillStyle = '#FFF';
    ctx.fillText(text, rect.x + rect.w / 2 - 2, rect.y + rect.h / 2 + 10);
    ctx.shadowBlur = 0;
}

export function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título Pulsante
    const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 - 120);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 45px Changa";
    ctx.textAlign = "center";

    // Efeito Glitch no Título
    if (gameProps.rgbSplitTimer > 0 && Math.random() < 0.7) {
        const xOff = (Math.random() - 0.5) * 10;
        const yOff = (Math.random() - 0.5) * 10;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillText("MORCEGO FLAP", xOff, yOff);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText("MORCEGO FLAP", -xOff, -yOff);
        ctx.restore();
    }

    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.fillText("MORCEGO FLAP", 0, 0);
    ctx.restore();
    
    ctx.textAlign = "center"; // Centraliza o texto para todos os botões

    // Botão Iniciar
    draw3DButton(startButton, '#6A0DAD', "Iniciar");

    // Botão Hardcore
    draw3DButton(hardcoreButton, '#6A0DAD', "Hardcore");

    // Botão Boss Rush
    draw3DButton(bossButton, '#6A0DAD', "Boss Rush");

    // Botão Loja
    draw3DButton(shopButton, '#6A0DAD', "Loja", "24px");

    // Botão Missões
    draw3DButton(missionsButton, '#6A0DAD', "Missões", "24px");

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