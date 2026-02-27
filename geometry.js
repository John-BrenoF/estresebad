import { ctx, canvas, gameProps } from './state.js';
import { playSlowMo } from './audio.js'; // Reutilizando som de efeito
import { triggerScreenShake } from './main.js';

export function checkGeometryEvent() {
    // Verifica a cada 10 segundos (600 frames) se estiver no modo hardcore, e não em boss, game over ou já no modo
    if (gameProps.isHardcoreMode && !gameProps.isGameOver && !gameProps.isBossMode && !gameProps.isGeometryMode && !gameProps.isGeometryCutscene) {
        if (gameProps.frames % 600 === 0) {
            // 5% de chance
            if (Math.random() < 0.05) {
                triggerGeometryMode();
            }
        }
    }
}

function triggerGeometryMode() {
    gameProps.isGeometryCutscene = true;
    gameProps.geometryTimer = 120; // 2 segundos de cutscene/preparação
    playSlowMo(); // Som de alerta
}

export function updateGeometryState() {
    if (gameProps.isGeometryCutscene) {
        gameProps.geometryTimer--;
        if (gameProps.geometryTimer <= 0) {
            gameProps.isGeometryCutscene = false;
            gameProps.isGeometryMode = true;
            gameProps.geometryTimer = 600; // 10 segundos de duração do modo (60fps * 10)
            gameProps.geometryPortalSpawned = false;
        }
    } else if (gameProps.isGeometryMode) {
        // O timer conta até 0, mas o modo só acaba quando pegar o portal (lógica no pipes.js)
        if (gameProps.geometryTimer > 0) gameProps.geometryTimer--;
    }
    
    // Atualiza o efeito de flash da transição
    if (gameProps.transitionFlash > 0) {
        gameProps.transitionFlash -= 0.05;
    }
}

export function finishGeometryMode() {
    gameProps.isGeometryMode = false;
    gameProps.geometryPortalSpawned = false;
    gameProps.transitionFlash = 1.0; // Flash branco total
    gameProps.rgbSplitTimer = 120; // 2 segundos de efeito RGB/Glitch
    triggerScreenShake(15, 20); // Tremor na transição
    playSlowMo(); // Som de saída
}

export function drawGeometryOverlay() {
    if (gameProps.isGeometryCutscene) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Efeito de piscar
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#FF00FF';
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ WARNING ⚠️", canvas.width / 2, canvas.height / 2 - 50);
        }

        ctx.fillStyle = '#00FFFF';
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GEOMETRY MODE", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillStyle = '#FFF';
        ctx.fillText("Prepare-se!", canvas.width / 2, canvas.height / 2 + 40);
        ctx.restore();
    } else if (gameProps.isGeometryMode) {
        // Barra de tempo do modo Geometry no topo
        const width = (gameProps.geometryTimer / 600) * canvas.width;
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(0, 0, width, 5);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FFFF';
    }

    // Desenha o Flash de Transição (se houver)
    if (gameProps.transitionFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gameProps.transitionFlash})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}