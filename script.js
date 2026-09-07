/* Rotating headline word.
 *
 * This runs ONCE on load and then settles, rather than looping forever. The
 * headline is the first thing read on the page, and a word that keeps changing
 * never lets the sentence resolve: it also keeps restating the claim, so "a
 * brand designer" becomes "a UX designer" every two seconds. Cycling once shows
 * the range, then the sentence holds still.
 *
 * It settles back on the word hardcoded in the HTML, so the resting state is
 * identical to what a visitor without JavaScript sees.
 */
(function () {
    var el = document.getElementById('rotating-word');
    if (!el) return;

    var settled = el.textContent.trim() || 'graphic';
    var cycle = ['UX', 'UI', 'brand'].filter(function (w) { return w !== settled; });
    cycle.push(settled);

    // A moving headline is exactly what reduced-motion users opted out of.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var i = 0;
    var timer = null;

    function step() {
        el.textContent = cycle[i];
        i++;
        if (i < cycle.length) {
            timer = setTimeout(step, 900);
        } else {
            timer = null;   // settled: nothing further is scheduled
        }
    }

    // Don't burn the cycle while the tab is hidden or the screensaver covers it.
    function start() {
        if (timer !== null || i >= cycle.length) return;
        if (document.visibilityState !== 'visible') return;
        if (document.documentElement.classList.contains('screensaver-active')) return;
        timer = setTimeout(step, 900);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') start();
        else if (timer !== null) { clearTimeout(timer); timer = null; }
    });

    start();
})();

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