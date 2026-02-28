import { ctx, canvas, gameProps } from './state.js';
import { SKINS, CARD_PRICE, SLOWMO_PRICE } from './constants.js';
import { saveShopData } from './storage.js';
import { saveTotalCoins, getTotalCoins } from './storage.js';
import { playBuy, playGlitch } from './audio.js';
import { incrementMissionProgress } from './missions.js';

const shopItems = [];
const cardButton = {};
const exitButton = {};
const slowMoButton = {};
let scrollY = 0;
const itemHeight = 80;
const totalContentHeight = (SKINS.length + 2) * itemHeight;

function setupShopLayout() {
    shopItems.length = 0;
    SKINS.forEach((skin, index) => {
        shopItems.push({
            ...skin,
            rect: {
                x: 50,
                y: 150 + index * itemHeight,
                w: canvas.width - 100,
                h: 70
            }
        });
    });

    cardButton.rect = { x: 50, y: 150 + SKINS.length * itemHeight, w: canvas.width - 100, h: 70 };
    slowMoButton.rect = { x: 50, y: 150 + (SKINS.length + 1) * itemHeight, w: canvas.width - 100, h: 70 };
    exitButton.rect = { x: canvas.width / 2 - 75, y: canvas.height - 120, w: 150, h: 50 };
}

