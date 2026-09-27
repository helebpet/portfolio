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

    /* CTA marquee, ported from the There Is No Finish Line sketch (js/page4.js).
     *
     * Two motions, not one: the wave itself ripples as its sine phase advances,
     * and the text travels along that moving wave. Sliding text along a frozen
     * curve, which is all CSS can do, misses what makes it feel alive.
     *
     * Same constants as the sketch, scaled to the viewBox: there the wave is
     * y = height/2 + sin(x * 0.01 + phase) * height/10, the phase steps 0.05 a
     * frame and the text scrolls 2px a frame. */
    function ctaWave() {
        var wrap = document.querySelector('.cta-wave');
        if (!wrap) return;
        var path = wrap.querySelector('#cta-wave-path');
        var tp = wrap.querySelector('textPath');
        if (!path || !tp) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var CY = 130, AMP = 58, K = 0.0105;      // centre line, height, frequency
        // Per 60fps frame. Deliberately unhurried: this sits under the closing
        // invitation, so it should drift rather than scroll past.
        var PHASE_STEP = 0.014, SCROLL = 0.45;
        var X0 = -600, X1 = 1800, STEP = 12;

        var phase = 0, offset = null, phrase = 0, paused = false, last = 0;

        function buildPath() {
            var d = 'M ' + X0 + ' ' + (CY + Math.sin(X0 * K + phase) * AMP).toFixed(1);
            for (var x = X0 + STEP; x <= X1; x += STEP) {
                d += ' L ' + x + ' ' + (CY + Math.sin(x * K + phase) * AMP).toFixed(1);
            }
            return d;
        }

        // One phrase's length along the path, so the loop wraps invisibly.
        function measure() {
            try {
                var total = tp.getComputedTextLength();
                var reps = Number(wrap.dataset.reps || 10);
                if (total > 0) phrase = total / reps;
            } catch (e) { phrase = 0; }
        }

        function frame(now) {
            // Scale by elapsed time so a 120Hz screen does not run this at
            // double speed, and a dropped frame does not stutter the travel.
            var dt = last ? Math.min((now - last) / 16.667, 3) : 1;
            last = now;

            if (!paused) {
                phase += PHASE_STEP * dt;
                path.setAttribute('d', buildPath());
                if (!phrase) measure();
                if (phrase) {
                    if (offset === null) offset = phrase;
                    offset -= SCROLL * dt;             // travels leftward
                    if (offset <= 0) offset += phrase; // wrap, one phrase on
                    tp.setAttribute('startOffset', offset.toFixed(1));
                }
            }
            requestAnimationFrame(frame);
        }

        wrap.addEventListener('mouseenter', function () { paused = true; });
        wrap.addEventListener('mouseleave', function () { paused = false; });
        document.addEventListener('visibilitychange', function () {
            paused = document.hidden;
            last = 0;   // drop the accumulated gap so it resumes smoothly
        });

        requestAnimationFrame(frame);
    }

    function init() {
        run();
        wordmarkSpot();
        ctaWave();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
