import { ctx, canvas, gameProps, u, isTouchUI, fitFont } from './state.js';
import { SKINS, CARD_PRICE, SLOWMO_PRICE } from './constants.js';
import { saveShopData, saveTotalCoins } from './storage.js';
import { playBuy, playGlitch } from './audio.js';
import { incrementMissionProgress } from './missions.js';
import { checkSkinAchievements } from './achievements.js';

const shopItems = [];
const cardButton = {};
const exitButton = {};
const slowMoButton = {};
const shopSvgSkins = {};
let scrollY = 0;
const itemHeight = u(80);
const totalContentHeight = (SKINS.length + 2) * itemHeight;
const CLIP_TOP = 140;
const CONTENT_TOP = u(150);
const ITEM_PITCH = u(80);
const ITEM_H = u(70);

function loadShopSvgSkins() {
    const svgSkinData = SKINS.filter(s => s.isSvg);
    svgSkinData.forEach(skin => {
        const img = new Image();
        img.src = skin.svgPath;
        shopSvgSkins[skin.id] = {
            image: img,
            loaded: false
        };
        img.onload = () => {
            shopSvgSkins[skin.id].loaded = true;
        };
    });
}

function setupShopLayout() {
    shopItems.length = 0;
    SKINS.forEach((skin, index) => {
        shopItems.push({
            ...skin,
            rect: {
                x: u(50),
                y: CONTENT_TOP + index * itemHeight,
                w: canvas.width - u(100),
                h: ITEM_H
            }
        });
    });

    cardButton.rect = { x: u(50), y: CONTENT_TOP + SKINS.length * itemHeight, w: canvas.width - u(100), h: ITEM_H };
    slowMoButton.rect = { x: u(50), y: CONTENT_TOP + (SKINS.length + 1) * itemHeight, w: canvas.width - u(100), h: ITEM_H };
    exitButton.rect = { x: canvas.width / 2 - u(75), y: canvas.height - u(120), w: u(150), h: u(50) };
}