export function drawShop() {
    if (shopItems.length === 0) setupShopLayout();

    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 40px Changa";
    ctx.textAlign = "center";
    ctx.fillText("LOJA", canvas.width / 2, 80);

    // Moedas
    ctx.font = "24px Changa";
    ctx.fillText(`💰 ${gameProps.totalCoins}`, canvas.width / 2, 120);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 140, canvas.width, canvas.height - 280);
    ctx.clip();
    ctx.translate(0, -scrollY);

    // Itens (Skins)
    shopItems.forEach(item => {
        const isOwned = gameProps.shopData.purchasedSkins.includes(item.id);
        const isEquipped = gameProps.shopData.equippedSkin === item.id;

        ctx.fillStyle = isEquipped ? '#330033' : '#222222'; // Fundo preto, roxo escuro se equipado
        ctx.fillRect(item.rect.x, item.rect.y, item.rect.w - 20, item.rect.h);
        ctx.strokeStyle = isEquipped ? '#6A0DAD' : '#888888'; // Borda cinza, roxa se equipado
        ctx.strokeRect(item.rect.x, item.rect.y, item.rect.w - 20, item.rect.h);

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.rect.x + 40, item.rect.y + 35, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.font = "20px Changa";
        ctx.textAlign = "left";
        ctx.fillText(item.name, item.rect.x + 80, item.rect.y + 30);

        ctx.font = "16px Changa";
        if (isOwned) {
            ctx.fillStyle = isEquipped ? '#8A2BE2' : '#CCCCCC'; // Roxo se equipado
            ctx.fillText(isEquipped ? "Equipado" : "Equipar", item.rect.x + 80, item.rect.y + 55);
        } else {
            ctx.fillStyle = gameProps.totalCoins >= item.price ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
            ctx.fillText(`Comprar: ${item.price} 💰`, item.rect.x + 80, item.rect.y + 55);
        }
    });

    // Botão de Comprar Carta
    ctx.fillStyle = '#222222'; // Fundo preto
    ctx.fillRect(cardButton.rect.x, cardButton.rect.y, cardButton.rect.w - 20, cardButton.rect.h);
    ctx.strokeStyle = '#888888'; // Borda cinza
    ctx.strokeRect(cardButton.rect.x, cardButton.rect.y, cardButton.rect.w - 20, cardButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = "left";
    ctx.font = "20px Changa";
    ctx.fillText(`Carta de Imunidade [E] (x${gameProps.shopData.immunityCards})`, cardButton.rect.x + 20, cardButton.rect.y + 30);
    ctx.fillStyle = gameProps.totalCoins >= CARD_PRICE ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
    ctx.font = "16px Changa";
    ctx.fillText(`Comprar 1 por: ${CARD_PRICE} 💰`, cardButton.rect.x + 20, cardButton.rect.y + 55);

    // Botão de Comprar Slow-Mo
    ctx.fillStyle = '#222222'; // Fundo preto
    ctx.fillRect(slowMoButton.rect.x, slowMoButton.rect.y, slowMoButton.rect.w - 20, slowMoButton.rect.h);
    ctx.strokeStyle = '#888888'; // Borda cinza
    ctx.strokeRect(slowMoButton.rect.x, slowMoButton.rect.y, slowMoButton.rect.w - 20, slowMoButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = "left";
    ctx.font = "20px Changa";
    ctx.fillText(`Carga de Slow-Mo [T] (x${gameProps.shopData.slowMoCharges})`, slowMoButton.rect.x + 20, slowMoButton.rect.y + 30);
    ctx.fillStyle = gameProps.totalCoins >= SLOWMO_PRICE ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
    ctx.font = "16px Changa";
    ctx.fillText(`Comprar 1 por: ${SLOWMO_PRICE} 💰`, slowMoButton.rect.x + 20, slowMoButton.rect.y + 55);

    ctx.restore();

    // Barra de Scroll
    const scrollbarHeight = (canvas.height - 280);
    const thumbHeight = scrollbarHeight * (scrollbarHeight / totalContentHeight);
    const thumbY = (scrollY / (totalContentHeight - scrollbarHeight)) * (scrollbarHeight - thumbHeight);
    ctx.fillStyle = '#555';
    ctx.fillRect(canvas.width - 15, 140, 10, scrollbarHeight);
    ctx.fillStyle = '#888';
    ctx.fillRect(canvas.width - 15, 140 + thumbY, 10, thumbHeight);

    // Botão de Sair
    ctx.fillStyle = '#6A0DAD'; // Roxo
    ctx.fillRect(exitButton.rect.x, exitButton.rect.y, exitButton.rect.w, exitButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.font = "24px Changa";
    ctx.textAlign = "center";
    ctx.fillText("Sair", canvas.width / 2, exitButton.rect.y + 33);
}

export function handleShopClick(x, y) {
    const adjustedY = y + scrollY;

    // Clicou em Sair
    if (x > exitButton.rect.x && x < exitButton.rect.x + exitButton.rect.w && y > exitButton.rect.y && y < exitButton.rect.y + exitButton.rect.h) {
        gameProps.isShopOpen = false;
        gameProps.menuFadeInTimer = 30; // Ativa o fade-in para o menu principal
        return;
    }

    // Clicou em Comprar Carta
    if (x > cardButton.rect.x && x < cardButton.rect.x + cardButton.rect.w && adjustedY > cardButton.rect.y && adjustedY < cardButton.rect.y + cardButton.rect.h) {
        if (gameProps.totalCoins >= CARD_PRICE) {
            gameProps.totalCoins -= CARD_PRICE;
            gameProps.shopData.immunityCards++;
            saveTotalCoins(-CARD_PRICE);
            saveShopData(gameProps.shopData);
            playBuy();
            playGlitch(); // Som de clique/feedback
            incrementMissionProgress('buy_item');
        }
    }

    // Clicou em Comprar Slow-Mo
    if (x > slowMoButton.rect.x && x < slowMoButton.rect.x + slowMoButton.rect.w && adjustedY > slowMoButton.rect.y && adjustedY < slowMoButton.rect.y + slowMoButton.rect.h) {
        if (gameProps.totalCoins >= SLOWMO_PRICE) {
            gameProps.totalCoins -= SLOWMO_PRICE;
            gameProps.shopData.slowMoCharges++;
            saveTotalCoins(-SLOWMO_PRICE);
            saveShopData(gameProps.shopData);
            playBuy();
            playGlitch(); // Som de clique/feedback
            incrementMissionProgress('buy_item');
        }
    }

    // Clicou em um item de Skin
    shopItems.forEach(item => {
        if (x > item.rect.x && x < item.rect.x + item.rect.w && adjustedY > item.rect.y && adjustedY < item.rect.y + item.rect.h) {
            const isOwned = gameProps.shopData.purchasedSkins.includes(item.id);
            if (isOwned) {
                // Equipar
                gameProps.shopData.equippedSkin = item.id;
                playGlitch(); // Som de clique/feedback
                saveShopData(gameProps.shopData);
            } else {
                // Comprar
                if (gameProps.totalCoins >= item.price) {
                    gameProps.totalCoins -= item.price;
                    gameProps.shopData.purchasedSkins.push(item.id);
                    saveTotalCoins(-item.price);
                    saveShopData(gameProps.shopData);
                    playBuy();
                    playGlitch(); // Som de clique/feedback
                    incrementMissionProgress('buy_item');
                }
            }
        }
    });
}

export function handleShopScroll(event) {
    scrollY += event.deltaY * 0.5;
    const maxScroll = totalContentHeight - (canvas.height - 280);
    if (scrollY < 0) scrollY = 0;
    if (scrollY > maxScroll) scrollY = maxScroll;
}