import { ctx, canvas, gameProps } from './state.js';

const stars = [];
const buildings = [];
const mountains = [];
const mountains2 = [];
const clouds = [];
const shootingStars = [];
const fireflies = [];

function lerpColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    // Garante que os valores fiquem entre 0 e 255 e converte para hexadecimal
    const toHex = (c) => ('0' + Math.min(255, Math.max(0, c)).toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Cores para cada fase do dia
const DAY_CYCLE_COLORS = {
    night: { top: '#0f2027', bottom: '#203a43' },
    sunrise: { top: '#ff7e5f', bottom: '#feb47b' },
    day: { top: '#70c5ce', bottom: '#a1e2e8' },
    sunset: { top: '#ff7e5f', bottom: '#feb47b' } // Reutiliza as cores do nascer do sol
};

export function initBackground() {
    stars.length = 0;
    buildings.length = 0;
    mountains.length = 0;
    mountains2.length = 0;
    clouds.length = 0;
    shootingStars.length = 0;
    fireflies.length = 0;

    // Criar estrelas
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 200),
            size: Math.random() * 1.5 + 0.5,
            speedFactor: Math.random() * 0.1 + 0.05 // Mais lento para mais profundidade
        });
    }

    // Criar Montanhas Distantes (Camada 2 - Fundo)
    let mX2 = 0;
    while (mX2 < canvas.width * 2) {
        const width = 150 + Math.random() * 300;
        const height = 150 + Math.random() * 250;
        mountains2.push({
            x: mX2,
            y: canvas.height - 30, 
            width: width,
            height: height
        });
        mX2 += width - 80; 
    }

    // Criar Montanhas (Camada mais distante)
    let mX = 0;
    while (mX < canvas.width * 2) {
        const width = 100 + Math.random() * 200;
        const height = 100 + Math.random() * 150;
        mountains.push({
            x: mX,
            y: canvas.height - 50, // Base perto do chão
            width: width,
            height: height
        });
        mX += width - 50; // Sobreposição
    }

    // Criar prédios (silhueta)
    let currentX = 0;
    while (currentX < canvas.width * 2) {
        const width = 40 + Math.random() * 60;
        const height = 50 + Math.random() * 150;
        const isLighter = Math.random() > 0.8;
        const building = {
            x: currentX,
            y: canvas.height - height,
            width: width,
            height: height,
            color: isLighter ? '#222' : '#1a1a1a', // Cor inicial, será atualizada
            isLighter: isLighter
        };
        buildings.push(building);
        
        // Gerar janelas para o prédio
        building.windows = [];
        const cols = Math.floor(width / 12);
        const rows = Math.floor(height / 18);
        for(let r=1; r<rows; r++) {
            for(let c=1; c<cols; c++) {
                if(Math.random() > 0.4) { // 60% de chance de ter janela
                    building.windows.push({x: c*12, y: r*18, w: 6, h: 10});
                }
            }
        }
        
        currentX += width;
    }

    // Criar nuvens
    for (let i = 0; i < 7; i++) { // Generate 7 clouds
        const cloud = {
            x: Math.random() * canvas.width * 2,
            y: 50 + Math.random() * 150,
            speedFactor: (Math.random() * 0.1) + 0.1, // Um pouco mais rápido
            parts: []
        };
        const numParts = 3 + Math.floor(Math.random() * 4);
        let currentPartX = 0;
        for (let j = 0; j < numParts; j++) {
            const size = 20 + Math.random() * 25;
            cloud.parts.push({
                dx: currentPartX,
                dy: (Math.random() * 20) - 10,
                size: size
            });
            currentPartX += size * 0.7; // Overlap them
        }
        clouds.push(cloud);
    }

    // Criar vaga-lumes
    for (let i = 0; i < 20; i++) {
        fireflies.push({
            x: Math.random() * canvas.width,
            y: canvas.height - Math.random() * 150,
            angle: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5
        });
    }
}

