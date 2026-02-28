import { ctx, canvas, gameProps } from './state.js';
import { playJump, playGlitch } from './audio.js';
import { SKINS } from './constants.js';
import { createParticles, createGeometryTrail, createGlitchTrail } from './particles.js';

function drawCompleteBat(birdColor, wingFrame) {
    // 1. Desenhar Asas (Atrás do corpo)
    // Asas membranosas com recortes (estilo Batman/Morcego)
    ctx.fillStyle = '#220033'; // Cor da membrana da asa (bem escura)
    const wingY = Math.sin(wingFrame) * 12; // Amplitude do batimento
    
    ctx.beginPath();
    // Asa Esquerda
    ctx.moveTo(-4, 2); 
    ctx.quadraticCurveTo(-20, wingY - 25, -45, wingY - 10); // Borda superior (ombro até ponta)
    ctx.quadraticCurveTo(-35, wingY + 10, -25, wingY + 5);  // Recorte 1
    ctx.quadraticCurveTo(-15, wingY + 10, -4, 8);           // Recorte 2 (volta ao corpo)
    
    // Asa Direita (Espelhada)
    ctx.moveTo(4, 2); 
    ctx.quadraticCurveTo(20, wingY - 25, 45, wingY - 10);
    ctx.quadraticCurveTo(35, wingY + 10, 25, wingY + 5);
    ctx.quadraticCurveTo(15, wingY + 10, 4, 8);
    ctx.fill();

    // Detalhes de "ossos" da asa
    ctx.strokeStyle = '#441155'; // Roxo mais escuro e saturado
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Asa Esquerda
    ctx.moveTo(-4, 2);
    ctx.lineTo(-25, wingY + 5);
    // Asa Direita
    ctx.moveTo(4, 2);
    ctx.lineTo(25, wingY + 5);
    ctx.stroke();

    // 2. Desenhar Orelhas (Pontudas e Grandes)
    ctx.fillStyle = birdColor;
    ctx.beginPath();
    ctx.moveTo(-10, -5); ctx.lineTo(-14, -24); ctx.lineTo(-4, -10); // Orelha Esquerda
    ctx.moveTo(10, -5); ctx.lineTo(14, -24); ctx.lineTo(4, -10);   // Orelha Direita
    ctx.fill();

    // Detalhe interno da orelha
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(-9, -7); ctx.lineTo(-12, -20); ctx.lineTo(-4, -11); // Interno Esquerda
    ctx.moveTo(9, -7); ctx.lineTo(12, -20); ctx.lineTo(4, -11);   // Interno Direita
    ctx.fill();

    // 3. Desenhar Corpo (Redondo e "Felpudo")
    ctx.fillStyle = birdColor; 
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); // Define o caminho da elipse
    ctx.fill(); // Pinta a cor base

    // Sombra na parte de baixo do corpo para dar volume
    const shadow = ctx.createRadialGradient(0, 6, 1, 0, 4, 14);
    shadow.addColorStop(0, 'rgba(0,0,0,0.3)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fill(); // Preenche a mesma elipse com a sombra

    // Iluminação (Highlight) - Parte superior esquerda
    const highlight = ctx.createRadialGradient(-5, -5, 1, -5, -5, 10);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.fill(); // Preenche a mesma elipse com a luz

    // 4. Desenhar Rosto
    // Olhos (Amarelos brilhantes para visão noturna)
    ctx.fillStyle = '#FFFF00'; 
    ctx.beginPath();
    ctx.arc(5, -3, 3.5, 0, Math.PI * 2); // Olho direito
    ctx.arc(-5, -3, 3.5, 0, Math.PI * 2); // Olho esquerdo
    ctx.fill();
    
    // Pupilas (Fendas verticais)
    ctx.fillStyle = 'black'; 
    ctx.beginPath();
    ctx.ellipse(5, -3, 1, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(-5, -3, 1, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Presas (Fangs)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-3, 3); ctx.lineTo(-1, 7); ctx.lineTo(1, 3); // Dente esquerdo
    ctx.moveTo(1, 3); ctx.lineTo(3, 7); ctx.lineTo(5, 3);   // Dente direito
    ctx.fill();
}

function drawOriginalSkin(wingFrame) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Corpo (Amarelo)
    ctx.fillStyle = '#F4D03F';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Olho (Branco Grande)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(6, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupila
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Asa (Branca) - Batendo
    ctx.fillStyle = '#FFF';
    const wingY = Math.sin(wingFrame) * 4;
    ctx.beginPath();
    ctx.ellipse(-8, 2 + wingY, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bico (Laranja)
    ctx.fillStyle = '#E67E22';
    // Parte de cima
    ctx.beginPath();
    ctx.rect(6, 0, 10, 6);
    ctx.fill();
    ctx.stroke();
    // Parte de baixo
    ctx.beginPath();
    ctx.rect(6, 6, 10, 4);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

export function drawBird(x, y, width, height, rotation, wingFrame) {
    // --- SOMBRA NO CHÃO ---
    // Desenha a sombra antes de qualquer transformação do pássaro
    const groundY = canvas.height - 50; // Nível aproximado do chão/água
    const distToGround = groundY - (y + height);
    
    if (distToGround > -50) { // Só desenha se estiver acima ou perto do chão
        const shadowScale = Math.max(0.2, 1 - (distToGround / 400)); // Diminui com a altura
        const shadowAlpha = Math.max(0.0, 0.4 - (distToGround / 300)); // Desaparece com a altura
        
        ctx.save();
        ctx.translate(x + width / 2, groundY + 10); // +10 para ficar na "superfície"
        ctx.scale(shadowScale, 0.3 * shadowScale); // Achatada
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, width, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    // Transladar para o centro do pássaro para rotacionar corretamente
    ctx.translate(x + width / 2, y + height / 2);

    // --- MODO GEOMETRY (Visual de Cubo) ---
    if (gameProps.isGeometryMode) {
        ctx.rotate(rotation); // Usa a rotação calculada
        
        // Brilho Neon
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 20;
        
        // Cubo
        ctx.fillStyle = '#000';
        ctx.fillRect(-width/2, -height/2, width, width); // Quadrado
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(-width/2, -height/2, width, width);
        
        // Rosto do Cubo
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(-5, -5, 10, 10); // Olho/Centro
        
        ctx.restore();
        return; // Não desenha o pássaro normal
    }
    // --------------------------------------

    ctx.rotate(rotation);

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
        ctx.strokeStyle = `rgba(255, 223, 0, ${0.5 + Math.sin(wingFrame) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const magnetRadius = 40 + Math.sin(wingFrame) * 5;
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

    // Efeito Glitch para a skin específica
    if (currentSkin.isGlitch && Math.random() < 0.2) { // 20% de chance de glitch por frame
        playGlitch();
        ctx.save();
        const xOff = (Math.random() - 0.5) * 10;
        const yOff = (Math.random() - 0.5) * 10;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6;

        // Canal Magenta deslocado
        ctx.translate(xOff, yOff);
        drawCompleteBat('#FF00FF', wingFrame);

        // Canal Ciano deslocado
        ctx.translate(-xOff * 2, -yOff * 2);
        drawCompleteBat('#00FFFF', wingFrame);

        ctx.restore();
    }

    // Rastro de partículas pixeladas para a skin Glitch
    if (currentSkin.isGlitch && Math.random() < 0.3) {
        createGlitchTrail(x + width / 2, y + height / 2);
    }

    // Desenho principal
    if (currentSkin.isOriginal) {
        drawOriginalSkin(wingFrame);
    } else {
        drawCompleteBat(birdColor, wingFrame);
    }

    ctx.restore();
    ctx.shadowBlur = 0; // Resetar shadow
}

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
    isGrounded: false,
    wasGrounded: false,
    
    draw: function() {
        drawBird(this.x, this.y, this.width, this.height, this.rotation, this.wingFrame);
    },
    
    update: function(onCollision) {
        if (gameProps.isFrozen) {
            // Player is frozen, no movement
            this.velocity = 0;
            return;
        }

        // Física Diferenciada no Modo Geometry
        if (gameProps.isGeometryMode) {
            // Reseta o estado de chão a cada frame (a colisão nos canos que vai definir se está true)
            this.wasGrounded = this.isGrounded;
            this.isGrounded = false; 

            this.velocity += 0.9; // Gravidade mais pesada para cair mais rápido
            this.y += this.velocity;

            // Se tocar no chão (fundo da tela), agora é seguro e permite pular
            const groundY = canvas.height - 50;
            if (this.y + this.height >= groundY) {
                // Efeito de impacto ao cair no chão
                if (!this.wasGrounded) {
                    createParticles(this.x + this.width/2, this.y + this.height, '#00FFFF', 12);
                }
                this.y = groundY - this.height;
                this.velocity = 0;
                this.isGrounded = true;
            }
            
            // Lógica de Rotação: Gira no ar, encaixa no chão
            if (this.isGrounded) {
                // Arredonda para o ângulo de 90 graus mais próximo (Math.PI / 2)
                this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            } else {
                this.rotation += 0.25; // Gira ainda mais rápido para dar sensação de velocidade
            }

            // Cria o rastro (Trail Effect)
            if (gameProps.frames % 3 === 0) { // A cada 3 frames para não sobrecarregar
                createGeometryTrail(this.x, this.y, 'rgba(0, 255, 255, 0.4)');
            }
        } else {
            this.isGrounded = false; // Garante que não está grounded fora do modo geometry
            this.velocity += this.gravity;
            this.y += this.velocity;
        }

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            if (!gameProps.isImmune) onCollision();
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Lógica de Rotação
        if (!gameProps.isGeometryMode) {
        if (this.velocity < 0) {
            this.rotation = -25 * Math.PI / 180; // Aponta para cima
        } else {
            this.rotation += 0.1; // Cai girando para baixo
            if (this.rotation > 90 * Math.PI / 180) {
                this.rotation = 90 * Math.PI / 180; // Limite de 90 graus
            }
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
        
        // No modo Geometry, só pode pular se estiver no chão
        if (gameProps.isGeometryMode) {
            if (this.isGrounded) {
                this.velocity = -17; // Pulo mais forte para compensar a gravidade extra
                this.isGrounded = false;
                gameProps.pulseScale = 1.02; // Pulsação leve (2% de zoom)
            }
        } else {
            this.velocity = -this.jump;
        }
        playJump();
    }
};