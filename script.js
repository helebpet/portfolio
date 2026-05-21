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

// Coax every video into autoplaying on mobile (iOS / Android block autoplay
// unless the video is muted + playsinline AND play() is called explicitly).
(function () {
    function playAll() {
        document.querySelectorAll('video').forEach(function (v) {
            v.muted = true;
            v.defaultMuted = true;
            v.playsInline = true;
            v.setAttribute('playsinline', '');
            v.setAttribute('webkit-playsinline', '');
            var attempt = v.play();
            if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
        });
    }
    if (document.readyState !== 'loading') playAll();
    else document.addEventListener('DOMContentLoaded', playAll);
    window.addEventListener('load', playAll);
    document.addEventListener('touchstart', playAll, { once: true, passive: true });
})();