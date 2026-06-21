// Rotating words
const designTypes = ['UX', 'UI', 'brand', 'graphic'];

let currentIndex = 3; // Start with 'graphic' (matches the HTML default)

function rotateWord() {
    currentIndex = (currentIndex + 1) % designTypes.length;
    document.getElementById('rotating-word').textContent = designTypes[currentIndex];
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