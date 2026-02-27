import { ctx, canvas, gameProps } from './state.js';
import { playJump } from './audio.js';
import { SKINS } from './constants.js';

export const bird = {
    x: 50,
    y: 150,
    width: 34,
    height: 24,
    // A cor será definida dinamicamente
    // color: '#4B0082', 
    velocity: 0,
    gravity: 0.25,
    jump: 4.6,
    rotation: 0,
    wingFrame: 0,
    
    draw: function() {
        ctx.save();
        // Transladar para o centro do pássaro para rotacionar corretamente
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Desenha o escudo de imunidade se ativo
        if (gameProps.isImmune) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Desenha o efeito do ímã se ativo
        if (gameProps.isMagnetActive) {
            ctx.strokeStyle = `rgba(255, 223, 0, ${0.5 + Math.sin(this.wingFrame) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const magnetRadius = 40 + Math.sin(this.wingFrame) * 5;
            ctx.arc(0, 0, magnetRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Desenha o escudo de reflexão
        if (gameProps.isPlayerShieldActive) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Efeito de Fúria
        if (gameProps.isFuryActive) {
            ctx.strokeStyle = '#FF4500'; // Laranja avermelhado
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + Math.random() * 5, 0, Math.PI * 2); // Efeito pulsante
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const currentSkin = SKINS.find(s => s.id === gameProps.shopData.equippedSkin) || SKINS[0];
        const birdColor = currentSkin.color;

        // Efeito Neon
        if (currentSkin.glow) {
            ctx.shadowColor = currentSkin.color;
            ctx.shadowBlur = 20;
        }

        // Desenhar Corpo (Roxo Escuro)
        ctx.fillStyle = birdColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar Olhos
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(4, -2, 4, 0, Math.PI * 2); // Olho direito
        ctx.arc(-4, -2, 4, 0, Math.PI * 2); // Olho esquerdo
        ctx.fill();
        ctx.fillStyle = 'black'; // Pupilas
        ctx.beginPath();
        ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar Orelhas
        ctx.fillStyle = birdColor;
        ctx.beginPath();
        ctx.moveTo(-8, -8); ctx.lineTo(-12, -20); ctx.lineTo(-2, -8);
        ctx.moveTo(8, -8); ctx.lineTo(12, -20); ctx.lineTo(2, -8);
        ctx.fill();

        // Desenhar Asas (Animadas)
        ctx.fillStyle = '#2e004f'; // Cor da asa mais escura
        const wingY = Math.sin(this.wingFrame) * 10; // Oscilação da asa
        
        ctx.beginPath();
        // Asa Esquerda
        ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-20, wingY - 10, -28, wingY); ctx.lineTo(-10, 8);
        // Asa Direita
        ctx.moveTo(8, 2); ctx.quadraticCurveTo(20, wingY - 10, 28, wingY); ctx.lineTo(10, 8);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0; // Resetar shadow
    },
    
    update: function(onCollision) {
        if (gameProps.isFrozen) {
            // Player is frozen, no movement
            this.velocity = 0;
            return;
        }

        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            if (!gameProps.isImmune) onCollision();
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Lógica de Rotação
        if (this.velocity < 0) {
            this.rotation = -25 * Math.PI / 180; // Aponta para cima
        } else {
            this.rotation += 0.1; // Cai girando para baixo
            if (this.rotation > 90 * Math.PI / 180) {
                this.rotation = 90 * Math.PI / 180; // Limite de 90 graus
            }
        }

        // Animação da asa
        this.wingFrame += 0.3;

        // Efeito de Vento
        if (gameProps.isWindy) {
            // Empurra o pássaro aleatoriamente no eixo X e levemente no Y
            this.x += (Math.random() - 0.6) * 2; // Tendência a empurrar para trás (esquerda)
            this.y += (Math.random() - 0.5) * 1; // Turbulência vertical
            
            // Mantém o pássaro dentro de limites razoáveis na tela
            if (this.x < 20) this.x = 20;
            if (this.x > 80) this.x = 80;
        } else {
            // Retorna suavemente para a posição original (50) se o vento parar
            if (Math.abs(this.x - 50) > 1) this.x += (50 - this.x) * 0.05;
        }
    },
    
    jumpAction: function() {
        if (gameProps.isFrozen) return;
        this.velocity = -this.jump;
        playJump();
    }
};