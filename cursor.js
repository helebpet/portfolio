(function () {
    'use strict';

    // Touch-only devices: skip entirely
    if (window.matchMedia('(hover: none)').matches) return;

    // The follower's lag IS motion, so reduced-motion users keep the native
    // cursor. Returning before adding `custom-cursor` also means the stylesheet
    // never hides their real one.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Only now is it safe for CSS to hide the native cursor: if this script had
    // thrown or never loaded, the class is absent and the real cursor remains.
    document.documentElement.classList.add('custom-cursor');

    // The visible dot tracks the pointer 1:1. A lerped follower puts ~100ms of
    // latency on the input path, which is felt on every hover and click; only
    // the outer ring is allowed to trail.
    var RING_LERP = 0.22;

    /*
     * Two-element pattern for zero-layout-thrash cursor:
     *   outer  — zero-size anchor, moves via transform only (GPU, no reflow)
     *   inner  — the visible circle, always centered via translate(-50%,-50%)
     *            so CSS size transitions expand from the center for free
     */
    var outer = document.createElement('div');
    outer.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;' +
        'pointer-events:none;z-index:99998;' +
        'will-change:transform;';

    var inner = document.createElement('div');
    // No blend mode: `outer` is position:fixed with a z-index, which makes it
    // its own stacking context, so a child's mix-blend-mode has nothing to
    // blend against and renders as a flat white disc over the page. A plain
    // translucent fill is also cheaper than the old per-frame backdrop-filter,
    // which forced a full backdrop repaint on every move. The two theme classes
    // below carry the colour so it reads on both grounds.
    inner.className = 'cursor-dot';
    inner.style.cssText =
        'position:absolute;' +
        'width:12px;height:12px;border-radius:50%;' +
        'transform:translate(-50%,-50%);' +
        'opacity:0;' +
        'transition:width 180ms cubic-bezier(0.23,1,0.32,1),' +
        'height 180ms cubic-bezier(0.23,1,0.32,1),' +
        'opacity 0.3s ease;';

    // Secondary ring: this is the element allowed to lag, so the trailing
    // character survives without putting latency on the dot itself.
    var ring = document.createElement('div');
    ring.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;' +
        'pointer-events:none;z-index:99997;' +
        'will-change:transform;';

    var ringDot = document.createElement('div');
    ringDot.className = 'cursor-ring';
    ringDot.style.cssText =
        'position:absolute;' +
        'width:30px;height:30px;border-radius:50%;' +
        'transform:translate(-50%,-50%);' +
        'opacity:0;' +
        'transition:width 180ms cubic-bezier(0.23,1,0.32,1),' +
        'height 180ms cubic-bezier(0.23,1,0.32,1),' +
        'border-color 180ms ease,opacity 0.3s ease;';

    ring.appendChild(ringDot);
    outer.appendChild(inner);
    document.body.appendChild(ring);
    document.body.appendChild(outer);

    /* ── State ───────────────────────────────────────────────────────── */
    var mx = 0, my = 0, cx = 0, cy = 0;
    var started = false;

    /* ── Mouse tracking ──────────────────────────────────────────────── */
    document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        // 1:1, applied immediately: no frame of latency on the visible dot.
        outer.style.transform =
            'translate3d(' + mx + 'px,' + my + 'px,0)';
        if (!started) {
            cx = mx; cy = my;
            started = true;
            inner.style.opacity = '1';
            ringDot.style.opacity = '1';
        }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
        inner.style.opacity = '0';
        ringDot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
        if (started) { inner.style.opacity = '1'; ringDot.style.opacity = '1'; }
    });

    /* ── Grow + accent fill on interactive elements ──────────────────── */
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            inner.style.width  = '8px';
            inner.style.height = '8px';
            ringDot.style.width  = '52px';
            ringDot.style.height = '52px';
            ring.classList.add('is-active');
        }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            inner.style.width  = '12px';
            inner.style.height = '12px';
            ringDot.style.width  = '30px';
            ringDot.style.height = '30px';
            ring.classList.remove('is-active');
        }
    }, { passive: true });

    /* ── Animation loop ──────────────────────────────────────────────── */
    // Sub-pixel translate3d: keeps slow motion smooth (no integer stairstep)
    // and forces GPU compositing so the cursor doesn't stutter under load.
    function loop() {
        // Only the ring interpolates; the dot was already placed on the event.
        cx += (mx - cx) * RING_LERP;
        cy += (my - cy) * RING_LERP;
        ring.style.transform =
            'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
        requestAnimationFrame(loop);
    }
    loop();
}());
