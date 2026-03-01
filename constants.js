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
    { id: 'glitch', name: 'Glitch', color: '#8A2BE2', price: 1200, glow: true, isGlitch: true },
//    { id: 'gato', name: 'Gato', color: '#FFFFFF', price: 350, isSvg: true, svgPath: 'gato.svg' },
//    { id: 'gatouiau', name: 'Gato Uiau', color: '#FFFFFF', price: 351, isSvg: true, svgPath: 'gatouiauiauia.svg' },
//    { id: 'meme_ahhhh', name: 'Meme Ahhhh', color: '#FFFFFF', price: 800, isSvg: true, svgPath: 'FabConvert.com_emoji-meme-ahhhh.svg' },
//    { id: 'abuzittin', name: 'Abuzittin', color: '#FFFFFF', price: 230, isSvg: true, svgPath: 'Abuzittin.svg' },
//    { id: 'troll_c', name: 'Troll C', color: '#FFFFFF', price: 210, isSvg: true, svgPath: 'Troll _ C.svg' },
//    { id: 'troll_png', name: 'Troll Png', color: '#FFFFFF', price: 120, isSvg: true, svgPath: 'troll.png.svg' },
//    { id: 'aura_emoji', name: 'Aura Emoji', color: '#FFFFFF', price: 120, isSvg: true, svgPath: 'FabConvert.com_emojis-aura.svg' },
//    { id: 'troll_88', name: 'Troll 88', color: '#FFFFFF', price: 600, isSvg: true, svgPath: 'FabConvert.com_troll-88.svg' },
    { id: 'original', name: 'Clássico', color: '#F4D03F', price: 800, isOriginal: true },
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