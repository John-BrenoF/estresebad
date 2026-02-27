import { ctx, canvas, gameProps } from './state.js';
import { drawBird } from './bird.js';
import { playCloneSpawn } from './audio.js';

let fakeCones = [];

export function resetFakeCones() {
    fakeCones = [];
}

export function updateAndDrawFakeCones(bird) {
    // Lógica de Spawn: Verifica a cada 5 segundos (300 frames)
    // Chance de 9.5% (0.095)
    if (!gameProps.isGameOver && gameProps.frames % 300 === 0) {
        if (Math.random() < 0.095) {
            spawnFakeCones(bird);
            playCloneSpawn();
        }
        // Chance de 3% para o clone "inteligente" que joga por 8s
        if (Math.random() < 0.03) {
            spawnSmartClone(bird);
            playCloneSpawn();
        }
    }

    for (let i = 0; i < fakeCones.length; i++) {
        let cone = fakeCones[i];
        
        if (!gameProps.isGameOver) {
            const speedMultiplier = gameProps.isSlowMoActive ? 0.5 : 1;
            
            if (cone.type === 'smart') {
                // Lógica do Clone Inteligente
                if (cone.lifeTime > 0) {
                    cone.lifeTime--;
                    
                    // Física de pulo similar ao pássaro
                    cone.velocity += cone.gravity;
                    cone.y += cone.velocity * speedMultiplier;

                    // IA: Tenta manter a altura do jogador (imita o jogo)
                    if (cone.y > bird.y + 10 && cone.velocity > 0) {
                        cone.velocity = -cone.jump;
                    }

                    // Rotação baseada na velocidade (igual ao player)
                    if (cone.velocity < 0) {
                        cone.rotation = -25 * Math.PI / 180;
                    } else {
                        cone.rotation += 0.1;
                        if (cone.rotation > 90 * Math.PI / 180) cone.rotation = 90 * Math.PI / 180;
                    }
                } else {
                    // Acabou o tempo (8s), ele cai
                    cone.velocity += cone.gravity;
                    cone.y += cone.velocity * speedMultiplier;
                    cone.rotation += 0.15;
                }
            } else {
                // Lógica dos Clones Explosivos (Padrão)
                cone.speedY += cone.gravity;
                cone.x += cone.speedX * speedMultiplier;
                cone.y += cone.speedY * speedMultiplier;
                cone.rotation += 0.05;
            }
            
            cone.wingFrame += 0.3; // Animação das asas
        }

        // Desenhar o Clone (usando a mesma função do player)
        drawBird(cone.x, cone.y, cone.width, cone.height, cone.rotation, cone.wingFrame);

        // Remover se sair da tela
        if (cone.y > canvas.height + 100) {
            fakeCones.splice(i, 1);
            i--;
        }
    }
}

function spawnFakeCones(bird) {
    // Spawna 4 clones que explodem do jogador
    for (let i = 0; i < 4; i++) {
        fakeCones.push({
            type: 'explosive',
            x: bird.x,
            y: bird.y,
            width: 34, // Largura igual ao player
            height: 24, // Altura igual ao player
            speedX: (Math.random() - 0.5) * 6, // Velocidade horizontal inicial
            speedY: (Math.random() - 0.5) * 6 - 2, // Velocidade vertical inicial (principalmente para cima/lados)
            gravity: 0.2, // Gravidade para fazê-los cair
            rotation: (Math.random() - 0.5) * 0.5,
            wingFrame: Math.random() * Math.PI * 2 // Desfasa a animação da asa
        });
    }
}

function spawnSmartClone(bird) {
    fakeCones.push({
        type: 'smart',
        x: bird.x,
        y: bird.y,
        width: 34,
        height: 24,
        velocity: bird.velocity, // Começa com a velocidade atual do player
        gravity: 0.25,
        jump: 4.6,
        rotation: bird.rotation,
        wingFrame: bird.wingFrame,
        lifeTime: 8 * 60 // 8 segundos (60 fps * 8)
    });
}