import { ctx, canvas, gameProps } from './state.js';
import { playScore, playExplosion } from './audio.js';
import { triggerShockwave } from './main.js';
import { createParticles, createDust } from './particles.js';
import { createCoin } from './coins.js';
import { spawnMovingTube, movingTube } from './movingTube.js';
import { finishGeometryMode } from './geometry.js';

export const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;

export function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        if (p.destroyed) continue;
        
        // --- PORTAL DE SAÍDA (Geometry Mode) ---
        if (p.isPortal) {
            ctx.save();
            const centerX = p.x + p.width / 2;
            const centerY = p.y + p.height / 2;
            ctx.translate(centerX, centerY);
            
            // Efeito de Rotação do Portal
            ctx.rotate(gameProps.frames * -0.1);

            // Desenho do Vórtice
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(0, 0, p.width / 2 - (j * 10), 0, Math.PI * 2);
                ctx.strokeStyle = j % 2 === 0 ? '#00FFFF' : '#FF00FF'; // Ciano e Magenta
                ctx.lineWidth = 4;
                ctx.shadowBlur = 20;
                ctx.shadowColor = ctx.strokeStyle;
                
                // Abertura no arco para dar efeito de espiral
                const startAngle = (gameProps.frames * 0.1) + (j * Math.PI / 2);
                ctx.arc(0, 0, p.width / 2 - (j * 10), startAngle, startAngle + 4);
                ctx.stroke();
            }
            
            ctx.restore();
            continue;
        }
        // ---------------------------------------

        // --- OBSTÁCULO SERRA (Geometry Mode) ---
        if (p.isSaw) {
            ctx.save();
            // Move para o centro da serra para rotacionar
            const centerX = p.x + p.width / 2;
            const centerY = p.y + p.height / 2;
            ctx.translate(centerX, centerY);
            
            // Rotação baseada nos frames
            ctx.rotate(gameProps.frames * -0.2); // Gira anti-horário

            // Desenho da Serra
            ctx.fillStyle = '#888'; // Metal
            ctx.beginPath();
            // Cria uma forma dentada
            const spikes = 8;
            const outerRadius = p.width / 2;
            const innerRadius = p.width / 4;
            for (let j = 0; j < spikes * 2; j++) {
                const r = (j % 2 === 0) ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 * j) / (spikes * 2);
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#FF0000'; // Borda vermelha perigosa
            ctx.lineWidth = 2;
            ctx.stroke();

            // Centro da serra
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            continue;
        }

        // --- MODO GEOMETRY (Blocos Neon) ---
        if (gameProps.isGeometryMode) {
            ctx.save();
            ctx.fillStyle = '#000'; // Interior preto
            ctx.strokeStyle = '#00FF00'; // Borda Verde Neon
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00FF00';

            // Desenha um único bloco no chão
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeRect(p.x, p.y, p.width, p.height);
            
            ctx.restore();
            continue;
        }
        // -----------------------------------

        // --- CANOS PADRÃO (Visual 3D) ---
        
        // Gradiente para dar volume cilíndrico
        const gradient = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradient.addColorStop(0, '#1a5230'); // Sombra escura
        gradient.addColorStop(0.2, '#2E8B57'); // Cor base
        gradient.addColorStop(0.5, '#66cdaa'); // Brilho central
        gradient.addColorStop(0.8, '#2E8B57'); // Cor base
        gradient.addColorStop(1, '#1a5230'); // Sombra escura

        ctx.fillStyle = gradient;
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.fillRect(p.x, canvas.height - p.bottom, pipeWidth, p.bottom);
        
        // Tampas dos canos (Borda mais larga na ponta)
        const capHeight = 25;
        const capOverhang = 4;
        
        // Tampa Superior
        ctx.fillRect(p.x - capOverhang, p.top - capHeight, pipeWidth + capOverhang * 2, capHeight);
        // Tampa Inferior
        ctx.fillRect(p.x - capOverhang, canvas.height - p.bottom, pipeWidth + capOverhang * 2, capHeight);
        
        // Bordas para definição
        ctx.strokeStyle = '#0f331c'; // Verde bem escuro
        ctx.lineWidth = 2;
        
        // Desenha contorno das tampas
        ctx.strokeRect(p.x - capOverhang, p.top - capHeight, pipeWidth + capOverhang * 2, capHeight);
        ctx.strokeRect(p.x - capOverhang, canvas.height - p.bottom, pipeWidth + capOverhang * 2, capHeight);
    }
}

