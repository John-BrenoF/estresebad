import { gameProps, ctx, canvas } from './state.js';
import { saveTotalCoins } from './storage.js';

const ACHIEVEMENTS = [
    { id: 'score_10', name: 'Novato', score: 10, reward: 25, unlocked: false },
    { id: 'score_25', name: 'Explorador', score: 25, reward: 50, unlocked: false },
    { id: 'score_50', name: 'Veterano', score: 50, reward: 100, unlocked: false },
    { id: 'score_100', name: 'Mestre dos Céus', score: 100, reward: 250, unlocked: false },
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

function saveAchievements() {
    const unlockedIds = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('morcegoFlap_achievements', JSON.stringify(unlockedIds));
}

function showNotification(achievement) {
    notificationQueue.push({
        ...achievement,
        timer: 180 // 3 segundos
    });
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
    ctx.strokeStyle = '#FFD700';
    ctx.strokeRect(canvas.width / 2 - 150, 80, 300, 60);

    ctx.fillStyle = '#FFD700';
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