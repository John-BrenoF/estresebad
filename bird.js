import { ctx, canvas } from './state.js';
import { playJump } from './audio.js';

export const bird = {
    x: 50,
    y: 150,
    width: 30,
    height: 30,
    color: '#FFD700',
    velocity: 0,
    gravity: 0.25,
    jump: 4.6,
    
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 20, this.y + 5, 5, 5);
        // Asa do morcego
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 10);
        ctx.lineTo(this.x - 15, this.y + 20);
        ctx.lineTo(this.x, this.y + 25);
        ctx.fill();
    },
    
    update: function(onCollision) {
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            onCollision();
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    
    jumpAction: function() {
        this.velocity = -this.jump;
        playJump();
    }
};