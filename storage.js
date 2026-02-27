import { HIGH_SCORES_KEY, COINS_KEY, SHOP_DATA_KEY, SKINS } from './constants.js';

export function getHighScores() {
    const scores = localStorage.getItem(HIGH_SCORES_KEY);
    return scores ? JSON.parse(scores) : [];
}

export function saveHighScore(score) {
    const highScores = getHighScores();
    const newScore = { score: score, date: new Date().toLocaleDateString() };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(3);
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    return highScores;
}

export function checkHighScore(score) {
    const highScores = getHighScores();
    if (highScores.length < 3) return true;
    return score > highScores[highScores.length - 1].score;
}

export function getTotalCoins() {
    const coins = localStorage.getItem(COINS_KEY);
    return coins ? parseInt(coins) : 0;
}

export function saveTotalCoins(amount) {
    const current = getTotalCoins();
    const newTotal = Math.max(0, current + amount);
    localStorage.setItem(COINS_KEY, newTotal.toString());
}

export function getShopData() {
    const data = localStorage.getItem(SHOP_DATA_KEY);
    if (data) {
        return JSON.parse(data);
    }
    // Dados padrão se nada estiver salvo
    return {
        purchasedSkins: [SKINS[0].id], // Skin padrão sempre comprada
        equippedSkin: SKINS[0].id,
        immunityCards: 0,
        slowMoCharges: 0,
    };
}

export function saveShopData(data) {
    localStorage.setItem(SHOP_DATA_KEY, JSON.stringify(data));
}