import { ctx, canvas, gameProps } from './state.js';
import { pipes } from './pipes.js';
import { createParticles } from './particles.js';

const raindrops = [];

export function resetRain() {
    raindrops.length = 0;
    // 40% de chance de chover nesta partida
    gameProps.isRaining = Math.random() < 0.40;
    
    // Se chover, tem 20% de chance de ter vento forte
    gameProps.isWindy = gameProps.isRaining && Math.random() < 0.20;

    // Força chuva de sangue no modo Dramuzos
    if (gameProps.isDramuzosMode) {
        gameProps.isRaining = true;
        gameProps.isWindy = true; // Vento dramático
    }

    if (gameProps.isRaining) {
        // Duração entre 4s e 8s
        const duration = Math.random() * 4 + 4;
        gameProps.rainTimer = duration * 60; // Convertendo para frames (aprox)
        
        // Interpolação da chance de raio: 4s -> 0.384 (38.4%), 8s -> 0.3 (30%)
        // Fórmula linear baseada na duração
        gameProps.lightningChance = 0.384 - ((duration - 4) / 4) * 0.084;

        for (let i = 0; i < 100; i++) {
            raindrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: Math.random() * 5 + 10,
                length: Math.random() * 10 + 10
            });
        }
    } else {
        gameProps.lightningChance = 0.1;
        gameProps.isWindy = false;
    }
}

export function updateAndDrawRain() {
    if (!gameProps.isRaining) return;

    // Atualizar temporizador da chuva
    if (!gameProps.isGameOver) {
        gameProps.rainTimer--;
        if (gameProps.rainTimer <= 0) {
            gameProps.isRaining = false;
            gameProps.lightningChance = 0.1;
            gameProps.isWindy = false;
            return;
        }
    }

    // Cor da chuva: Vermelho sangue no modo Dramuzos, Azul claro normal
    const rainColor = gameProps.isDramuzosMode ? 'rgba(220, 20, 60, 0.6)' : 'rgba(174, 194, 224, 0.5)';
    
    ctx.strokeStyle = rainColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Se tiver vento, a chuva cai inclinada
    const windX = gameProps.isWindy ? -3 : 0;

    for (let drop of raindrops) {
        if (!gameProps.isGameOver) {
            drop.y += drop.speed;
            drop.x += windX; // Chuva inclinada
            
            let collision = false;
            let splashY = drop.y;

            // Colisão com o chão
            if (drop.y > canvas.height) {
                collision = true;
                splashY = canvas.height;
            } 
            // Colisão com canos (apenas superfície superior dos canos de baixo)
            else {
                for (let p of pipes) {
                    if (drop.x >= p.x && drop.x <= p.x + 50) {
                        const pipeTopSurface = canvas.height - p.bottom;
                        if (drop.y > pipeTopSurface) {
                            collision = true;
                            splashY = pipeTopSurface;
                            break;
                        }
                    }
                }
            }

            if (collision) {
                // Efeito de respingo (partículas azuis claras, poucas unidades)
                createParticles(drop.x, splashY, 'rgba(174, 194, 224, 0.8)', 2);
                
                drop.y = -drop.length;
                drop.x = Math.random() * canvas.width;
            }
        }
        
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + windX, drop.y + drop.length);
    }
    ctx.stroke();
}