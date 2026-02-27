import { ctx, canvas, gameProps } from './state.js';
import { getHighScores } from './storage.js';

export function drawScore() {
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.font = "35px Arial";
    ctx.fillText(gameProps.score, canvas.width / 2 - 10, 50);
    ctx.strokeText(gameProps.score, canvas.width / 2 - 10, 50);
    
    ctx.font = "12px Arial";
    ctx.fillText("Vel: " + gameProps.gameSpeed.toFixed(1), 10, 20);
}

export function drawHighScores() {
    const highScores = getHighScores();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆 RANKING", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = "16px Arial";
    ctx.fillStyle = '#FFF';
    
    if (highScores.length === 0) {
        ctx.fillText("Sem pontuações ainda!", canvas.width / 2, canvas.height / 2 - 30);
    } else {
        highScores.forEach((s, index) => {
            ctx.fillText(`${index + 1}º - ${s.score} pts`, canvas.width / 2, canvas.height / 2 - 30 + (index * 25));
        });
    }
    
    ctx.textAlign = "left";
}

export function drawWaitingScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const elapsed = (Date.now() - gameProps.waitStartTime) / 1000;
    const remaining = Math.max(0, gameProps.selectedDelay - elapsed);
    const displayTime = remaining.toFixed(1);
    
    ctx.fillStyle = '#FF6B6B';
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⏰ AGUARDE!", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.fillStyle = '#4ECDC4';
    ctx.font = "bold 60px Arial";
    ctx.fillText(displayTime + "s", canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "16px Arial";
    ctx.fillText("O jogo iniciará automaticamente", canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText("após a contagem regressiva.", canvas.width / 2, canvas.height / 2 + 75);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = "14px Arial";
    let timeText = "";
    if (gameProps.selectedDelay === 0.2) timeText = "Rápido! (0.2s)";
    else if (gameProps.selectedDelay === 1) timeText = "Curto (1s)";
    else if (gameProps.selectedDelay === 3) timeText = "Médio (3s)";
    else if (gameProps.selectedDelay === 10) timeText = "Longo (10s)";
    ctx.fillText("Tempo sorteado: " + timeText, canvas.width / 2, canvas.height / 2 + 110);
    
    ctx.textAlign = "left";
}

export function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF4444';
    ctx.font = "35px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 100);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "25px Arial";
    ctx.fillText("Pontuação: " + gameProps.score, canvas.width / 2, canvas.height / 2 - 55);
    
    if (gameProps.isNewHighScore) {
        ctx.fillStyle = '#FFD700';
        ctx.font = "bold 22px Arial";
        ctx.fillText("⭐ NOVO RECORDE! ⭐", canvas.width / 2, canvas.height / 2 - 20);
    }
    
    drawHighScores();
    
    ctx.fillStyle = '#70c5ce';
    ctx.font = "18px Arial";
    ctx.fillText("Clique ou Espaço para sortear tempo", canvas.width / 2, canvas.height - 60);
    ctx.fillText("e iniciar nova partida", canvas.width / 2, canvas.height - 35);
    
    ctx.textAlign = "left";
}

export function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MORCEGO FLAP", canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#FFF';
    ctx.font = "20px Arial";
    ctx.fillText("Pressione Espaço ou Clique", canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("para começar", canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = "14px Arial";
    ctx.fillText("Evite os canos e o tubo móvel!", canvas.width / 2, canvas.height - 50);
    ctx.textAlign = "left";
}