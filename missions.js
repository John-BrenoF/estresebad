import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins } from './storage.js';

const MISSION_TYPES = [
    { id: 'score', text: 'Alcance a pontuação de', value: [20, 30, 50] },
    { id: 'coins', text: 'Colete', value: [10, 20, 30], suffix: 'moedas' },
    { id: 'survive_lightning', text: 'Sobreviva a', value: [1, 2, 3], suffix: 'raios' },
    { id: 'use_magnet', text: 'Use o Ímã', value: [1, 3, 5], suffix: 'vezes' },
    { id: 'use_slowmo', text: 'Use o Slow-Mo', value: [1, 3, 5], suffix: 'vezes' },
    { id: 'play_hardcore', text: 'Jogue partidas Hardcore', value: [1, 3], suffix: 'vezes' },
    { id: 'buy_item', text: 'Compre itens na loja', value: [1, 2], suffix: 'vezes' },
];

const REWARDS = [50, 75, 100];

let dailyMissions = [];

function generateMissions() {
    const missions = [];
    const usedTypes = new Set();

    while (missions.length < 3) {
        const type = MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)];
        if (!usedTypes.has(type.id)) {
            usedTypes.add(type.id);
            const value = type.value[Math.floor(Math.random() * type.value.length)];
            const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
            missions.push({
                id: `${type.id}_${value}`,
                text: `${type.text} ${value} ${type.suffix || ''}`.trim(),
                type: type.id,
                target: value,
                progress: 0,
                reward: reward,
                completed: false,
                claimed: false,
            });
        }
    }
    return missions;
}

export function loadMissions() {
    const saved = localStorage.getItem('morcegoFlap_missions');
    const lastMissionDate = localStorage.getItem('morcegoFlap_missionDate');
    const today = new Date().toDateString();

    if (saved && lastMissionDate === today) {
        dailyMissions = JSON.parse(saved);
    } else {
        dailyMissions = generateMissions();
        localStorage.setItem('morcegoFlap_missions', JSON.stringify(dailyMissions));
        localStorage.setItem('morcegoFlap_missionDate', today);
    }
}

export function updateMissionProgress() {
    if (gameProps.isGameOver) {
        dailyMissions.forEach(mission => {
            if (!mission.completed) {
                switch (mission.type) {
                    case 'score':
                        mission.progress = Math.max(mission.progress, gameProps.score);
                        break;
                    case 'coins':
                        mission.progress += gameProps.currentCoins;
                        break;
                    case 'survive_lightning':
                        mission.progress += gameProps.lightningSurvived;
                        break;
                    case 'use_magnet':
                        // Lógica simplificada: incrementa se usou na partida
                        if (gameProps.magnetTimer > 0) mission.progress++; 
                        break;
                    case 'use_slowmo':
                        if (gameProps.slowMoTimer > 0) mission.progress++;
                        break;
                    case 'play_hardcore':
                        if (gameProps.isHardcoreMode) mission.progress++;
                        break;
                    case 'play_boss':
                        if (gameProps.isBossMode) mission.progress++;
                        break;
                    case 'defeat_boss':
                        if (gameProps.didDefeatBoss) mission.progress++;
                        break;
                    case 'use_shield':
                        mission.progress += gameProps.shieldUsageCount;
                        break;
                    case 'survive_time':
                        mission.progress = Math.max(mission.progress, Math.floor(gameProps.frames / 60));
                        break;
                    // 'buy_item' seria atualizado na loja
                }
                if (mission.progress >= mission.target) {
                    mission.completed = true;
                }
            }
        });
        localStorage.setItem('morcegoFlap_missions', JSON.stringify(dailyMissions));
    }
}

export function drawMissionMap() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Missões Diárias", canvas.width / 2, 80);

    dailyMissions.forEach((mission, index) => {
        const y = 150 + index * 100;
        ctx.fillStyle = mission.completed ? '#004d00' : '#333';
        ctx.fillRect(50, y, canvas.width - 100, 80);
        ctx.strokeStyle = mission.completed ? '#00FF00' : '#888';
        ctx.strokeRect(50, y, canvas.width - 100, 80);

        ctx.fillStyle = '#FFF';
        ctx.font = "18px Arial";
        ctx.textAlign = "left";
        ctx.fillText(mission.text, 70, y + 30);

        ctx.font = "16px Arial";
        if (mission.completed && !mission.claimed) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Recompensa: ${mission.reward} 💰 (Clique para coletar)`, 70, y + 60);
        } else if (mission.claimed) {
            ctx.fillStyle = '#888';
            ctx.fillText('Coletado', 70, y + 60);
        } else {
            ctx.fillStyle = '#AAA';
            ctx.fillText(`Progresso: ${mission.progress}/${mission.target}`, 70, y + 60);
        }
    });
}

export function handleMissionClick(x, y) {
    dailyMissions.forEach((mission, index) => {
        const rect = { x: 50, y: 150 + index * 100, w: canvas.width - 100, h: 80 };
        if (mission.completed && !mission.claimed &&
            x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) {
            
            mission.claimed = true;
            saveTotalCoins(mission.reward);
            gameProps.totalCoins = getTotalCoins(); // Update state
            localStorage.setItem('morcegoFlap_missions', JSON.stringify(dailyMissions));
        }
    });
}