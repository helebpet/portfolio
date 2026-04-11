(function () {
    'use strict';

    // Touch-only devices: skip entirely
    if (window.matchMedia('(hover: none)').matches) return;

    var LERP = 0.10;

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
    inner.style.cssText =
        'position:absolute;' +
        'width:40px;height:40px;border-radius:50%;' +
        'transform:translate(-50%,-50%);' +
        'backdrop-filter:invert(1);' +
        '-webkit-backdrop-filter:invert(1);' +
        'background:rgba(255,255,255,0.04);' +
        'border:1px solid rgba(200,200,200,0.20);' +
        'opacity:0;' +
        'transition:width 0.22s ease,height 0.22s ease,opacity 0.3s ease;';

    outer.appendChild(inner);
    document.body.appendChild(outer);

    /* ── State ───────────────────────────────────────────────────────── */
    var mx = 0, my = 0, cx = 0, cy = 0;
    var lastX = null, lastY = null;
    var started = false;

    /* ── Mouse tracking ──────────────────────────────────────────────── */
    document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!started) {
            cx = mx; cy = my;
            started = true;
            inner.style.opacity = '1';
        }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
        inner.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
        if (started) inner.style.opacity = '1';
    });

    /* ── Grow on interactive elements ────────────────────────────────── */
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            inner.style.width  = '66px';
            inner.style.height = '66px';
        }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            inner.style.width  = '40px';
            inner.style.height = '40px';
        }
    }, { passive: true });

    /* ── Animation loop ──────────────────────────────────────────────── */
    function loop() {
        cx += (mx - cx) * LERP;
        cy += (my - cy) * LERP;

        // Bitwise OR 0 = fast float→int; skip DOM write if position unchanged
        var rx = cx | 0;
        var ry = cy | 0;
        if (rx !== lastX || ry !== lastY) {
            outer.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
            lastX = rx;
            lastY = ry;
        }

        requestAnimationFrame(loop);
    }
    loop();
}());
