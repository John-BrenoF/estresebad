import { ctx, canvas, gameProps } from './state.js';

const stars = [];
const buildings = [];

export function initBackground() {
    stars.length = 0;
    buildings.length = 0;

    // Criar estrelas
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 200),
            size: Math.random() * 2 + 0.5,
            speedFactor: Math.random() * 0.2 + 0.05
        });
    }

    // Criar prédios (silhueta)
    let currentX = 0;
    while (currentX < canvas.width * 2) {
        const width = 40 + Math.random() * 60;
        const height = 50 + Math.random() * 150;
        buildings.push({
            x: currentX,
            y: canvas.height - height,
            width: width,
            height: height,
            color: Math.random() > 0.8 ? '#1a1a1a' : '#222'
        });
        currentX += width;
    }
}

export function updateAndDrawBackground() {
    // Fundo do céu (gradiente noturno)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f2027');
    gradient.addColorStop(1, '#203a43');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar e mover estrelas
    ctx.fillStyle = '#FFF';
    stars.forEach(star => {
        if (!gameProps.isGameOver) {
            star.x -= gameProps.gameSpeed * star.speedFactor;
            if (star.x < 0) star.x = canvas.width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Desenhar e mover prédios (Paralaxe)
    buildings.forEach(b => {
        if (!gameProps.isGameOver) {
            b.x -= gameProps.gameSpeed * 0.3; // Movem-se a 30% da velocidade do jogo
            if (b.x + b.width < 0) b.x += canvas.width * 2; // Recicla o prédio lá na frente
        }
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width + 1, b.height); // +1 para evitar linhas brancas entre prédios
    });
}