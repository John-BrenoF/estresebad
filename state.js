export const canvas = document.getElementById('jogoCanvas');
export const ctx = canvas.getContext('2d');

export const gameProps = {
    frames: 0,
    score: 0,
    gameSpeed: 2,
    isGameOver: false,
    difficultyMultiplier: 0.0005,
    isNewHighScore: false,
    
    // Variáveis do sistema de delay aleatório
    isWaitingToStart: false,
    waitTimeRemaining: 0,
    selectedDelay: 0,
    waitStartTime: 0,
    lastDeathTime: 0,
    isInMenu: true
};

export function resetGameProps() {
    gameProps.frames = 0;
    gameProps.score = 0;
    gameProps.gameSpeed = 2;
    gameProps.isGameOver = false;
    gameProps.isNewHighScore = false;
    gameProps.isInMenu = false;
}