import { ctx, canvas, gameProps } from './state.js';
import { playThunder } from './audio.js';

let lightning = {
    active: false,
    x: 0,
    timer: 0,
    phase: 'idle', // idle, warning, strike
    segments: [],
    flash: 0
};

export function resetLightning() {
    lightning.active = false;
    lightning.phase = 'idle';
    lightning.timer = 0;
}

export function updateLightning(bird, onCollision) {
    // Verifica a cada 60 frames (aprox 1 segundo)
    if (!lightning.active && !gameProps.isGameOver && !gameProps.isWaitingToStart && !gameProps.isGeometryMode) {
        const chance = gameProps.lightningChance || 0.1;
        
        if (gameProps.frames % 60 === 0 && Math.random() < chance) {
            triggerLightning();
        }
    }

    if (lightning.active) {
        lightning.timer--;

        if (lightning.phase === 'warning') {
            // Fase de aviso (linha piscando)
            if (lightning.timer <= 0) {
                strike();
                playThunder();
                // Verifica colisão no momento exato do impacto
                // Hitbox de 40px de largura
                const hit = bird.x + bird.width > lightning.x - 20 && bird.x < lightning.x + 20;
                if (hit && !gameProps.isImmune && !gameProps.isGeometryMode) {
                    onCollision();
                } 
                if (!hit) {
                    gameProps.lightningSurvived++;
                }
            }
        } else if (lightning.phase === 'strike') {
            // Fase do raio caindo
            lightning.flash *= 0.85; // Diminui o flash da tela
            if (lightning.timer <= 0) {
                lightning.active = false;
                lightning.phase = 'idle';
            }
        }
    }
}

function triggerLightning() {
    lightning.active = true;
    lightning.phase = 'warning';
    lightning.timer = 40; // 40 frames de aviso (aprox 0.6s)
    // Escolhe uma posição X aleatória na tela
    lightning.x = Math.random() * (canvas.width - 40) + 20;
}

function strike() {
    lightning.phase = 'strike';
    lightning.timer = 15; // O raio fica visível por 15 frames
    lightning.flash = 1.0;
    
    // Gerar geometria do raio (zigue-zague)
    lightning.segments = [];
    let currX = lightning.x;
    let currY = 0;
    
    while (currY < canvas.height) {
        let len = Math.random() * 30 + 20;
        let nextY = currY + len;
        let nextX = currX + (Math.random() * 60 - 30);
        lightning.segments.push({x1: currX, y1: currY, x2: nextX, y2: nextY});
        currX = nextX;
        currY = nextY;
    }
}

export function drawLightning() {
    if (!lightning.active) return;

    if (lightning.phase === 'warning') {
        // Indicador de perigo
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.fillRect(lightning.x - 20, 0, 40, canvas.height);
        
        // Ícone de alerta
        ctx.fillStyle = '#FFFF00';
        ctx.font = '30px Arial';
        ctx.fillText('⚡', lightning.x - 15, 50);
        
    } else if (lightning.phase === 'strike') {
        // Flash na tela toda
        if (lightning.flash > 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${lightning.flash * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Desenhar o raio
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00FFFF'; // Brilho azul elétrico
        
        ctx.beginPath();
        for (let seg of lightning.segments) {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
        ctx.restore();
    }
}