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
    slowMoCooldownTimer: 0,
    isHardcoreMode: false,
    isMissionMapOpen: false,
    isBossMode: false,
    playerAttackCooldown: 0,
    isPlayerShieldActive: false,
    playerShieldCooldown: 0,
    isFrozen: false,
    freezeTimer: 0,
    shieldUsageCount: 0,
    didDefeatBoss: false,
    furyCharge: 0,
    isFuryActive: false,
    furyTimer: 0,
    shockwaves: [],
    isGeometryMode: false,
    geometryTimer: 0,
    isGeometryCutscene: false,
    pulseScale: 1.0,
    deviceOffsetX: 0,
    deviceOffsetY: 0,
    timeOfDay: 0.0, // 0 = meia-noite, 0.5 = meio-dia
    dayNightCycleSpeed: 0.0001,
    hasAurora: false,
    auroraChecked: false
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
    gameProps.isMissionMapOpen = false;
    gameProps.playerAttackCooldown = 0;
    gameProps.isPlayerShieldActive = false;
    gameProps.playerShieldCooldown = 0;
    gameProps.isFrozen = false;
    gameProps.freezeTimer = 0;
    gameProps.shieldUsageCount = 0;
    gameProps.didDefeatBoss = false;
    gameProps.furyCharge = 0;
    gameProps.isFuryActive = false;
    gameProps.furyTimer = 0;
    gameProps.shockwaves = [];
    gameProps.isGeometryMode = false;
    gameProps.geometryTimer = 0;
    gameProps.isGeometryCutscene = false;
    gameProps.geometryPortalSpawned = false;
    gameProps.transitionFlash = 0; // 0 a 1 (opacidade do flash branco)
    gameProps.rgbSplitTimer = 0; // Timer para o efeito de distorção
    gameProps.pulseScale = 1.0;
    gameProps.deviceOffsetX = 0;
    gameProps.deviceOffsetY = 0;
    // O ciclo de dia/noite continua entre as partidas para ser mais natural
    // gameProps.timeOfDay = 0.0; 
    // isBossMode é definido no menu, não reseta aqui para false
}