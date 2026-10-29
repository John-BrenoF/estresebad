import { ctx, canvas, gameProps, u, UI_SCALE, isTouchUI, RENDER_SCALE, applyBaseTransform, fitFont } from './state.js';
import { saveTotalCoins, saveDramuzosPurchased } from './storage.js';
import { playBuy, playGlitch } from './audio.js';
import { isAchievementUnlocked } from './achievements.js';

// Retângulos de botões (escala maior no celular para facilitar o toque)
export const attackButtonRect = { x: u(20), y: canvas.height - u(150), w: u(70), h: u(70) };
export const shieldButtonRect = { x: canvas.width - u(90), y: canvas.height - u(150), w: u(70), h: u(70) };
export const furyButtonRect = { x: canvas.width - u(90), y: canvas.height - u(230), w: u(70), h: u(70) };
export const menuReturnButtonRect = { x: u(20), y: u(20), w: u(80), h: u(40) };
export const immunityButtonRect = { x: u(20), y: canvas.height - u(70), w: u(50), h: u(50) };
export const magnetButtonRect = { x: u(80), y: canvas.height - u(70), w: u(50), h: u(50) };
export const slowMoButtonRect = { x: u(140), y: canvas.height - u(70), w: u(50), h: u(50) };
// Novo botão para o Dramuzos
export const dramuzosButtonRect = { x: canvas.width / 2 - u(125), y: canvas.height / 2 + u(120), w: u(250), h: u(50) };
// Botão de sair do jogo (maior no celular)
const EXIT_BTN_SIZE = isTouchUI ? 46 : 30;
export const exitButtonRect = { x: canvas.width - EXIT_BTN_SIZE - 10, y: canvas.height - EXIT_BTN_SIZE - 10, w: EXIT_BTN_SIZE, h: EXIT_BTN_SIZE };

