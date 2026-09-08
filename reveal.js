/* Staggered entrance for the project grid.
 *
 * The homepage renders eleven cards at once and each thumbnail snaps in as its
 * JPEG finishes decoding, which reads as the grid assembling itself at random.
 * This settles them in on scroll instead, staggered by index.
 *
 * Safety: the `reveal-ready` flag is only set once this script runs, and the
 * CSS that hides a card is scoped to that flag. Without JS, or if this throws,
 * every card stays visible. Pointer events are never gated on the animation.
 */
(function () {
    'use strict';

    var STAGGER_MS = 40;
    var MAX_DELAY  = 400;   // cap it: card 11 should not wait half a second

    function run() {
        var cards = document.querySelectorAll('.project-card');
        if (!cards.length) return;

        // No IntersectionObserver: leave everything visible, do nothing.
        if (!('IntersectionObserver' in window)) return;

        document.documentElement.classList.add('reveal-ready');

        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                observer.unobserve(el);          // once only
                var i = Number(el.dataset.revealIndex || 0);
                var delay = reduce ? 0 : Math.min(i * STAGGER_MS, MAX_DELAY);
                el.style.setProperty('--reveal-delay', delay + 'ms');
                el.classList.add('is-revealed');
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

        Array.prototype.forEach.call(cards, function (el, i) {
            el.dataset.revealIndex = i;
            observer.observe(el);
        });

        // Belt and braces: if anything stalls, reveal everything after 2s so a
        // card can never be left invisible.
        setTimeout(function () {
            Array.prototype.forEach.call(cards, function (el) {
                el.classList.add('is-revealed');
            });
        }, 2000);
    }

    /* Footer wordmark: each letter settles into place as the footer arrives.
     *
     * Same safety shape as above. The displaced state lives behind the
     * `wordmark-ready` flag, which only this function sets, so without JS the
     * name renders in place. The per-letter delay is in CSS, driven by --i. */
    function wordmark() {
        var marks = document.querySelectorAll('.footer-wordmark');
        if (!marks.length) return;

        if (!('IntersectionObserver' in window)) return;

        document.documentElement.classList.add('wordmark-ready');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);   // once only
                entry.target.classList.add('is-set');
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

        Array.prototype.forEach.call(marks, function (el) { observer.observe(el); });

        // If anything stalls, set it anyway rather than leaving a blank footer.
        setTimeout(function () {
            Array.prototype.forEach.call(marks, function (el) {
                el.classList.add('is-set');
            });
        }, 2500);
    }

    function init() {
        run();
        wordmark();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
