import { ctx, gameProps } from './state.js';

const particles = [];

class Particle {
    constructor(x, y, color, type = 'circle') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type; // 'circle' ou 'square'
        this.size = type === 'square' ? 34 : Math.random() * 5 + 3; // 34 é o tamanho do player
        this.speedX = type === 'square' ? -gameProps.gameSpeed : Math.random() * 6 - 3;
        this.speedY = type === 'square' ? 0 : Math.random() * 6 - 3;
        this.life = 1.0;
        this.decay = type === 'square' ? 0.05 : Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size -= 0.1;
    }

    draw() {
        if (this.size <= 0) return; // Previne o erro de raio negativo
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        
        if (this.type === 'square') {
            // Rastro do Geometry (Quadrado vazado ou preenchido)
            ctx.fillRect(this.x, this.y, this.size, this.size);
        } else {
            // Partículas normais
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}

export function createParticles(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, 'circle'));
    }
}

export function createGeometryTrail(x, y, color) {
    particles.push(new Particle(x, y, color, 'square'));
}

export function updateAndDrawParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0 || particles[i].size <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

export function clearParticles() {
    particles.length = 0;
}