export function updateAndDrawBackground() {
    // --- MODO GEOMETRY (Visual Grid Neon) ---
    if (gameProps.isGeometryMode) {
        // Fundo Roxo Escuro/Azul
        ctx.fillStyle = '#1a0b2e'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Efeito de Grid em movimento
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; // Ciano transparente
        
        const gridSize = 60;
        // O offset cria a ilusão de movimento baseada na velocidade do jogo
        const offsetX = (gameProps.frames * gameProps.gameSpeed * 0.5) % gridSize;
        
        // Linhas Verticais (que se movem)
        for (let x = -offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Linhas Horizontais (fixas para dar profundidade ou chão)
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Chão sólido
        ctx.fillStyle = '#000';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, canvas.height - 50, canvas.width, 50);

        return;
    }
    // ----------------------------------------

    // --- CICLO DE DIA E NOITE ---
    const time = gameProps.timeOfDay;
    let topColor, bottomColor;

    if (time < 0.25) { // Noite -> Nascer do sol
        const factor = time / 0.25;
        topColor = lerpColor(DAY_CYCLE_COLORS.night.top, DAY_CYCLE_COLORS.sunrise.top, factor);
        bottomColor = lerpColor(DAY_CYCLE_COLORS.night.bottom, DAY_CYCLE_COLORS.sunrise.bottom, factor);
    } else if (time < 0.5) { // Nascer do sol -> Dia
        const factor = (time - 0.25) / 0.25;
        topColor = lerpColor(DAY_CYCLE_COLORS.sunrise.top, DAY_CYCLE_COLORS.day.top, factor);
        bottomColor = lerpColor(DAY_CYCLE_COLORS.sunrise.bottom, DAY_CYCLE_COLORS.day.bottom, factor);
    } else if (time < 0.75) { // Dia -> Pôr do sol
        const factor = (time - 0.5) / 0.25;
        topColor = lerpColor(DAY_CYCLE_COLORS.day.top, DAY_CYCLE_COLORS.sunset.top, factor);
        bottomColor = lerpColor(DAY_CYCLE_COLORS.day.bottom, DAY_CYCLE_COLORS.sunset.bottom, factor);
    } else { // Pôr do sol -> Noite
        const factor = (time - 0.75) / 0.25;
        topColor = lerpColor(DAY_CYCLE_COLORS.sunset.top, DAY_CYCLE_COLORS.night.top, factor);
        bottomColor = lerpColor(DAY_CYCLE_COLORS.sunset.bottom, DAY_CYCLE_COLORS.night.bottom, factor);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pX = gameProps.deviceOffsetX || 0;
    const pY = gameProps.deviceOffsetY || 0;
    // Fatores de paralaxe para o giroscópio
    const buildingParallaxX = pX * 1.2;
    const buildingParallaxY = pY * 1.2;

    // --- REFLEXOS NA ÁGUA ---
    const waterY = canvas.height - 60; // Nível da água
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, waterY, canvas.width, canvas.height - waterY);
    ctx.clip();
    
    // Fundo da água (reflexo do céu escurecido)
    ctx.fillStyle = bottomColor; 
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);
    ctx.globalAlpha = 1.0;
    
    // Espelhamento vertical para os reflexos
    ctx.translate(0, waterY * 2);
    ctx.scale(1, -1);
    
    // Reflexo da Lua
    let moonTimeReflect = time;
    if (moonTimeReflect < 0.3) moonTimeReflect += 1.0;
    if (moonTimeReflect > 0.7 && moonTimeReflect < 1.3) {
        const moonProgress = (moonTimeReflect - 0.7) / 0.6;
        const moonX = moonProgress * (canvas.width + 100) - 50;
        const moonY = canvas.height - 150 - Math.sin(moonProgress * Math.PI) * (canvas.height - 300);
        
        ctx.save();
        ctx.translate(moonX + pX * 0.1, moonY + pY * 0.1);
        
        // Efeito de "Estrada de Luz" na água (Shimmering Path)
        const shimmerTime = Date.now() / 200;
        
        // Brilho base
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(244, 246, 240, 0.2)';
        
        // Desenha várias fatias para simular o reflexo quebrando nas ondas
        for (let i = 0; i < 12; i++) {
            const wavePhase = shimmerTime + i * 0.5;
            const xShift = Math.sin(wavePhase) * (5 + i); // Ondulação horizontal
            const width = 35 - i * 1.5 + Math.cos(wavePhase) * 5; // Largura variável
            const height = 6 + i * 0.5;
            const yPos = - (i * 15); // Y negativo desce na tela (devido ao scale -1)
            
            ctx.beginPath();
            ctx.ellipse(xShift, yPos, width, height, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Reflexo dos Prédios
    buildings.forEach(b => {
        if (b.color) {
            ctx.fillStyle = b.color;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(b.x + buildingParallaxX, b.y + buildingParallaxY, b.width + 1, b.height);
        }
    });
    
    ctx.restore();
    
    // Superfície da água (brilho sutil)
    ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);

    // Ondas na superfície
    ctx.save();
    ctx.lineWidth = 1.5;
    const waveTime = Date.now() / 800;

    // Função para desenhar uma onda mais fluida
    const drawSingleWave = (yBase, amplitude, frequency, speed, alpha) => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 5) {
            const yOffset = Math.sin(x * frequency + waveTime * speed) * amplitude;
            ctx.lineTo(x, yBase + yOffset);
        }
        ctx.stroke();
    };

    // Desenha múltiplas camadas de ondas para dar profundidade e realismo
    drawSingleWave(waterY + 20, 4, 0.03, 0.8, 0.15); // Fundo, lenta e sutil
    drawSingleWave(waterY + 12, 6, 0.02, 1.2, 0.2);  // Meio
    drawSingleWave(waterY + 5, 5, 0.025, 1.0, 0.25); // Frente, mais visível
    ctx.restore();

    // --- LÓGICA DA AURORA ---
    // Sorteia se vai ter aurora quando anoitece (time > 0.7)
    if (time > 0.7 && time < 0.75 && !gameProps.auroraChecked) {
        gameProps.hasAurora = Math.random() < 0.123; // 12.3% de chance
        gameProps.auroraChecked = true;
    }
    // Reseta durante o dia
    if (time > 0.25 && time < 0.7) {
        gameProps.auroraChecked = false;
        gameProps.hasAurora = false;
    }

    // Desenhar estrelas (apenas à noite)
    let starAlpha = 0;
    if (time > 0.75) starAlpha = (time - 0.75) / 0.25; // Fade in
    else if (time < 0.25) starAlpha = 1 - (time / 0.25); // Fade out

    if (starAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
        stars.forEach(star => {
            if (!gameProps.isGameOver) {
                star.x -= gameProps.gameSpeed * star.speedFactor;
                if (star.x < 0) star.x = canvas.width;
            }
            ctx.fillRect(star.x + (pX * 0.2), star.y + (pY * 0.2), star.size, star.size);
        });
    }

    // Desenhar Aurora Boreal
    if (gameProps.hasAurora && (time > 0.7 || time < 0.3)) {
        let auroraAlpha = 0;
        // Fade in/out suave
        if (time > 0.7) auroraAlpha = (time - 0.7) / 0.2;
        else if (time < 0.3) auroraAlpha = 1 - (time / 0.3);
        if (auroraAlpha > 1) auroraAlpha = 1;

        ctx.save();
        ctx.globalAlpha = auroraAlpha * 0.6;
        ctx.globalCompositeOperation = 'screen'; // Brilho suave

        const t = Date.now() / 3000;

        // Camada 1: Verde
        const gradient1 = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
        gradient1.addColorStop(0, 'rgba(0, 255, 128, 0)');
        gradient1.addColorStop(0.5, 'rgba(0, 255, 128, 0.4)');
        gradient1.addColorStop(1, 'rgba(0, 255, 128, 0)');

        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= canvas.width; x += 20) {
            const y = Math.sin(x * 0.005 + t) * 40 + Math.sin(x * 0.01 - t * 1.5) * 20 + 100;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, 0);
        ctx.fill();

        // Camada 2: Roxo/Azul (mais sutil)
        const gradient2 = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
        gradient2.addColorStop(0, 'rgba(100, 0, 255, 0)');
        gradient2.addColorStop(0.6, 'rgba(100, 0, 255, 0.2)');
        gradient2.addColorStop(1, 'rgba(100, 0, 255, 0)');

        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= canvas.width; x += 20) {
            const y = Math.sin(x * 0.008 - t) * 50 + Math.sin(x * 0.02 + t) * 20 + 80;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, 0);
        ctx.fill();

        ctx.restore();
    }

    // --- ESTRELAS CADENTES ---
    // Apenas à noite (time > 0.7 ou time < 0.25)
    if (time > 0.7 || time < 0.25) {
        if (Math.random() < 0.008) { // 0.8% de chance por frame
            shootingStars.push({
                x: Math.random() * canvas.width + 200, // Começa um pouco à direita ou no meio
                y: Math.random() * (canvas.height / 2),
                length: Math.random() * 80 + 40,
                speed: Math.random() * 15 + 15
            });
        }
    }

    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < shootingStars.length; i++) {
        let s = shootingStars[i];
        s.x -= s.speed;
        s.y += s.speed * 0.6; // Move na diagonal (esquerda-baixo)

        ctx.globalAlpha = Math.max(0, 1 - (s.y / (canvas.height * 0.8))); // Fade out
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.length, s.y - s.length * 0.6); // Rastro atrás
        ctx.stroke();

        if (s.x < -200 || s.y > canvas.height) {
            shootingStars.splice(i, 1);
            i--;
        }
    }
    ctx.restore();

    // Desenhar Nuvens
    const dayFactor = Math.sin(time * Math.PI);
    if (dayFactor > 0.1) { // Só desenha se não for noite profunda
        // Fator que é 0 no meio-dia e 0.5 no nascer/pôr do sol
        const sunsetFactor = Math.abs(time - 0.5); 
        const cloudColor = lerpColor('#FFFFFF', DAY_CYCLE_COLORS.sunrise.bottom, sunsetFactor);

        ctx.save();
        ctx.fillStyle = cloudColor;
        ctx.globalAlpha = dayFactor * 0.7; // Nuvens um pouco transparentes

        clouds.forEach(cloud => {
            if (!gameProps.isGameOver) {
                cloud.x -= gameProps.gameSpeed * cloud.speedFactor;
                // A largura de uma nuvem é variável, 200 é uma estimativa segura
                if (cloud.x + 200 < 0) { 
                    cloud.x = canvas.width + 50;
                    cloud.y = 50 + Math.random() * 150;
                }
            }

            // Parallax para nuvens (movimento mais lento que os prédios)
            const cloudParallaxX = pX * 0.8;
            const cloudParallaxY = pY * 0.8;

            // Sombra da Nuvem (Offset)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            cloud.parts.forEach(part => {
                ctx.arc(cloud.x + part.dx + cloudParallaxX + 5, cloud.y + part.dy + cloudParallaxY + 5, part.size, 0, Math.PI * 2);
            });
            ctx.fill();

            // Corpo da Nuvem
            ctx.fillStyle = cloudColor;
            ctx.beginPath(); // Começa um novo path para a nuvem inteira
            cloud.parts.forEach(part => {
                // Adiciona cada círculo ao path
                ctx.arc(cloud.x + part.dx + cloudParallaxX, cloud.y + part.dy + cloudParallaxY, part.size, 0, Math.PI * 2);
            });
            ctx.fill(); // Preenche a forma combinada dos círculos
        });
        ctx.restore();
    }

    // Desenhar Sol
    if (time > 0.2 && time < 0.8) {
        const sunProgress = (time - 0.2) / 0.6;
        const sunX = sunProgress * (canvas.width + 100) - 50;
        const sunY = canvas.height - 150 - Math.sin(sunProgress * Math.PI) * (canvas.height - 300);
        
        const sunScreenX = sunX + pX * 0.1;
        const sunScreenY = sunY + pY * 0.1;

        ctx.save();
        ctx.translate(sunScreenX, sunScreenY);

        // Brilho
        ctx.shadowColor = '#FFA500';
        ctx.shadowBlur = 50;
        ctx.fillStyle = '#FFD700';
        
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();

        // --- LENS FLARE (Reflexo de Lente) ---
        ctx.save();
        ctx.globalCompositeOperation = 'screen'; // Mistura aditiva para luz
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dirX = centerX - sunScreenX;
        const dirY = centerY - sunScreenY;
        
        // Função auxiliar para desenhar círculos do flare
        const drawFlare = (pos, size, color, alpha) => {
            const fx = sunScreenX + dirX * pos;
            const fy = sunScreenY + dirY * pos;
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(fx, fy, size, 0, Math.PI * 2);
            ctx.fill();
        };

        drawFlare(0.3, 40, 'rgba(255, 255, 200, 0.3)', 0.2);
        drawFlare(0.6, 20, 'rgba(255, 200, 200, 0.3)', 0.15);
        drawFlare(0.9, 10, 'rgba(200, 255, 200, 0.3)', 0.3);
        drawFlare(1.3, 60, 'rgba(200, 200, 255, 0.2)', 0.1);
        drawFlare(2.2, 100, 'rgba(255, 255, 255, 0.1)', 0.05);
        
        ctx.restore();
    }

    // Desenhar Lua
    let moonTime = time;
    if (moonTime < 0.3) moonTime += 1.0;
    
    if (moonTime > 0.7 && moonTime < 1.3) {
        const moonProgress = (moonTime - 0.7) / 0.6;
        const moonX = moonProgress * (canvas.width + 100) - 50;
        const moonY = canvas.height - 150 - Math.sin(moonProgress * Math.PI) * (canvas.height - 300);

        ctx.save();
        ctx.translate(moonX + pX * 0.1, moonY + pY * 0.1);

        // Brilho
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 60; // Brilho aumentado
        ctx.fillStyle = '#F4F6F0';
        
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Crateras
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(-10, -6, 7, 0, Math.PI * 2);
        ctx.arc(12, 6, 5, 0, Math.PI * 2);
        ctx.arc(-3, 14, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Desenhar Montanhas Distantes (Paralaxe Muito Lenta)
    const mountain2Color = lerpColor(bottomColor, '#333333', 0.4); // Mistura com o céu para profundidade
    ctx.fillStyle = mountain2Color;
    mountains2.forEach(m => {
        if (!gameProps.isGameOver) {
            m.x -= gameProps.gameSpeed * 0.08; // Paralaxe: mais lento que montanhas 1
            if (m.x + m.width < 0) m.x += canvas.width * 2;
        }
        const parallaxX = pX * 0.3;
        const parallaxY = pY * 0.3;
        ctx.beginPath();
        ctx.moveTo(m.x + parallaxX, m.y + parallaxY);
        ctx.lineTo(m.x + m.width / 2 + parallaxX, m.y - m.height + parallaxY);
        ctx.lineTo(m.x + m.width + parallaxX, m.y + parallaxY);
        ctx.fill();
    });

    // Desenhar Montanhas (Paralaxe Lenta)
    const mountainColor = lerpColor(bottomColor, '#000000', 0.3); // Um pouco mais escuro que o céu
    ctx.fillStyle = mountainColor;
    mountains.forEach(m => {
        if (!gameProps.isGameOver) {
            m.x -= gameProps.gameSpeed * 0.15; // Paralaxe: Lento
            if (m.x + m.width < 0) m.x += canvas.width * 2;
        }
        const parallaxX = pX * 0.5;
        const parallaxY = pY * 0.5;
        ctx.beginPath();
        ctx.moveTo(m.x + parallaxX, m.y + parallaxY);
        ctx.lineTo(m.x + m.width / 2 + parallaxX, m.y - m.height + parallaxY);
        ctx.lineTo(m.x + m.width + parallaxX, m.y + parallaxY);
        ctx.fill();
    });

    // Desenhar e mover prédios (Paralaxe)
    buildings.forEach(b => {
        if (!gameProps.isGameOver) {
            b.x -= gameProps.gameSpeed * 0.5; // Paralaxe: Movem-se a 50% da velocidade do jogo
            if (b.x + b.width < 0) b.x += canvas.width * 2; // Recicla o prédio lá na frente
        }
        const nightColor = b.isLighter ? '#222' : '#1a1a1a';
        const dayColor = b.isLighter ? '#555' : '#4a4a4a';
        b.color = lerpColor(nightColor, dayColor, dayFactor);
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x + buildingParallaxX, b.y + buildingParallaxY, b.width + 1, b.height); // +1 para evitar linhas brancas entre prédios
        
        // Desenhar Janelas
        // À noite (time < 0.25 ou > 0.75), as janelas acendem (amarelo claro)
        // De dia, elas ficam escuras/reflexivas (azul claro transparente)
        const isNight = time < 0.25 || time > 0.75;
        const windowColor = isNight ? 'rgba(255, 255, 200, 0.6)' : 'rgba(200, 220, 255, 0.1)';
        
        ctx.fillStyle = windowColor;
        b.windows.forEach(w => {
            ctx.fillRect(b.x + buildingParallaxX + w.x, b.y + buildingParallaxY + w.y, w.w, w.h);
        });
    });

    // --- NEBLINA MATINAL ---
    // Aparece perto do nascer do sol (0.25 é o pico do nascer do sol)
    // Visível entre 0.15 e 0.35
    let fogAlpha = 0;
    if (time >= 0.15 && time <= 0.35) {
        if (time < 0.25) fogAlpha = (time - 0.15) / 0.1; // Fade in
        else fogAlpha = 1 - ((time - 0.25) / 0.1); // Fade out
    }

    if (fogAlpha > 0) {
        ctx.save();
        const gradient = ctx.createLinearGradient(0, canvas.height - 250, 0, canvas.height);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(200, 220, 230, ${fogAlpha * 0.4})`); // Branco azulado
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 250, canvas.width, 250);
        ctx.restore();
    }

    // --- VAGA-LUMES ---
    // Apenas à noite
    if (time > 0.7 || time < 0.25) {
        fireflies.forEach(f => {
            f.x += Math.cos(f.angle) * f.speed;
            f.y += Math.sin(f.angle) * f.speed;
            f.angle += (Math.random() - 0.5) * 0.2;
            
            if(f.x < 0) f.x = canvas.width;
            if(f.x > canvas.width) f.x = 0;
            if(f.y < canvas.height - 150) f.y = canvas.height - 150;
            if(f.y > canvas.height) f.y = canvas.height;
            
            const alpha = 0.5 + Math.sin(Date.now() * 0.005 + f.x) * 0.5;
            
            ctx.fillStyle = `rgba(200, 255, 50, ${alpha})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}