// Helper para desenhar fundo borrado (Glassmorphism)
export function drawBackdropBlur() {
    ctx.save();
    // Aplica o blur no conteúdo atual do canvas
    // (o filtro não acompanha a matriz de transformação, então compensamos a escala de render)
    ctx.filter = `blur(${6 * RENDER_SCALE}px)`;
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Camada escura transparente para contraste
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Cache para a tela de espera (para evitar re-aplicar blur em loop sem limpar)
let cachedWaitBackground = null;
let lastWaitStartTime = 0;

function getCachedWaitBackground() {
    // Se mudou o tempo de início, é uma nova espera: gerar novo snapshot
    if (gameProps.waitStartTime !== lastWaitStartTime || !cachedWaitBackground) {
        lastWaitStartTime = gameProps.waitStartTime;
        cachedWaitBackground = document.createElement('canvas');
        cachedWaitBackground.width = canvas.width;
        cachedWaitBackground.height = canvas.height;
        const bCtx = cachedWaitBackground.getContext('2d');
        
        // Desenha o estado atual do jogo (fundo) com blur
        bCtx.filter = 'blur(8px)';
        bCtx.drawImage(canvas, 0, 0, cachedWaitBackground.width, cachedWaitBackground.height);
        
        // Aplica o overlay escuro no snapshot
        bCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        bCtx.fillRect(0, 0, cachedWaitBackground.width, cachedWaitBackground.height);
    }
    return cachedWaitBackground;
}

export function drawScore() {
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.font = `${u(35)}px Changa`;
    ctx.fillText(gameProps.score, canvas.width / 2 - u(10), u(50));
    ctx.strokeText(gameProps.score, canvas.width / 2 - u(10), u(50));

    // Botão de Sair (compartilha o retângulo com o clique em main.js)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(exitButtonRect.x, exitButtonRect.y, exitButtonRect.w, exitButtonRect.h);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(exitButtonRect.x, exitButtonRect.y, exitButtonRect.w, exitButtonRect.h);
    ctx.fillStyle = '#FFF';
    ctx.font = `${u(20)}px Changa`;
    ctx.textAlign = 'center';
    ctx.fillText('X', exitButtonRect.x + exitButtonRect.w / 2, exitButtonRect.y + exitButtonRect.h * 0.72);
    ctx.textAlign = 'left';
    
    ctx.font = `${u(12)}px Changa`;
    ctx.fillText("Vel: " + gameProps.gameSpeed.toFixed(1), u(10), u(20));

    // Desenhar Moedas
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.fillText("🪙" + gameProps.currentCoins, u(10), u(40));

    // UI da Carta de Imunidade
    if (gameProps.shopData) {
        ctx.font = `${u(14)}px Changa`;
        if (gameProps.isHardcoreMode) {
            ctx.fillStyle = '#FF4444';
            ctx.fillText('HARDCORE', canvas.width - u(120), u(20));
            return; // Não mostra outros powerups no modo hardcore
        }
        
        // --- Botão de Imunidade [E] (Mobile/Bottom) ---
        if (!gameProps.isDramuzosMode && gameProps.shopData.immunityCards > 0 && gameProps.cardCooldownTimer <= 0 && !gameProps.isImmune) {
            ctx.fillStyle = 'rgba(138, 43, 226, 0.5)';
            ctx.fillRect(immunityButtonRect.x, immunityButtonRect.y, immunityButtonRect.w, immunityButtonRect.h);
            
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(immunityButtonRect.x, immunityButtonRect.y, immunityButtonRect.w, immunityButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.textAlign = "center";
            ctx.font = `${u(24)}px Changa`;
            ctx.fillText("🛡️", immunityButtonRect.x + immunityButtonRect.w / 2, immunityButtonRect.y + immunityButtonRect.h * 0.70);
            
            // Contador
            ctx.fillStyle = '#00FFFF';
            ctx.font = `bold ${u(14)}px Changa`;
            ctx.textAlign = "right";
            ctx.fillText(gameProps.shopData.immunityCards, immunityButtonRect.x + immunityButtonRect.w - u(5), immunityButtonRect.y + u(15));
            ctx.textAlign = "left";
        }
        
        if (gameProps.isImmune) {
            ctx.fillStyle = '#8A2BE2'; // Roxo
            ctx.textAlign = "left";
            ctx.fillText(`ESCUDO ATIVO!`, u(20), canvas.height - u(80));
        }

        // --- Botão de Ímã [M] ---
        if (!gameProps.isDramuzosMode && gameProps.magnetCooldownTimer <= 0 && !gameProps.isMagnetActive) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.fillRect(magnetButtonRect.x, magnetButtonRect.y, magnetButtonRect.w, magnetButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(magnetButtonRect.x, magnetButtonRect.y, magnetButtonRect.w, magnetButtonRect.h);
            ctx.textAlign = "center";
            ctx.font = `${u(24)}px Changa`;
            ctx.fillText("🧲", magnetButtonRect.x + magnetButtonRect.w / 2, magnetButtonRect.y + magnetButtonRect.h * 0.70);
            ctx.textAlign = "left";
        }

        if (gameProps.isMagnetActive) {
            ctx.fillStyle = '#8A2BE2'; // Roxo
            ctx.textAlign = "left";
            ctx.fillText(`ÍMÃ ATIVO!`, u(80), canvas.height - u(80));
        }

        // --- Botão de Slow-Mo [T] ---
        if (!gameProps.isDramuzosMode && gameProps.shopData.slowMoCharges > 0 && gameProps.slowMoCooldownTimer <= 0 && !gameProps.isSlowMoActive) {
            ctx.fillStyle = 'rgba(0, 191, 255, 0.5)';
            ctx.fillRect(slowMoButtonRect.x, slowMoButtonRect.y, slowMoButtonRect.w, slowMoButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(slowMoButtonRect.x, slowMoButtonRect.y, slowMoButtonRect.w, slowMoButtonRect.h);
            ctx.textAlign = "center";
            ctx.font = `${u(24)}px Changa`;
            ctx.fillText("⏰", slowMoButtonRect.x + slowMoButtonRect.w / 2, slowMoButtonRect.y + slowMoButtonRect.h * 0.70);

            // Contador
            ctx.fillStyle = '#00FFFF';
            ctx.font = `bold ${u(14)}px Changa`;
            ctx.textAlign = "right";
            ctx.fillText(gameProps.shopData.slowMoCharges, slowMoButtonRect.x + slowMoButtonRect.w - u(5), slowMoButtonRect.y + u(15));
            ctx.textAlign = "left";
        }
        
        if (gameProps.isSlowMoActive) {
            ctx.fillStyle = '#8A2BE2'; // Roxo
            ctx.textAlign = "left";
            ctx.fillText(`SLOW-MO!`, u(140), canvas.height - u(80));
        }

        // UI do Player Attack (somente no modo boss)
        if (gameProps.isBossMode || gameProps.isDramuzosMode) {
            ctx.fillStyle = '#FFF';
            ctx.font = `${u(14)}px Changa`;
            ctx.fillText(isTouchUI ? `Ataque` : `Ataque [F]`, canvas.width - u(120), u(140));
            if (gameProps.playerAttackCooldown > 0) {
                ctx.fillStyle = '#FF6B6B';
                const cooldown = (gameProps.playerAttackCooldown / 60).toFixed(1);
                ctx.fillText(`Recarga: ${cooldown}s`, canvas.width - u(120), u(165));
            }

            // Botão de Ataque (Mobile)
            ctx.fillStyle = gameProps.playerAttackCooldown > 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(attackButtonRect.x, attackButtonRect.y, attackButtonRect.w, attackButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(attackButtonRect.x, attackButtonRect.y, attackButtonRect.w, attackButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = `${u(40)}px Changa`;
            ctx.textAlign = "center";
            ctx.fillText("⚔️", attackButtonRect.x + attackButtonRect.w/2, attackButtonRect.y + attackButtonRect.h * 0.72);
            ctx.textAlign = "left";

            // Botão de Escudo (Mobile)
            ctx.fillStyle = gameProps.playerShieldCooldown > 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 100, 255, 0.5)';
            ctx.fillRect(shieldButtonRect.x, shieldButtonRect.y, shieldButtonRect.w, shieldButtonRect.h);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(shieldButtonRect.x, shieldButtonRect.y, shieldButtonRect.w, shieldButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = `${u(40)}px Changa`;
            ctx.textAlign = "center";
            ctx.fillText("🛡️", shieldButtonRect.x + shieldButtonRect.w/2, shieldButtonRect.y + shieldButtonRect.h * 0.68);
            ctx.textAlign = "left";

            // Cooldown do Escudo (parte de baixo do botão)
            if (gameProps.playerShieldCooldown > 0) {
                ctx.fillStyle = '#FFF';
                ctx.font = `${u(18)}px Changa`;
                ctx.textAlign = "center";
                ctx.fillText((gameProps.playerShieldCooldown / 60).toFixed(1), shieldButtonRect.x + shieldButtonRect.w/2, shieldButtonRect.y + shieldButtonRect.h - u(6));
                ctx.textAlign = "left";
            }
        } else {
            // UI da Fúria (Modo Normal)
            ctx.fillStyle = '#FFF';
            ctx.font = `${u(14)}px Changa`;
            ctx.fillText(isTouchUI ? `Fúria: ${gameProps.furyCharge}/5` : `Fúria [Z]: ${gameProps.furyCharge}/5`, canvas.width - u(120), u(140));

            // Botão de Fúria
            const isReady = gameProps.furyCharge >= 5;
            ctx.fillStyle = isReady ? '#6A0DAD' : 'rgba(100, 100, 100, 0.5)'; // Roxo
            ctx.fillRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            ctx.strokeStyle = isReady ? '#8A2BE2' : '#FFF'; // Roxo
            ctx.lineWidth = 3;
            ctx.strokeRect(furyButtonRect.x, furyButtonRect.y, furyButtonRect.w, furyButtonRect.h);
            
            ctx.fillStyle = '#FFF';
            ctx.font = `${u(40)}px Changa`;
            ctx.textAlign = "center";
            ctx.fillText("🔥", furyButtonRect.x + furyButtonRect.w/2, furyButtonRect.y + furyButtonRect.h * 0.72);
            ctx.textAlign = "left";
        }
    }
}

export function drawWaitingScreen() {
    applyBaseTransform(); // É desenhada fora do loop principal (waitLoop)

    // Usa o snapshot borrado do fundo
    const bg = getCachedWaitBackground();
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }
    
    const elapsed = (Date.now() - gameProps.waitStartTime) / 1000;
    const remaining = Math.max(0, gameProps.selectedDelay - elapsed);
    const displayTime = remaining.toFixed(1);
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `bold ${u(28)}px Changa`;
    ctx.textAlign = "center";
    ctx.fillText("para quê a peça ?", canvas.width / 2, canvas.height / 2 - u(60));
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `bold ${u(60)}px Changa`;
    ctx.fillText(displayTime + "s", canvas.width / 2, canvas.height / 2 + u(10));
    
    ctx.fillStyle = '#FFF';
    ctx.font = `${u(16)}px Changa`;
    ctx.fillText(" ", canvas.width / 2, canvas.height / 2 + u(50));
    ctx.fillText(" ", canvas.width / 2, canvas.height / 2 + u(75));
    
    ctx.fillStyle = '#FFFFFF'; // branco
    ctx.font = `${u(13)}px Changa`;
    let timeText = "é normal erra durante a vida , mas vc já errou o tanto de 7 vidas em metade de uma";
    if (gameProps.selectedDelay === 0.2) timeText = "eu te mantenho preso usando seu estresse ❤️";
    else if (gameProps.selectedDelay === 1) timeText = "tu realmente é bom ?";
    else if (gameProps.selectedDelay === 3) timeText = "o seu estresse te faz permanecer na e no ciclo de dopamina derrotado!";
    else if (gameProps.selectedDelay === 10) timeText = "agora cada segundo demora um ano ?";
    fillTextWrapped(timeText, canvas.width / 2, canvas.height / 2 + u(105), canvas.width - u(20), u(17));
    
    ctx.textAlign = "left";
}

// Desenha um texto quebrando em várias linhas quando não cabe na largura máxima
function fillTextWrapped(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (line && ctx.measureText(test).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
}

export function drawGameOverScreen() {
    drawBackdropBlur();
    
    // Botão Discreto para Voltar ao Menu
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `bold ${u(18)}px Changa`;
    ctx.textAlign = 'left';
    ctx.fillText('🏠 MENU', menuReturnButtonRect.x, menuReturnButtonRect.y + menuReturnButtonRect.h - u(9));
    ctx.restore();
    
    let currentY = u(200);

    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `bold ${u(40)}px Changa`;
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, currentY);
    
    currentY += u(80);

    ctx.fillStyle = '#FFF';
    ctx.font = `${u(28)}px Changa`;
    ctx.fillText("Pontuação: " + gameProps.score, canvas.width / 2, currentY);
    
    if (gameProps.isNewHighScore) {
        currentY += u(40);
        ctx.fillStyle = '#8A2BE2'; // Roxo
        ctx.font = `bold ${u(26)}px Changa`;
        ctx.fillText("⭐ NOVO RECORDE! ⭐", canvas.width / 2, currentY);
    }

    currentY += u(60);

    // Estatísticas secundárias
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `${u(22)}px Changa`;
    ctx.fillText("🪙 " + gameProps.currentCoins, canvas.width / 2, currentY);
    
    currentY += u(35);
    
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `${u(22)}px Changa`;

    // Instruções na parte inferior
    ctx.fillStyle = '#AAAAAA'; // Cinza
    ctx.font = `${u(18)}px Changa`;
    ctx.fillText(" ", canvas.width / 2, canvas.height - u(80));
    ctx.fillText(" ", canvas.width / 2, canvas.height - u(55));
    
    ctx.textAlign = "left";
}

// Botões do menu principal (escala maior no celular)
const startButton = { x: canvas.width / 2 - u(125), y: canvas.height / 2 - u(60), w: u(250), h: u(50) };
const hardcoreButton = { x: canvas.width / 2 - u(125), y: canvas.height / 2, w: u(250), h: u(50) };
const bossButton = { x: canvas.width / 2 - u(125), y: canvas.height / 2 + u(60), w: u(250), h: u(50) };

// Ajuste de posições para caber o Dramuzos
const menuBtnW = u(80);
const menuBtnGap = u(20);
const menuRowStartX = canvas.width / 2 - menuBtnW - menuBtnGap / 2;
const shopButton = { x: menuRowStartX, y: canvas.height / 2 + u(190), w: menuBtnW, h: u(50) };
const missionsButton = { x: menuRowStartX + menuBtnW + menuBtnGap, y: canvas.height / 2 + u(190), w: menuBtnW, h: u(50) };


// Função auxiliar para desenhar botões 3D
export function draw3DButton(rect, color, text, fontSize = "30px") {
    // Sombra (Profundidade)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w, rect.h);

    // Borda Escura (Bottom/Right)
    ctx.fillStyle = '#555555'; // Cinza
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Cor Principal (Top/Left - Efeito de luz)
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.w - 4, rect.h - 4);

    // Texto (escala para o celular e reduz automaticamente se não caber)
    ctx.fillStyle = '#FFF';
    let px = Math.round(parseFloat(fontSize) * UI_SCALE);
    const maxWidth = rect.w - u(16);
    ctx.font = `${px}px Changa`;
    while (px > 9 && ctx.measureText(text).width > maxWidth) {
        px -= 1;
        ctx.font = `${px}px Changa`;
    }
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2 * RENDER_SCALE;
    ctx.textAlign = 'center';
    const textX = rect.x + rect.w / 2;
    const textY = rect.y + rect.h / 2 + px * 0.35;

    // Efeito Glitch no texto (looping)
    if (Math.random() < 0.02) { // Chance pequena a cada frame para o glitch acontecer
        const xOff = (Math.random() - 0.5) * 6;
        const yOff = (Math.random() - 0.5) * 6;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillText(text, textX + xOff, textY + yOff);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText(text, textX - xOff, textY - yOff);
        ctx.restore();
    }

    ctx.fillStyle = '#FFF';
    ctx.fillText(text, textX, textY);
    ctx.shadowBlur = (0) * RENDER_SCALE;
}

export function drawStartScreen() {
    drawBackdropBlur();

    // Título Pulsante
    const scale = 1 + Math.sin(Date.now() / 500) * 0.00;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 - u(120));
    ctx.scale(scale, scale);
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `bold ${u(45)}px Changa`;
    ctx.textAlign = "center";

    // Efeito Glitch no Título (looping)
    if (Math.random() < 0.04) { // Chance um pouco maior para o título
        const xOff = (Math.random() - 0.5) * 8;
        const yOff = (Math.random() - 0.5) * 8;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillText("ESTRESSEBAD", xOff, yOff);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText("ESTRESSEBAD", -xOff, -yOff);
        ctx.restore();
    }

    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.fillText("ESTRESSEBAD", 0, 0);
    ctx.restore();
    
    ctx.textAlign = "center"; // Centraliza o texto para todos os botões

    // Botão Iniciar
    draw3DButton(startButton, '#6A0DAD', "Iniciar");

    // Botão Hardcore
    draw3DButton(hardcoreButton, '#6A0DAD', "Hardcore");

    // Botão Boss Rush
    draw3DButton(bossButton, '#6A0DAD', "Boss Rush");

    // Botão Dramuzos (Desbloqueável)
    const isTosmosDefeated = isAchievementUnlocked('defeat_tosmos');
    const isUnlocked = isTosmosDefeated || gameProps.dramuzosPurchased;

    if (isUnlocked) {
        draw3DButton(dramuzosButtonRect, '#8B0000', "Dramuzos");
    } else {
        // Lógica de Compra / Bloqueio
        const price = 4310;
        const canAfford = gameProps.totalCoins >= price;
        // Se tiver dinheiro, mostra o preço em roxo (compravel), senão mostra status de bloqueio
        const btnColor = canAfford ? '#4B0082' : '#333';
        const btnText = canAfford ? `Desbloquear: ${price} 💰` : `Bloqueado (Derrote Tosmos)`;
        
        draw3DButton(dramuzosButtonRect, btnColor, btnText, canAfford ? "22px" : "30px");
    }

    // Botão Loja
    draw3DButton(shopButton, '#6A0DAD', "Loja", "22px");

    // Botão Missões
    draw3DButton(missionsButton, '#6A0DAD', "Missões", "22px");

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
    // Clicou em Dramuzos
    const isTosmosDefeated = isAchievementUnlocked('defeat_tosmos');
    const isUnlocked = isTosmosDefeated || gameProps.dramuzosPurchased;
    
    if (x > dramuzosButtonRect.x && x < dramuzosButtonRect.x + dramuzosButtonRect.w && y > dramuzosButtonRect.y && y < dramuzosButtonRect.y + dramuzosButtonRect.h) {
        if (isUnlocked) {
            return 'dramuzos';
        } else {
            // Tenta comprar
            const price = 4310;
            if (gameProps.totalCoins >= price) {
                gameProps.totalCoins -= price;
                saveTotalCoins(-price); // Deduz moedas
                gameProps.dramuzosPurchased = true;
                saveDramuzosPurchased(true); // Salva permanente
                playBuy();
                playGlitch();
                return 'dramuzos'; // Inicia imediatamente
            }
        }
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