export function updatePipes(bird, onCollision) {
    let spawnRate = Math.max(70, 120 - Math.floor(gameProps.score / 5)); 
    
    // --- LÓGICA DE SPAWN MODO GEOMETRY ---
    if (gameProps.isGeometryMode) {
        // Só spawna obstáculos se ainda tiver tempo (> 60 frames)
        if (gameProps.geometryTimer > 60 && gameProps.frames % spawnRate === 0) {
            const groundY = canvas.height - 50;
            
            // 30% de chance de ser uma Serra, 70% Bloco
            if (Math.random() < 0.3) {
                const sawSize = 50;
                pipes.push({
                    x: canvas.width,
                    y: groundY - sawSize + 10, // Levemente enterrada no chão
                    width: sawSize,
                    height: sawSize,
                    passed: false,
                    isSaw: true // Flag de serra
                });
            } else {
                const blockHeight = Math.random() * 80 + 40;
                pipes.push({
                    x: canvas.width,
                    y: groundY - blockHeight,
                    width: pipeWidth,
                    height: blockHeight,
                    passed: false,
                    isGeometryBlock: true
                });
            }
        }
        // Se o tempo acabou e o portal ainda não foi criado, cria o portal
        else if (gameProps.geometryTimer <= 0 && !gameProps.geometryPortalSpawned) {
            const groundY = canvas.height - 50;
            const portalSize = 120;
            pipes.push({
                x: canvas.width + 100, // Spawna um pouco fora da tela
                y: groundY - portalSize + 20, // Toca o chão
                width: portalSize,
                height: portalSize,
                isPortal: true
            });
            gameProps.geometryPortalSpawned = true;
        }
    } else { // --- LÓGICA DE SPAWN NORMAL ---

    if (gameProps.frames % spawnRate === 0) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
        
        // 10% de chance de spawnar o tubo móvel no lugar de um cano normal
        // (apenas se ele não estiver ativo)
        if (!movingTube.active && !gameProps.isHardcoreMode && Math.random() < 0.1) {
            spawnMovingTube(canvas.width);
            
            // Chance de moeda no tubo móvel também
            if (Math.random() < 0.5) {
                createCoin(canvas.width + pipeWidth / 2, movingTube.baseTopHeight + pipeGap / 2);
            }
        } else {
            let bottomHeight = canvas.height - pipeGap - topHeight;
            pipes.push({
                x: canvas.width,
                top: topHeight,
                bottom: bottomHeight,
                passed: false,
                destroyed: false
            });

            // 50% de chance de gerar uma moeda no vão do cano
            if (Math.random() < 0.5) {
                createCoin(canvas.width + pipeWidth / 2, topHeight + pipeGap / 2);
            }
        }
    }
    }

    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
        p.x -= gameProps.gameSpeed * speedMultiplier;

        // Efeito de Poeira arrastando no chão
        if (!gameProps.isGameOver && gameProps.frames % 15 === 0) {
            createDust(p.x + pipeWidth / 2, canvas.height - 5);
        }

        // Lógica de colisão
        let collided = false;
        
        if (p.isPortal) {
            // Colisão com o Portal (Entrada)
            const dx = (bird.x + bird.width/2) - (p.x + p.width/2);
            const dy = (bird.y + bird.height/2) - (p.y + p.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < p.width/3) { // Hitbox no centro do portal
                finishGeometryMode();
            }
        } else if (p.isSaw) {
            // Colisão com Serra (Circular simples)
            const dx = (bird.x + bird.width/2) - (p.x + p.width/2);
            const dy = (bird.y + bird.height/2) - (p.y + p.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            // Hitbox um pouco menor que o visual para ser justo
            if (distance < (p.width/2) + (bird.width/2) - 5) collided = true;
        } else if (p.isGeometryBlock) {
            // Verifica se há sobreposição horizontal (está na mesma coluna do bloco)
            if (bird.x + bird.width > p.x && bird.x < p.x + p.width) {
                
                // Lógica de Plataforma:
                // Se o pé do pássaro está próximo ao topo do bloco E ele está caindo (velocity >= 0)
                if (bird.y + bird.height >= p.y && bird.y + bird.height <= p.y + 25 && bird.velocity >= 0) {
                    // Pousou com sucesso
                    if (!bird.wasGrounded) {
                        createParticles(bird.x + bird.width/2, bird.y + bird.height, '#00FF00', 8);
                    }
                    
                    bird.isGrounded = true;
                    bird.velocity = 0;
                    bird.y = p.y - bird.height; // Corrige a posição para ficar exatamente em cima
                    // Encaixa a rotação ao pousar no bloco
                    bird.rotation = Math.round(bird.rotation / (Math.PI / 2)) * (Math.PI / 2);
                } 
                // Se não pousou no topo, mas está tocando no bloco (lado ou dentro), é colisão
                else if (bird.y + bird.height > p.y + 10) {
                    collided = true;
                }
            }
        } else {
            // Colisão com canos normais
            if (!p.destroyed && bird.x < p.x + pipeWidth && bird.x + bird.width > p.x &&
                (bird.y < p.top || bird.y + bird.height > canvas.height - p.bottom)) {
                collided = true;
            }
        }

        if (collided) {
            if (gameProps.isFuryActive) {
                p.destroyed = true;
                playExplosion();
                triggerShockwave(p.x + pipeWidth/2, bird.y + bird.height/2);
                createParticles(p.x + pipeWidth/2, p.top, '#FF4500', 30);
                createParticles(p.x + pipeWidth/2, canvas.height - p.bottom, '#FF4500', 30);
            } else if (!gameProps.isImmune) {
                onCollision();
            }
        }

        // Pontuação
        if (p.x + (p.width || pipeWidth) < bird.x && !p.passed) {
            gameProps.score++;
            try {
                playScore();
            } catch (e) {
                console.error("Erro som:", e);
            }
            
            try {
                createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, '#FFD700', 15);
            } catch (e) {
                console.error("Erro nas partículas:", e);
            }

            if (gameProps.furyCharge < 5) {
                gameProps.furyCharge++;
            }
            
            p.passed = true;
        }

        // Remover canos que saíram da tela
        if (p.x + (p.width || pipeWidth) < 0) {
            pipes.shift();
            i--;
        }
    }
}