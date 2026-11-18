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

    /* Footer wordmark: the fill follows the cursor.
     *
     * A radial gradient inside the svg supplies the colour; this only moves its
     * centre, converted from page coordinates into the svg's own user space.
     * Parked off-canvas until the pointer arrives, and returned there when it
     * leaves, so the name sits in flat ink by default. */
    function wordmarkSpot() {
        var marks = document.querySelectorAll('.footer-wordmark');
        if (!marks.length) return;
        if (!window.matchMedia('(hover: hover)').matches) return;

        var PARKED = -400;
        var pending = false;
        var last = null;

        function apply() {
            pending = false;
            for (var i = 0; i < marks.length; i++) {
                var svg = marks[i];
                var stop = svg.querySelector('#wm-spot');
                if (!stop) continue;
                var box = svg.getBoundingClientRect();
                if (!box.width || !last) { park(stop); continue; }

                // viewBox is 534 x 45; the svg scales uniformly, so a simple
                // ratio maps client pixels onto user units.
                var vb = svg.viewBox.baseVal;
                var x = (last.x - box.left) / box.width * vb.width;
                var y = (last.y - box.top) / box.height * vb.height;

                // Keep the wash alive while the pointer is anywhere near the
                // band, not only directly over the glyphs.
                var near = last.y > box.top - 160 && last.y < box.bottom + 160;
                stop.setAttribute('cx', near ? x.toFixed(1) : PARKED);
                stop.setAttribute('cy', y.toFixed(1));
            }
        }

        function park(stop) { stop.setAttribute('cx', PARKED); }

        document.addEventListener('mousemove', function (e) {
            last = { x: e.clientX, y: e.clientY };
            if (pending) return;
            pending = true;
            requestAnimationFrame(apply);
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            last = null;
            for (var i = 0; i < marks.length; i++) {
                var stop = marks[i].querySelector('#wm-spot');
                if (stop) park(stop);
            }
        });
    }

    function init() {
        run();
        wordmarkSpot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
