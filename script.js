// Rotating words
const designTypes = [
    { text: 'editorial', article: 'an' },
    { text: 'graphic', article: 'a' },
    { text: 'web', article: 'a' },
    { text: 'UI', article: 'a' },
    { text: 'UX', article: 'a' }
];

let currentIndex = 1; // Start with 'graphic'

function rotateWord() {
    currentIndex = (currentIndex + 1) % designTypes.length;
    const current = designTypes[currentIndex];
    
    document.getElementById('rotating-article').textContent = current.article;
    document.getElementById('rotating-word').textContent = current.text;
}

// Rotate every 2 seconds
setInterval(rotateWord, 2000);