import { ctx, canvas, gameProps } from './state.js';
import { getScoreHistory, getTopScores } from './storage.js';
import { drawBackdropBlur, draw3DButton } from './ui.js';

const closeButtonRect = { x: canvas.width / 2 - 75, y: canvas.height - 70, w: 150, h: 50 };

function drawGraph(history) {
    const graphRect = { x: 50, y: 300, w: canvas.width - 100, h: 150 };
    const scores = history.map(h => h.score);
    
    if (scores.length < 2) {
        ctx.fillStyle = '#AAA';
        ctx.font = "18px Changa";
        ctx.textAlign = "center";
        ctx.fillText("Jogue pelo menos 2 partidas para ver o gráfico.", canvas.width / 2, graphRect.y + graphRect.h / 2);
        return;
    }

    const maxScore = Math.max(...scores, 10); // Mínimo de 10 para ter uma escala
    const points = scores.map((score, index) => ({
        x: graphRect.x + (index / (scores.length - 1)) * graphRect.w,
        y: graphRect.y + graphRect.h - (score / maxScore) * graphRect.h
    }));

    // Desenhar eixos e fundo do gráfico
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(graphRect.x, graphRect.y, graphRect.w, graphRect.h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(graphRect.x, graphRect.y, graphRect.w, graphRect.h);

    // Desenhar a linha do gráfico
    ctx.strokeStyle = '#8A2BE2';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#8A2BE2';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Desenhar pontos no gráfico
    ctx.fillStyle = '#FFF';
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Labels do gráfico
    ctx.fillStyle = '#AAA';
    ctx.font = "12px Changa";
    ctx.textAlign = "left";
    ctx.fillText(`Max: ${Math.round(maxScore)}`, graphRect.x + 5, graphRect.y - 5);
    ctx.textAlign = "right";
    ctx.fillText(`Últimos ${scores.length} jogos`, graphRect.x + graphRect.w - 5, graphRect.y - 5);
}

export function drawStatsScreen() {
    drawBackdropBlur();

    // Título
    ctx.fillStyle = '#8A2BE2'; // Roxo
    ctx.font = "bold 32px Changa";
    ctx.textAlign = "center";
    ctx.fillText("ESTATÍSTICAS", canvas.width / 2, 80);

    // Seção de Melhores Pontuações
    ctx.fillStyle = '#FFF';
    ctx.font = "bold 20px Changa";
    ctx.fillText("Melhores Pontuações", canvas.width / 2, 130);

    const topScores = getTopScores(5);
    ctx.font = "18px Changa";
    if (topScores.length === 0) {
        ctx.fillStyle = '#AAA';
        ctx.fillText("Nenhum recorde ainda.", canvas.width / 2, 170);
    } else {
        topScores.forEach((entry, index) => {
            const y = 160 + index * 25;
            const date = new Date(entry.date).toLocaleDateString();
            ctx.fillStyle = '#DDD';
            ctx.textAlign = "left";
            ctx.fillText(`${index + 1}.`, 80, y);
            ctx.textAlign = "center";
            ctx.fillStyle = '#FFF';
            ctx.fillText(`${entry.score} pts`, canvas.width / 2, y);
            ctx.textAlign = "right";
            ctx.fillStyle = '#AAA';
            ctx.fillText(`${date}`, canvas.width - 80, y);
        });
    }

    // Seção do Gráfico
    ctx.fillStyle = '#FFF';
    ctx.font = "bold 20px Changa";
    ctx.textAlign = "center";
    ctx.fillText("Progresso Recente", canvas.width / 2, 280);
    
    const history = getScoreHistory().slice(-20); // Pega os últimos 20 jogos
    drawGraph(history);

    // Botão Voltar
    draw3DButton(closeButtonRect, '#FF4444', "VOLTAR", "24px");
}

export function handleStatsClick(x, y) {
    // Fechar ao clicar no botão "Voltar"
    if (x > closeButtonRect.x && x < closeButtonRect.x + closeButtonRect.w && y > closeButtonRect.y && y < closeButtonRect.y + closeButtonRect.h) {
        gameProps.isStatsOpen = false;
        gameProps.menuFadeInTimer = 30; // Ativa o fade-in para o menu principal
    }
}