/* Rotating headline word: an endless loop through the disciplines.
 *
 * The circle is sized in CSS to the longest word in the list, so each swap
 * crossfades the text rather than reflowing the whole headline.
 *
 * It rests on whatever word is hardcoded in the HTML, so a visitor without
 * JavaScript sees a complete, sensible sentence.
 */
(() => {
    'use strict';

    const INTERVAL_MS = 2000;

    const el = document.getElementById('rotating-word');
    if (!el) return;

    // A headline that will not hold still is exactly what reduced motion opts
    // out of, so leave the HTML word in place.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const start = el.textContent.trim() || 'graphic';
    const words = [start];
    ['UX', 'UI', 'brand', 'graphic'].forEach((w) => {
        if (!words.includes(w)) words.push(w);
    });

    let i = 0;
    let timer = null;

    const paused = () => {
        // Don't advance behind the screensaver; the loop stays alive and picks
        // up again by itself once it is dismissed.
        return document.documentElement.classList.contains('screensaver-active');
    };

    const tick = () => {
        timer = null;
        if (!paused()) {
            i = (i + 1) % words.length;
            el.textContent = words[i];
        }
        schedule();
    };

    const schedule = () => {
        if (timer !== null) return;
        if (document.visibilityState !== 'visible') return;   // resumed below
        timer = setTimeout(tick, INTERVAL_MS);
    };

    const stop = () => {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
    };

    // A hidden tab does no work; it resumes on return.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') schedule();
        else stop();
    });

    schedule();
})();
