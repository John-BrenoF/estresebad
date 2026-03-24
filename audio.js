const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function resumeAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function playJump() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

export function playScore() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

export function playDie() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

export function playThunder() {
    resumeAudio();
    const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 segundos de ruído
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

export function playBuy() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

export function playExplosion() {
    resumeAudio();
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

export function playShield() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

export function playSlowMo() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.8);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

export function playGhost() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 1.5);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

const normalMusic = new Audio('musicap.mp3'); // Certifique-se de que o caminho está correto
normalMusic.loop = true;

const horrorMusic = new Audio('ttoux.mp3');
horrorMusic.loop = true;

export function playNormalMusic() {
    stopNormalMusic(); // Garante que ambas estejam paradas/resetadas antes de escolher

    if (Math.random() < 0.40){//30% de chance
        horrorMusic.play().catch(e => console.error("Erro ao tocar música horror:", e));
    } else {
        normalMusic.play().catch(e => console.error("Erro ao tocar música normal:", e));
    }
}

export function stopNormalMusic() {
    normalMusic.pause();
    normalMusic.currentTime = 0;
    horrorMusic.pause();
    horrorMusic.currentTime = 0;
}




const bossMusic = new Audio('ttoux.mp3');
bossMusic.loop = true;

export function playBossMusic() {
    bossMusic.currentTime = 0;
    bossMusic.loop = true; // Garante que o loop está ativo
    bossMusic.play().catch(e => console.log("Erro ao tocar música:", e));
}

export function stopBossMusic() {
    bossMusic.pause();
    bossMusic.currentTime = 0;
}

export function playPlayerAttack() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

export function playPlayerRedShot() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square'; // Onda quadrada para um som mais "pesado" e agressivo
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); // Volume mais alto que o normal
    
    osc.frequency.setValueAtTime(1800, audioCtx.currentTime); // Começa bem agudo
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4); // Cai drasticamente (efeito "Pewww" potente)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

export function playBossDefeated() {
    resumeAudio();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    osc1.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
    osc1.frequency.exponentialRampToValueAtTime(5, audioCtx.currentTime + 2.5);
    osc2.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 2.5);
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 2.5);
    osc2.stop(audioCtx.currentTime + 2.5);
}

export function playPlayerShield() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.2);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

export function playGlitch() {
    resumeAudio();
    const bufferSize = audioCtx.sampleRate * 0.1; // Short burst
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 20;
    
    // Rapidly change frequency
    filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
    filter.frequency.exponentialRampToValueAtTime(4000, audioCtx.currentTime + 0.1);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.1);
}

export function playBossLaser() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.4);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

export function playBossRedLightning() {
    resumeAudio();
    const bufferSize = audioCtx.sampleRate * 0.6; // A bit longer than thunder
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2); // Noise with decay
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.6);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

export function playCloneSpawn() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

export function playSoundWave() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5); // Som "Wub wub" subindo
    
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

const catMusic = new Audio('#cat #meme U Ii A I A u III A I cat.mp3');
let catJumpTimeout = null;
let lastCatJumpTime = 0;

export function playCatJump() {
    const now = Date.now();
    const timeSinceLast = now - lastCatJumpTime;
    lastCatJumpTime = now;

    // Se o pulo for rápido (menos de 500ms do anterior)
    if (timeSinceLast < 500) {
        clearTimeout(catJumpTimeout);
        catMusic.loop = true; // Ativa loop para continuar tocando
        if (catMusic.paused) {
            catMusic.play().catch(e => console.error("Erro ao tocar gato:", e));
        }
        
        // Se parar de pular, para a música após um tempo
        catJumpTimeout = setTimeout(() => {
            catMusic.pause();
            catMusic.currentTime = 0;
            catMusic.loop = false;
        }, 1500);
    } else {
        // Pulo isolado
        catMusic.loop = false;
        catMusic.currentTime = 0;
        catMusic.play().catch(e => console.error("Erro ao tocar gato:", e));
        
        clearTimeout(catJumpTimeout);
        // Para em 1.2s se for apenas um pulo
        catJumpTimeout = setTimeout(() => {
            catMusic.pause();
            catMusic.currentTime = 0;
        }, 1200);
    }
}

export function playAchievementUnlock() {
    resumeAudio();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.4);
    
    osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.5);
    osc2.stop(audioCtx.currentTime + 0.5);
}

export function playPowerupSound() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}
