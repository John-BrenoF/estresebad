import { getTotalCoins, getShopData } from './storage.js';

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
    isInMenu: true,
    lightningSurvived: 0,
    isRaining: false,
    lightningChance: 0.1,
    rainTimer: 0,
    isWindy: false,
    currentCoins: 0,
    totalCoins: 0,
    isShopOpen: false,
    shopData: null,
    isImmune: false,
    immunityTimer: 0,
    cardCooldownTimer: 0,
    isMagnetActive: false,
    magnetTimer: 0,
    magnetCooldownTimer: 0,
    isSlowMoActive: false,
    slowMoTimer: 0,
    slowMoCooldownTimer: 0
};

export function resetGameProps() {
    gameProps.frames = 0;
    gameProps.score = 0;
    gameProps.gameSpeed = 2;
    gameProps.isGameOver = false;
    gameProps.isNewHighScore = false;
    gameProps.isInMenu = false;
    gameProps.lightningSurvived = 0;
    gameProps.isRaining = false;
    gameProps.lightningChance = 0.1;
    gameProps.rainTimer = 0;
    gameProps.isWindy = false;
    gameProps.currentCoins = 0;
    gameProps.totalCoins = getTotalCoins();
    gameProps.isShopOpen = false;
    gameProps.shopData = getShopData();
    gameProps.isImmune = false;
    gameProps.immunityTimer = 0;
    // O cooldown do card não reseta para não ser abusado
    gameProps.isMagnetActive = false;
    gameProps.magnetTimer = 0;
    // O cooldown do ímã e slowmo não resetam
    gameProps.isSlowMoActive = false;
    gameProps.slowMoTimer = 0;
}