export function drawShop() {
    if (shopItems.length === 0) {
        setupShopLayout();
        loadShopSvgSkins();
    }

    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = `bold ${u(40)}px Changa`;
    ctx.textAlign = "center";
    ctx.fillText("LOJA", canvas.width / 2, u(80));

    // Moedas
    ctx.font = `${u(24)}px Changa`;
    ctx.fillText(`💰 ${gameProps.totalCoins}`, canvas.width / 2, u(120));

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
        ctx.fillRect(item.rect.x, item.rect.y, item.rect.w - u(20), item.rect.h);
        ctx.strokeStyle = isEquipped ? '#6A0DAD' : '#888888'; // Borda cinza, roxa se equipado
        ctx.strokeRect(item.rect.x, item.rect.y, item.rect.w - u(20), item.rect.h);
        
        if (item.isSvg) {
            const skinAsset = shopSvgSkins[item.id];
            if (skinAsset && skinAsset.loaded) {
                const image = skinAsset.image;
                const aspectRatio = image.naturalWidth / image.naturalHeight;
                const drawHeight = u(40);
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(image, item.rect.x + u(40) - drawWidth / 2, item.rect.y + item.rect.h / 2 - drawHeight / 2, drawWidth, drawHeight);
            }
        } else {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(item.rect.x + u(40), item.rect.y + item.rect.h / 2, u(20), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#FFF';
        ctx.textAlign = "left";
        fitFont(item.name, 20, item.rect.w - u(120));
        ctx.fillText(item.name, item.rect.x + u(80), item.rect.y + u(30));

        if (isOwned) {
            ctx.fillStyle = isEquipped ? '#8A2BE2' : '#CCCCCC'; // Roxo se equipado
            fitFont(isEquipped ? "Equipado" : "Equipar", 16, item.rect.w - u(120));
            ctx.fillText(isEquipped ? "Equipado" : "Equipar", item.rect.x + u(80), item.rect.y + u(55));
        } else {
            ctx.fillStyle = gameProps.totalCoins >= item.price ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
            fitFont(`Comprar: ${item.price} 💰`, 16, item.rect.w - u(120));
            ctx.fillText(`Comprar: ${item.price} 💰`, item.rect.x + u(80), item.rect.y + u(55));
        }
    });

    // Botão de Comprar Carta
    ctx.fillStyle = '#222222'; // Fundo preto
    ctx.fillRect(cardButton.rect.x, cardButton.rect.y, cardButton.rect.w - u(20), cardButton.rect.h);
    ctx.strokeStyle = '#888888'; // Borda cinza
    ctx.strokeRect(cardButton.rect.x, cardButton.rect.y, cardButton.rect.w - u(20), cardButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = "left";
    fitFont(`Carta de Imunidade${isTouchUI ? '' : ' [E]'} (x${gameProps.shopData.immunityCards})`, 20, cardButton.rect.w - u(40));
    ctx.fillText(`Carta de Imunidade${isTouchUI ? '' : ' [E]'} (x${gameProps.shopData.immunityCards})`, cardButton.rect.x + u(20), cardButton.rect.y + u(30));
    ctx.fillStyle = gameProps.totalCoins >= CARD_PRICE ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
    fitFont(`Comprar 1 por: ${CARD_PRICE} 💰`, 16, cardButton.rect.w - u(40));
    ctx.fillText(`Comprar 1 por: ${CARD_PRICE} 💰`, cardButton.rect.x + u(20), cardButton.rect.y + u(55));

    // Botão de Comprar Slow-Mo
    ctx.fillStyle = '#222222'; // Fundo preto
    ctx.fillRect(slowMoButton.rect.x, slowMoButton.rect.y, slowMoButton.rect.w - u(20), slowMoButton.rect.h);
    ctx.strokeStyle = '#888888'; // Borda cinza
    ctx.strokeRect(slowMoButton.rect.x, slowMoButton.rect.y, slowMoButton.rect.w - u(20), slowMoButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = "left";
    fitFont(`Carga de Slow-Mo${isTouchUI ? '' : ' [T]'} (x${gameProps.shopData.slowMoCharges})`, 20, slowMoButton.rect.w - u(40));
    ctx.fillText(`Carga de Slow-Mo${isTouchUI ? '' : ' [T]'} (x${gameProps.shopData.slowMoCharges})`, slowMoButton.rect.x + u(20), slowMoButton.rect.y + u(30));
    ctx.fillStyle = gameProps.totalCoins >= SLOWMO_PRICE ? '#8A2BE2' : '#FF6B6B'; // Roxo para comprar
    fitFont(`Comprar 1 por: ${SLOWMO_PRICE} 💰`, 16, slowMoButton.rect.w - u(40));
    ctx.fillText(`Comprar 1 por: ${SLOWMO_PRICE} 💰`, slowMoButton.rect.x + u(20), slowMoButton.rect.y + u(55));

    ctx.restore();

    // Barra de Scroll
    const scrollbarHeight = (canvas.height - 280);
    const maxScroll = getMaxShopScroll();
    const thumbHeight = scrollbarHeight * (scrollbarHeight / totalContentHeight);
    const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (scrollbarHeight - thumbHeight) : 0;
    ctx.fillStyle = '#555';
    ctx.fillRect(canvas.width - 15, CLIP_TOP, 10, scrollbarHeight);
    ctx.fillStyle = '#888';
    ctx.fillRect(canvas.width - 15, CLIP_TOP + thumbY, 10, thumbHeight);

    // Botão de Sair
    ctx.fillStyle = '#6A0DAD'; // Roxo
    ctx.fillRect(exitButton.rect.x, exitButton.rect.y, exitButton.rect.w, exitButton.rect.h);
    ctx.fillStyle = '#FFF';
    ctx.font = `${u(24)}px Changa`;
    ctx.textAlign = "center";
    ctx.fillText("Sair", canvas.width / 2, exitButton.rect.y + u(33));
    ctx.textAlign = "left";
}

// Limite de scroll: garante que o último item (Slow-Mo) fique totalmente visível
function getMaxShopScroll() {
    const clipBottom = CLIP_TOP + (canvas.height - 280);
    const contentBottom = CONTENT_TOP + totalContentHeight - ITEM_PITCH + ITEM_H;
    return Math.max(0, contentBottom - clipBottom);
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
                    checkSkinAchievements();
                }
            }
        }
    });
}

export function handleShopScroll(event) {
    scrollY += event.deltaY * 0.5;
    const maxScroll = getMaxShopScroll();
    if (scrollY < 0) scrollY = 0;
    if (scrollY > maxScroll) scrollY = maxScroll;
}