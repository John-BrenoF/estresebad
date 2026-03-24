import { gameProps, ctx, canvas } from './state.js';
import { saveTotalCoins } from './storage.js';
import { SKINS } from './constants.js';
import { playAchievementUnlock } from './audio.js';

const ACHIEVEMENTS = [
    { id: 'score_10', name: 'Novato', score: 10, reward: 25, unlocked: false },
    { id: 'score_25', name: 'Explorador', score: 25, reward: 50, unlocked: false },
    { id: 'score_50', name: 'Veterano', score: 50, reward: 100, unlocked: false },
    { id: 'score_100', name: 'Mestre dos Céus', score: 100, reward: 250, unlocked: false },
    { id: 'buy_5_skins', name: 'Colecionador', type: 'skins', count: 5, unlocked: false },
    { id: 'boss_no_damage', name: 'Intocável', type: 'boss_no_damage', reward: 1000, unlocked: false },
    { id: 'defeat_tosmos', name: 'Derrota do Boss Tosmos', type: 'defeat_boss', reward: 500, unlocked: false },
];

const notificationQueue = [];

export function loadAchievements() {
    const saved = localStorage.getItem('morcegoFlap_achievements');
    if (saved) {
        const unlockedIds = JSON.parse(saved);
        ACHIEVEMENTS.forEach(ach => {
            if (unlockedIds.includes(ach.id)) {
                ach.unlocked = true;
            }
        });
    }
}

export function checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
        if (!ach.unlocked && gameProps.score >= ach.score) {
            ach.unlocked = true;
            saveTotalCoins(ach.reward);
            showNotification(ach);
            saveAchievements();
        }
    });
}

export function checkSkinAchievements() {
    const skinAchievements = ACHIEVEMENTS.filter(a => a.type === 'skins' && !a.unlocked);
    if (skinAchievements.length === 0) return;

    const purchasedSkinIds = gameProps.shopData.purchasedSkins;
    const purchasedPaidSkins = purchasedSkinIds
        .map(id => SKINS.find(s => s.id === id))
        .filter(skin => skin && skin.price > 0);

    skinAchievements.forEach(ach => {
        if (purchasedPaidSkins.length >= ach.count) {
            ach.unlocked = true;

            let totalSpent = 0;
            purchasedPaidSkins.slice(0, ach.count).forEach(skin => {
                totalSpent += skin.price;
            });

            const reward = Math.floor(totalSpent * 0.5);
            const notificationData = { ...ach, reward: reward };

            saveTotalCoins(reward);
            showNotification(notificationData);
            saveAchievements();
        }
    });
}

export function checkBossAchievements() {
    // Conquista: Intocável (Sem tomar dano)
    const ach = ACHIEVEMENTS.find(a => a.type === 'boss_no_damage' && !a.unlocked);
    if (ach && gameProps.didDefeatBoss && !gameProps.bossPlayerTookDamage) {
        ach.unlocked = true;
        saveTotalCoins(ach.reward);
        showNotification(ach);
        saveAchievements();
    }

    // Conquista: Derrota do Boss Tosmos (Desbloqueia Dramuzos)
    const tosmosAch = ACHIEVEMENTS.find(a => a.id === 'defeat_tosmos' && !a.unlocked);
    // Verifica se derrotou o boss e se é o modo Boss normal (não Dramuzos)
    if (tosmosAch && gameProps.didDefeatBoss && gameProps.isBossMode) {
        tosmosAch.unlocked = true;
        saveTotalCoins(tosmosAch.reward);
        showNotification(tosmosAch);
        saveAchievements();
    }
}

function saveAchievements() {
    const unlockedIds = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('morcegoFlap_achievements', JSON.stringify(unlockedIds));
}

function showNotification(achievement) {
    notificationQueue.push({
        ...achievement,
        timer: 180 // 3 segundos
    });
    playAchievementUnlock();
}

export function drawAchievements() {
    if (notificationQueue.length === 0) return;

    const notification = notificationQueue[0];
    notification.timer--;

    const alpha = notification.timer > 30 ? 1.0 : notification.timer / 30;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width / 2 - 150, 80, 300, 60);
    ctx.strokeStyle = '#888888'; // Cinza para bordas
    ctx.strokeRect(canvas.width / 2 - 150, 80, 300, 60);

    ctx.fillStyle = '#8A2BE2'; // Roxo para detalhes
    ctx.font = 'bold 18px Changa';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 Conquista Desbloqueada!', canvas.width / 2, 105);
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Changa';
    ctx.fillText(`${notification.name} (+${notification.reward} 💰)`, canvas.width / 2, 130);
    ctx.restore();

    if (notification.timer <= 0) {
        notificationQueue.shift();
    }
}

export function isAchievementUnlocked(id) {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    return ach ? ach.unlocked : false;
}