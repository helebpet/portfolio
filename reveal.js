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
        var all = Array.prototype.slice.call(cards);

        // No IntersectionObserver: leave everything visible, do nothing.
        var hasIO = 'IntersectionObserver' in window;

        // The About page's inquiry card rises into place the same way the
        // project grid does, just on its own.
        var inquiry = document.querySelector('.inquiry');

        if (!all.length && !inquiry) return;
        if (!hasIO) return;

        document.documentElement.classList.add('reveal-ready');

        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function revealNow(el, i) {
            var delay = reduce ? 0 : Math.min(i * STAGGER_MS, MAX_DELAY);
            el.style.setProperty('--reveal-delay', delay + 'ms');
            el.classList.add('is-revealed');
        }

        if (all.length) {
            var gridObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    gridObserver.unobserve(entry.target);
                    revealNow(entry.target, Number(entry.target.dataset.revealIndex || 0));
                });
            }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

            Array.prototype.forEach.call(all, function (el, i) {
                el.dataset.revealIndex = i;
                gridObserver.observe(el);
            });
        }

        if (inquiry) {
            // IntersectionObserver fires its first callback almost as soon as
            // observe() is called, checking whatever is already on screen.
            // On a short page the card can already satisfy that check before
            // the user has scrolled at all, which reveals it instantly on
            // load instead of in response to scrolling, and reads as "the
            // animation doesn't work". A plain scroll listener only ever
            // runs in response to an actual scroll, so it can't fire early.
            var revealed = false;

            function tryRevealInquiry() {
                if (revealed) return;
                var top = inquiry.getBoundingClientRect().top;
                if (top > window.innerHeight * 0.92) return;
                revealed = true;
                revealNow(inquiry, 0);
                window.removeEventListener('scroll', tryRevealInquiry);
                window.removeEventListener('resize', tryRevealInquiry);
            }

            // If the page is too short to scroll at all, there is no scroll
            // event to trigger on, so reveal it right away rather than
            // leaving the form permanently hidden.
            var canScroll = document.documentElement.scrollHeight > window.innerHeight + 40;
            if (!canScroll || reduce) {
                tryRevealInquiry();
            } else {
                window.addEventListener('scroll', tryRevealInquiry, { passive: true });
                window.addEventListener('resize', tryRevealInquiry);
            }
        }

        // Belt and braces: if the project grid stalls, reveal it after 2s so
        // a card can never be left invisible. The inquiry card is deliberately
        // excluded: it is meant to stay hidden until the page is scrolled to
        // it, and tryRevealInquiry above already covers the case where the
        // page can't be scrolled at all.
        if (all.length) {
            setTimeout(function () {
                Array.prototype.forEach.call(all, function (el) {
                    el.classList.add('is-revealed');
                });
            }, 2000);
        }
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
