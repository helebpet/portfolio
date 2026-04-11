(function () {
    'use strict';

    // Touch-only devices: skip entirely
    if (window.matchMedia('(hover: none)').matches) return;

    var SIZE = 40;
    var LERP = 0.10; // lower = more floaty lag

    /* ── Cursor element ──────────────────────────────────────────────── */
    var el = document.createElement('div');
    el.style.cssText =
        'position:fixed;pointer-events:none;z-index:99998;' +
        'width:' + SIZE + 'px;height:' + SIZE + 'px;' +
        'border-radius:50%;' +
        'backdrop-filter:invert(1);' +
        '-webkit-backdrop-filter:invert(1);' +
        'background:rgba(255,255,255,0.04);' +
        'border:1px solid rgba(200,200,200,0.20);' +
        'transform:translate(-50%,-50%);' +
        'top:0;left:0;' +
        'opacity:0;' +
        'transition:width 0.22s ease,height 0.22s ease,opacity 0.3s ease;' +
        'will-change:left,top;';
    document.body.appendChild(el);

    /* ── Mouse tracking ──────────────────────────────────────────────── */
    var mx = 0, my = 0, cx = 0, cy = 0, started = false;

    document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!started) {
            cx = mx; cy = my;
            started = true;
            el.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', function () {
        el.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
        if (started) el.style.opacity = '1';
    });

    /* ── Grow on interactive elements ────────────────────────────────── */
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            el.style.width  = SIZE * 1.65 + 'px';
            el.style.height = SIZE * 1.65 + 'px';
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest('a, button, [role="button"]')) {
            el.style.width  = SIZE + 'px';
            el.style.height = SIZE + 'px';
        }
    });

    /* ── Smooth follow loop ──────────────────────────────────────────── */
    function loop() {
        cx += (mx - cx) * LERP;
        cy += (my - cy) * LERP;
        el.style.left = cx + 'px';
        el.style.top  = cy + 'px';
        requestAnimationFrame(loop);
    }
    loop();
}());
