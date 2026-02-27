import { HIGH_SCORES_KEY } from './constants.js';

export function getHighScores() {
    const scores = localStorage.getItem(HIGH_SCORES_KEY);
    return scores ? JSON.parse(scores) : [];
}

export function saveHighScore(score) {
    const highScores = getHighScores();
    const newScore = { score: score, date: new Date().toLocaleDateString() };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(3);
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    return highScores;
}

export function checkHighScore(score) {
    const highScores = getHighScores();
    if (highScores.length < 3) return true;
    return score > highScores[highScores.length - 1].score;
}