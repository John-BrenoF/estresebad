import { ctx, canvas, gameProps } from './state.js';
import { saveTotalCoins, getTotalCoins } from './storage.js';
import { playGlitch } from './audio.js';

const MISSION_TYPES = [
    { id: 'score', text: 'Alcance a pontuação de', value: [20, 8, 30], icon: '🏆' },
    { id: 'coins', text: 'Colete', value: [10, 20, 30], suffix: 'moedas', icon: '💰' },
    { id: 'survive_lightning', text: 'Sobreviva a', value: [1, 2, 3], suffix: 'raios', icon: '⚡' },
    { id: 'use_magnet', text: 'Use o Ímã', value: [1, 3, 5], suffix: 'vezes', icon: '🧲' },
    { id: 'use_slowmo', text: 'Use o Slow-Mo', value: [1, 3, 5], suffix: 'vezes', icon: '⏰' },
    { id: 'play_hardcore', text: 'Jogue partidas Hardcore', value: [1, 3], suffix: 'vezes', icon: '🔥' },
    { id: 'buy_item', text: 'Compre itens na loja', value: [1, 2], suffix: 'vezes', icon: '🛒' },
    { id: 'play_boss', text: 'Jogue o modo Boss', value: [1, 3], suffix: 'vezes', icon: '👹' },
    { id: 'defeat_boss', text: 'Derrote o Boss', value: [1], suffix: 'vez', icon: '⚔️' },
    { id: 'use_shield', text: 'Use o Escudo', value: [3, 5, 10], suffix: 'vezes', icon: '🛡️' },
    { id: 'survive_time', text: 'Sobreviva por', value: [30, 60, 90], suffix: 'segundos', icon: '⏳' },
];

const REWARDS = [50, 75, 100];

let dailyMissions = [];
let scrollY = 0;
const CARD_HEIGHT = 100;
const CARD_GAP = 20;

function generateMissions() {
    const missions = [];
    const usedTypes = new Set();

    // Gera até 10 missões ou até esgotar os tipos disponíveis
    while (missions.length < 10 && usedTypes.size < MISSION_TYPES.length) {
        const type = MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)];
        if (!usedTypes.has(type.id)) {
            usedTypes.add(type.id);
            const value = type.value[Math.floor(Math.random() * type.value.length)];
            const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
            missions.push({
                id: `${type.id}_${value}`,
                text: `${type.text} ${value} ${type.suffix || ''}`.trim(),
                type: type.id,
                icon: type.icon,
                target: value,
                progress: 0,
                reward: reward,
                completed: false,
                claimed: false,
            });
        }
    }

    // Adiciona a Missão Secreta (sempre a última)
    missions.push({
        id: 'secret_challenge',
        text: 'Alcance 100 pontos em uma partida', // O texto real
        type: 'secret_score',
        icon: '🕵️',
        target: 100,
        progress: 0,
        reward: 500, // Recompensa alta
        completed: false,
        claimed: false,
        isSecret: true
    });

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

