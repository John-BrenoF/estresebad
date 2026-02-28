import { ctx, gameProps } from './state.js';
import { createParticles } from './particles.js';

export const coins = [];

export function createCoin(x, y) {
    coins.push({
        x: x,
        y: y,
        size: 15,
        collected: false,
        rotation: 0
    });
}

export function updateAndDrawCoins(bird) {
    for (let i = 0; i < coins.length; i++) {
        let c = coins[i];
        
        if (!gameProps.isGameOver) {
            const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
            c.x -= gameProps.gameSpeed * speedMultiplier;
            c.rotation += 0.1;

            // Lógica do Ímã
            if (gameProps.isMagnetActive) {
                const magnetRadius = 150;
                const attractionSpeed = 0.1;
                const dx = (bird.x + bird.width/2) - c.x;
                const dy = (bird.y + bird.height/2) - c.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < magnetRadius) {
                    c.x += dx * attractionSpeed;
                    c.y += dy * attractionSpeed;
                }
            }

            // Colisão com o pássaro
            const dx = (bird.x + bird.width/2) - c.x;
            const dy = (bird.y + bird.height/2) - c.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < c.size + bird.width/2 - 5 && !c.collected) { // -5 to make collection feel better
                c.collected = true;
                gameProps.currentCoins++;
                createParticles(c.x, c.y, '#FFFF00', 10);
            }
        }

        if (!c.collected) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(Math.sin(c.rotation), 1); // Efeito de girar 3D simples
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, c.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#DAA520';
            ctx.font = "bold 16px Changa";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("$", 0, 1);
            ctx.restore();
        }

        // Remover moedas que saíram da tela ou foram coletadas
        if (c.x + c.size < 0 || c.collected) {
            coins.splice(i, 1);
            i--;
        }
    }
}

export function clearCoins() {
    coins.length = 0;
}