import { ctx, canvas, gameProps } from './state.js';
import { playGhost } from './audio.js';

const ghosts = [];

class Ghost {
    constructor() {
        this.width = 40;
        this.height = 50;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 200) + 100; // Spawn at random height, avoiding top/bottom edges
        this.speed = gameProps.gameSpeed * 0.8; // Slower than pipes
        this.frame = 0;
    }

    update() {
        const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
        this.x -= this.speed * speedMultiplier;
        this.frame += 0.1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'white';

        // Body
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, Math.PI, 0);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        
        // Wavy bottom
        const wave = Math.sin(this.frame);
        ctx.quadraticCurveTo(this.x + this.width * 0.75, this.y + this.height - 10 * wave, this.x + this.width / 2, this.y + this.height);
        ctx.quadraticCurveTo(this.x + this.width * 0.25, this.y + this.height + 10 * wave, this.x, this.y + this.height);
        
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 25, 4, 0, Math.PI * 2); // Left eye
        ctx.arc(this.x + 28, this.y + 25, 4, 0, Math.PI * 2); // Right eye
        ctx.fill();

        ctx.restore();
    }
}

export function updateGhosts(bird, onCollision) {
    // 15.3% chance to spawn a ghost every ~4 seconds (240 frames)
    const chance = gameProps.isHardcoreMode ? 0.3 : 0.153;
    if (ghosts.length === 0 && gameProps.frames > 100 && gameProps.frames % 180 === 0 && Math.random() < chance) {
        playGhost();
        ghosts.push(new Ghost());
    }

    for (let i = 0; i < ghosts.length; i++) {
        let g = ghosts[i];
        g.update();

        // Collision with bird
        if (!gameProps.isImmune &&
            bird.x < g.x + g.width &&
            bird.x + bird.width > g.x &&
            bird.y < g.y + g.height &&
            bird.y + bird.height > g.y
        ) {
            onCollision();
        }

        // Remove if off-screen
        if (g.x + g.width < 0) {
            ghosts.splice(i, 1);
            i--;
        }
    }
}

export function drawGhosts() {
    ghosts.forEach(g => g.draw());
}

export function resetGhosts() {
    ghosts.length = 0;
}