// Função para atualizar missões que ocorrem fora do loop de jogo (ex: Loja)
export function incrementMissionProgress(type, amount = 1) {
    let updated = false;
    dailyMissions.forEach(mission => {
        if (!mission.completed && mission.type === type) {
            mission.progress += amount;
            if (mission.progress >= mission.target) mission.completed = true;
            updated = true;
        }
    });
    
    if (updated) localStorage.setItem('morcegoFlap_missions', JSON.stringify(dailyMissions));
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
                    case 'secret_score':
                        mission.progress = Math.max(mission.progress, gameProps.score);
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

export function handleMissionScroll(e) {
    scrollY += e.deltaY * 0.5;
    const totalHeight = dailyMissions.length * (CARD_HEIGHT + CARD_GAP) + 20; // Altura total do conteúdo
    const viewHeight = canvas.height - 180; // Altura da área visível
    const maxScroll = Math.max(0, totalHeight - viewHeight);
    
    if (scrollY < 0) scrollY = 0;
    if (scrollY > maxScroll) scrollY = maxScroll;
}

export function drawMissionMap() {
    // Fundo preto
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.globalAlpha = 1.0;
    
    // Borda do painel
    ctx.strokeStyle = '#888888'; // Cinza
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Título
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 32px Changa";
    ctx.textAlign = "center";
    ctx.fillText("MISSÕES DIÁRIAS", canvas.width / 2, 80);
    
    // Subtítulo
    ctx.fillStyle = '#AAA';
    ctx.font = "16px Changa";
    ctx.fillText("Complete para ganhar moedas!", canvas.width / 2, 110);

    // Área de conteúdo com Clip para Scroll
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 130, canvas.width - 40, canvas.height - 180);
    ctx.clip();
    ctx.translate(0, -scrollY);

    // Conta quantas missões normais foram completadas
    const completedNormalMissions = dailyMissions.filter(m => !m.isSecret && m.completed).length;

    dailyMissions.forEach((mission, index) => {
        const y = 140 + index * (CARD_HEIGHT + CARD_GAP);
        const x = 40;
        const w = canvas.width - 80;

        // Fundo do Card
        ctx.fillStyle = mission.completed ? (mission.claimed ? '#222' : '#330033') : '#333'; // Fundo preto/roxo escuro
        ctx.fillRect(x, y, w, CARD_HEIGHT);
        
        // Borda do Card
        ctx.strokeStyle = mission.completed ? (mission.claimed ? '#888888' : '#6A0DAD') : '#888888'; // Bordas cinza/roxa
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, CARD_HEIGHT);

        // Lógica de Segredo
        let displayIcon = mission.icon;
        let displayText = mission.text;
        let isLockedSecret = false;

        if (mission.isSecret && completedNormalMissions < 5) {
            isLockedSecret = true;
            displayIcon = '🔒';
            displayText = '??? (Complete 5 missões para revelar)';
        }

        // Ícone
        ctx.font = "30px Changa";
        ctx.textAlign = "center";
        ctx.fillText(displayIcon || '🎯', x + 30, y + 45);

        // Texto da Missão
        ctx.fillStyle = '#FFF';
        ctx.font = "bold 16px Changa";
        ctx.textAlign = "left";
        ctx.fillText(displayText, x + 60, y + 30);

        // Barra de Progresso
        const barWidth = w - 70;
        const barHeight = 10;
        const barX = x + 60;
        const barY = y + 45;
        
        let progressPercent = Math.min(1, mission.progress / mission.target);
        if (isLockedSecret) {
            progressPercent = 0; // Esconde o progresso se estiver bloqueada
        }

        ctx.fillStyle = '#111';
        ctx.fillRect(barX, barY, barWidth, barHeight); // Fundo da barra
        ctx.fillStyle = mission.completed ? '#6A0DAD' : '#6A0DAD'; // Barra de progresso roxa
        ctx.fillRect(barX, barY, barWidth * progressPercent, barHeight); // Preenchimento

        // Texto de Status / Botão
        ctx.font = "14px Changa";
        if (isLockedSecret) {
            ctx.fillStyle = '#AAA';
            ctx.fillText(`Progresso Oculto`, x + 60, y + 80);
        } else if (mission.completed && !mission.claimed) {
            // Botão de Resgatar
            ctx.fillStyle = '#8A2BE2'; // Roxo
            ctx.fillText(`✨ CLIQUE PARA RESGATAR (+${mission.reward} 💰)`, x + 60, y + 80);
        } else if (mission.claimed) {
            ctx.fillStyle = '#888';
            ctx.fillText('✅ Recompensa Coletada', x + 60, y + 80);
        } else {
            ctx.fillStyle = '#CCC';
            ctx.fillText(`Progresso: ${Math.floor(mission.progress)}/${mission.target} (+${mission.reward} 💰)`, x + 60, y + 80);
        }
    });

    ctx.restore();

    // Barra de Scroll
    const totalHeight = dailyMissions.length * (CARD_HEIGHT + CARD_GAP) + 20;
    const viewHeight = canvas.height - 180;
    if (totalHeight > viewHeight) {
        const scrollbarHeight = viewHeight;
        const thumbHeight = scrollbarHeight * (viewHeight / totalHeight);
        const thumbY = (scrollY / (totalHeight - viewHeight)) * (scrollbarHeight - thumbHeight);
        
        ctx.fillStyle = '#555';
        ctx.fillRect(canvas.width - 15, 130, 10, scrollbarHeight);
        ctx.fillStyle = '#888';
        ctx.fillRect(canvas.width - 15, 130 + thumbY, 10, thumbHeight);
    }

    // Botão Voltar (Instrução)
    ctx.fillStyle = '#FFF';
    ctx.font = "16px Changa";
    ctx.textAlign = "center";
    ctx.fillText("Clique nas bordas para voltar", canvas.width / 2, canvas.height - 20);
}

export function handleMissionClick(x, y) {
    const adjustedY = y + scrollY;
    dailyMissions.forEach((mission, index) => {
        const rect = { x: 40, y: 140 + index * (CARD_HEIGHT + CARD_GAP), w: canvas.width - 80, h: CARD_HEIGHT };
        
        if (mission.completed && !mission.claimed &&
            x > rect.x && x < rect.x + rect.w && adjustedY > rect.y && adjustedY < rect.y + rect.h) {
            
            mission.claimed = true;
            saveTotalCoins(mission.reward);
            gameProps.totalCoins = getTotalCoins(); // Update state
            gameProps.rgbSplitTimer = 10;
            playGlitch();
            localStorage.setItem('morcegoFlap_missions', JSON.stringify(dailyMissions));
        }
    });

    // Fechar ao clicar fora da área da lista (cabeçalho ou rodapé)
    if (y < 130 || y > canvas.height - 50) {
        gameProps.rgbSplitTimer = 15;
        playGlitch();
        gameProps.isMissionMapOpen = false;
    }
}