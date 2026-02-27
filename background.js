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
    // --- MODO GEOMETRY (Visual Grid Neon) ---
    if (gameProps.isGeometryMode) {
        // Fundo Roxo Escuro/Azul
        ctx.fillStyle = '#1a0b2e'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Efeito de Grid em movimento
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; // Ciano transparente
        
        const gridSize = 60;
        // O offset cria a ilusão de movimento baseada na velocidade do jogo
        const offsetX = (gameProps.frames * gameProps.gameSpeed * 0.5) % gridSize;
        
        // Linhas Verticais (que se movem)
        for (let x = -offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Linhas Horizontais (fixas para dar profundidade ou chão)
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Chão sólido
        ctx.fillStyle = '#000';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, canvas.height - 50, canvas.width, 50);

        return;
    }
    // ----------------------------------------

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