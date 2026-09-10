/* Rotating headline word: an endless loop through the disciplines.
 *
 * The circle is sized in CSS to the longest word in the list, so each swap
 * crossfades the text rather than reflowing the whole headline.
 *
 * It rests on whatever word is hardcoded in the HTML, so a visitor without
 * JavaScript sees a complete, sensible sentence.
 */
(function () {
    'use strict';

    var INTERVAL_MS = 2000;

    var el = document.getElementById('rotating-word');
    if (!el) return;

    // A headline that will not hold still is exactly what reduced motion opts
    // out of, so leave the HTML word in place.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var start = el.textContent.trim() || 'graphic';
    var words = [start];
    ['UX', 'UI', 'brand', 'graphic'].forEach(function (w) {
        if (words.indexOf(w) === -1) words.push(w);
    });

    var i = 0;
    var timer = null;

    function paused() {
        // Don't advance behind the screensaver; the loop stays alive and picks
        // up again by itself once it is dismissed.
        return document.documentElement.classList.contains('screensaver-active');
    }

    function tick() {
        timer = null;
        if (!paused()) {
            i = (i + 1) % words.length;
            el.textContent = words[i];
        }
        schedule();
    }

    function schedule() {
        if (timer !== null) return;
        if (document.visibilityState !== 'visible') return;   // resumed below
        timer = setTimeout(tick, INTERVAL_MS);
    }

    function stop() {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
    }

    // A hidden tab does no work; it resumes on return.
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') schedule();
        else stop();
    });

    schedule();
})();
