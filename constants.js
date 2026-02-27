// Chave para localStorage
export const HIGH_SCORES_KEY = 'morcegoFlap_highScores';
export const COINS_KEY = 'morcegoFlap_coins';
export const SHOP_DATA_KEY = 'morcegoFlap_shopData';

// Tempos de delay possíveis (em segundos)
export const DELAY_TIMES = [0.1, 1, 3, 10, 18, 6, 0];

// Tempos para o tubo móvel (em segundos)
export const MOVE_TIMES = [1.1, 0.8 ,0 ,0.3 ,0.12];

// Itens da Loja
export const CARD_PRICE = 50;
export const SLOWMO_PRICE = 75;
export const SKINS = [
    { id: 'default', name: 'Roxo Padrão', color: '#4B0082', price: 0 },
    { id: 'toxic', name: 'Verde Tóxico', color: '#7CFC00', price: 100 },
    { id: 'fire', name: 'Laranja Fogo', color: '#FF4500', price: 150 },
    { id: 'ice', name: 'Azul Gelo', color: '#00BFFF', price: 200 },
    { id: 'neon', name: 'Neon Brilhante', color: '#FF00FF', price: 500, glow: true },
    { id: 'gold', name: 'Dourado', color: '#FFD700', price: 300 },
    { id: 'silver', name: 'Prateado', color: '#C0C0C0', price: 250 },
    { id: 'ruby', name: 'Rubi', color: '#DC143C', price: 350 },
    { id: 'emerald', name: 'Esmeralda', color: '#50C878', price: 350 },
    { id: 'sapphire', name: 'Safira', color: '#0F52BA', price: 350 },
    { id: 'ninja', name: 'Ninja', color: '#111111', price: 400 },
    { id: 'ghost', name: 'Fantasma', color: 'rgba(255,255,255,0.5)', price: 450 },
    { id: 'alien', name: 'Alien', color: '#32CD32', price: 400 },
    { id: 'robot', name: 'Robô', color: '#708090', price: 400 },
];