import { SCORE_HISTORY_KEY, COINS_KEY, SHOP_DATA_KEY, SKINS, BOSS_DEFEATED_COUNT_KEY, DRAMUZOS_PURCHASED_KEY } from './constants.js';

export function getScoreHistory() {
    const scores = localStorage.getItem(SCORE_HISTORY_KEY);
    return scores ? JSON.parse(scores) : [];
}

export function saveScoreToHistory(score) {
    const history = getScoreHistory();
    const newEntry = { score: score, date: new Date().toISOString() };
    
    history.push(newEntry);
    // Mantém o histórico dos últimos 50 jogos
    if (history.length > 50) {
        history.shift();
    }
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(history));
}

export function getTopScores(count = 3) {
    const history = getScoreHistory();
    // Cria uma cópia antes de ordenar para não modificar a ordem original do histórico
    const sorted = [...history].sort((a, b) => b.score - a.score);
    return sorted.slice(0, count);
}

export function checkHighScore(score) {
    const topScores = getTopScores(3);
    if (topScores.length < 3) return true;
    return score > topScores[topScores.length - 1].score;
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

export function getBossDefeatedCount() {
    const count = localStorage.getItem(BOSS_DEFEATED_COUNT_KEY);
    return count ? parseInt(count) : 0;
}

export function saveBossDefeatedCount(count) {
    localStorage.setItem(BOSS_DEFEATED_COUNT_KEY, count.toString());
}

export function getDramuzosPurchased() {
    const purchased = localStorage.getItem(DRAMUZOS_PURCHASED_KEY);
    return purchased === 'true';
}

export function saveDramuzosPurchased(isPurchased) {
    localStorage.setItem(DRAMUZOS_PURCHASED_KEY, isPurchased.toString());
}