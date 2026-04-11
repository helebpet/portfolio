(function () {
    'use strict';

    var IDLE_MS  = 10000;
    var CELL     = 12;
    var PAD      = 2;
    var FRAME_MS = 1000 / 30;

    var overlay, canvas, ctx, animId, t0, prevNow = 0, lastFrame = 0;
    var active = false, idleTimer = null;

    /* ── Per-eye state (index 0 = left, 1 = right) ───────────────────── */
    var lookX  = [0, 0], lookY  = [0, 0];   // current iris position
    var lookTX = [0, 0], lookTY = [0, 0];   // targets
    var topLid = [1, 1], botLid = [1, 1];
    var topLidT = [1, 1], botLidT = [1, 1];
    var pupilScale = 1, pupilScaleT = 1;     // 1 = normal, <1 = dilated, >1 = tiny
    var eyeScale = 1, eyeScaleT = 1;

    // Blink state per eye
    var blinkPh = [0, 0], blinkT = [0, 0];
    var autoBlinkClock = [0, 0];
    var nextBlink = [rnd(2, 4), rnd(3, 5)];

    // Expression mode
    var mode = 'normal';   // 'normal' | 'roll' | 'panic' | 'triple-blink'
    var modeT = 0, modeDur = 0;
    var rollAngle = 0;
    var panicMoveT = 0, nextPanicMove = 0;
    var actionClock = 0, nextAction = 0.3;  // fast first expression

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function lerp(a, b, t) { return a + (b - a) * (t < 1 ? t : 1); }

    /* ── Setup ───────────────────────────────────────────────────────── */
    function setup() {
        overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:9999;display:none;cursor:none;' +
            'opacity:0;transition:opacity 1s ease;';
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:block;width:100%;height:100%;';
        overlay.appendChild(canvas);
        document.body.appendChild(overlay);
        ctx = canvas.getContext('2d');
        sizeCanvas();
        window.addEventListener('resize', sizeCanvas);
        overlay.addEventListener('click',      dismiss);
        overlay.addEventListener('touchstart', dismiss, { passive: true });
    }

    function sizeCanvas() {
        if (!canvas) return;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /* ── Activate / dismiss ──────────────────────────────────────────── */
    function activate() {
        if (active) return;
        active = true;
        t0 = prevNow = performance.now();
        // reset
        for (var i = 0; i < 2; i++) {
            lookX[i] = lookY[i] = lookTX[i] = lookTY[i] = 0;
            topLid[i] = botLid[i] = topLidT[i] = botLidT[i] = 1;
            blinkPh[i] = blinkT[i] = autoBlinkClock[i] = 0;
            nextBlink[i] = rnd(1, 3);
        }
        eyeScale = eyeScaleT = pupilScale = pupilScaleT = 1;
        mode = 'normal'; actionClock = 0; nextAction = 0.4;
        overlay.style.display = 'block';
        requestAnimationFrame(function () { overlay.style.opacity = '1'; });
        animId = requestAnimationFrame(frame);
    }

    function dismiss() {
        if (!active) return;
        active = false;
        overlay.style.opacity = '0';
        cancelAnimationFrame(animId);
        setTimeout(function () { overlay.style.display = 'none'; }, 1000);
        scheduleIdle();
    }

    /* ── Stitch ──────────────────────────────────────────────────────── */
    function stitch(col, row) {
        var px = col * CELL, py = row * CELL;
        var x0 = px + PAD, y0 = py + PAD;
        var x1 = px + CELL - PAD, y1 = py + CELL - PAD;
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.moveTo(x1, y0); ctx.lineTo(x0, y1);
    }

    /* ── Expression picker ───────────────────────────────────────────── */
    function pickExpression() {
        var r = Math.random();
        mode = 'normal';

        if (r < 0.12) {
            // Eye roll — iris orbits
            mode = 'roll';
            modeT = 0; modeDur = rnd(2, 3.5);
            rollAngle = Math.random() * Math.PI * 2;
            eyeScaleT = 1; pupilScaleT = 1;
            topLidT = [1, 1]; botLidT = [1, 1];
            nextAction = modeDur + 0.3;

        } else if (r < 0.22) {
            // Panic — rapid random darting
            mode = 'panic';
            modeT = 0; modeDur = rnd(1.5, 3);
            panicMoveT = 0; nextPanicMove = 0;
            eyeScaleT = 1.1; pupilScaleT = 1.3;
            topLidT = [1, 1]; botLidT = [1, 1];
            nextAction = modeDur + 0.3;

        } else if (r < 0.32) {
            // MEGA surprised
            lookTX = [0, 0]; lookTY = [-0.15, -0.15];
            eyeScaleT = 1.50; pupilScaleT = 0.55;
            topLidT = [1, 1]; botLidT = [1, 1];
            nextAction = rnd(0.8, 1.8);

        } else if (r < 0.42) {
            // Cross-eyed — each eye looks toward nose
            lookTX = [0.80, -0.80]; lookTY = [0.15, 0.15];
            eyeScaleT = 1; pupilScaleT = 1.1;
            topLidT = [1, 1]; botLidT = [1, 1];
            nextAction = rnd(1.2, 2.5);

        } else if (r < 0.50) {
            // Wink (random which eye)
            var wi = Math.random() > 0.5 ? 0 : 1;
            topLidT[wi] = 0.02; topLidT[1 - wi] = 1;
            botLidT = [1, 1]; eyeScaleT = 1; pupilScaleT = 1;
            lookTX = [(Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4];
            lookTY = [0, 0];
            nextAction = rnd(0.7, 1.5);

        } else if (r < 0.58) {
            // Sleepy — lids drooping, iris down
            topLidT = [rnd(0.3,0.5), rnd(0.3,0.5)];
            botLidT = [1, 1]; eyeScaleT = 1; pupilScaleT = 0.8;
            lookTX = [(Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2];
            lookTY = [0.25, 0.25];
            nextAction = rnd(2.5, 4);

        } else if (r < 0.66) {
            // Squinting — both lids squeeze
            topLidT = [rnd(0.55,0.7), rnd(0.55,0.7)];
            botLidT = [rnd(0.7,0.85), rnd(0.7,0.85)];
            eyeScaleT = 0.88; pupilScaleT = 0.9;
            lookTX = [(Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5];
            lookTY = [0.1, 0.1];
            nextAction = rnd(1.2, 2.5);

        } else if (r < 0.74) {
            // Derp — each eye totally independent direction
            lookTX = [rnd(-1,1), rnd(-1,1)]; lookTY = [rnd(-0.6,0.6), rnd(-0.6,0.6)];
            topLidT = [1, 1]; botLidT = [1, 1]; eyeScaleT = 1; pupilScaleT = 1;
            nextAction = rnd(1, 2);

        } else if (r < 0.82) {
            // Hard side glance
            var dir = Math.random() > 0.5 ? 1 : -1;
            lookTX = [dir * 0.95, dir * 0.95]; lookTY = [0, 0];
            topLidT = [0.82, 0.82]; botLidT = [1, 1]; eyeScaleT = 1; pupilScaleT = 0.9;
            nextAction = rnd(1, 2.5);

        } else if (r < 0.90) {
            // Triple blink
            mode = 'triple-blink';
            modeT = 0; modeDur = 1.2;
            nextAction = modeDur + 0.3;

        } else {
            // Neutral
            lookTX = [(Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2];
            lookTY = [(Math.random()-0.5)*0.15, (Math.random()-0.5)*0.15];
            topLidT = [1, 1]; botLidT = [1, 1]; eyeScaleT = 1; pupilScaleT = 1;
            nextAction = rnd(1, 2.5);
        }
    }

    /* ── Update ──────────────────────────────────────────────────────── */
    function update(dt) {
        var lookS  = 1 - Math.exp(-9  * dt);
        var lidS   = 1 - Math.exp(-13 * dt);
        var scaleS = 1 - Math.exp(-5  * dt);

        // ── Mode logic ───────────────────────────────────────────────
        modeT += dt;

        if (mode === 'roll') {
            rollAngle += dt * Math.PI * 2.0;
            lookTX[0] = lookTX[1] = Math.cos(rollAngle) * 0.88;
            lookTY[0] = lookTY[1] = Math.sin(rollAngle) * 0.72;
            if (modeT >= modeDur) { mode = 'normal'; pickExpression(); return; }

        } else if (mode === 'panic') {
            panicMoveT += dt;
            if (panicMoveT >= nextPanicMove) {
                panicMoveT = 0; nextPanicMove = rnd(0.08, 0.22);
                lookTX[0] = lookTX[1] = (Math.random() - 0.5) * 2.0;
                lookTY[0] = lookTY[1] = (Math.random() - 0.5) * 1.5;
                if (Math.random() < 0.25 && blinkPh[0] === 0) {
                    blinkPh[0] = 1; blinkT[0] = 0;
                    blinkPh[1] = 1; blinkT[1] = 0;
                }
            }
            if (modeT >= modeDur) { mode = 'normal'; pickExpression(); return; }

        } else if (mode === 'triple-blink') {
            // Three blinks at 0, 0.4, 0.8 s
            var intervals = [0, 0.38, 0.76];
            for (var b = 0; b < intervals.length; b++) {
                var bt = modeT - intervals[b];
                if (bt >= 0 && bt < 0.09 && blinkPh[0] === 0) {
                    blinkPh[0] = blinkPh[1] = 1;
                    blinkT[0]  = blinkT[1]  = 0;
                }
            }
            if (modeT >= modeDur) { mode = 'normal'; pickExpression(); return; }

        } else {
            // Normal: expression action timer
            actionClock += dt;
            if (actionClock >= nextAction) { actionClock = 0; pickExpression(); }
        }

        // ── Blink per eye ────────────────────────────────────────────
        for (var ei = 0; ei < 2; ei++) {
            autoBlinkClock[ei] += dt;
            if (autoBlinkClock[ei] >= nextBlink[ei] && blinkPh[ei] === 0) {
                blinkPh[ei] = 1; blinkT[ei] = 0;
                autoBlinkClock[ei] = 0; nextBlink[ei] = rnd(2, 5);
            }

            if (blinkPh[ei] > 0) {
                blinkT[ei] += dt;
                if      (blinkPh[ei] === 1) { topLid[ei] = Math.max(0, 1 - blinkT[ei]/0.09); if (blinkT[ei] >= 0.09) { blinkPh[ei]=2; blinkT[ei]=0; } }
                else if (blinkPh[ei] === 2) { topLid[ei] = 0;                                 if (blinkT[ei] >= 0.07) { blinkPh[ei]=3; blinkT[ei]=0; } }
                else if (blinkPh[ei] === 3) { topLid[ei] = Math.min(topLidT[ei], blinkT[ei]/0.11); if (blinkT[ei] >= 0.11) blinkPh[ei]=0; }
            } else {
                topLid[ei] = lerp(topLid[ei], topLidT[ei], lidS);
            }

            lookX[ei] = lerp(lookX[ei], lookTX[ei], lookS);
            lookY[ei] = lerp(lookY[ei], lookTY[ei], lookS);
            botLid[ei] = lerp(botLid[ei], botLidT[ei], lidS);
        }

        eyeScale   = lerp(eyeScale,   eyeScaleT,   scaleS);
        pupilScale = lerp(pupilScale, pupilScaleT, scaleS);
    }

    /* ── Render ──────────────────────────────────────────────────────── */
    function render() {
        var W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, W, H);

        var RX = W * 0.13 * eyeScale;
        var RY = RX * 0.46;
        var IR = RX * 0.42;
        var PR = IR * 0.40 * pupilScale;

        var centers = [
            { x: W * 0.33, y: H * 0.50 },
            { x: W * 0.67, y: H * 0.50 },
        ];

        var maxDX = (RX - IR) * 0.60;
        var maxDY = (RY - IR * 0.5) * 0.55;

        ctx.beginPath();

        var cols = (W / CELL + 2) | 0;
        var rows = (H / CELL + 2) | 0;

        for (var row = 0; row <= rows; row++) {
            var py = row * CELL + CELL * 0.5;

            for (var col = 0; col <= cols; col++) {
                var px = col * CELL + CELL * 0.5;

                for (var ei = 0; ei < 2; ei++) {
                    var ec = centers[ei];

                    var nx = (px - ec.x) / RX;
                    if (nx < -1 || nx > 1) continue;

                    var halfH = Math.sqrt(Math.max(0, 1 - nx * nx));
                    var topY  = ec.y - RY * halfH * topLid[ei];
                    var botY  = ec.y + RY * halfH * botLid[ei];
                    if (py < topY || py > botY) continue;

                    var icx = ec.x + lookX[ei] * maxDX;
                    var icy = ec.y + lookY[ei] * maxDY;
                    var d2  = (px-icx)*(px-icx) + (py-icy)*(py-icy);

                    if (d2 < PR * PR) {
                        // pupil — no stitch
                    } else if (d2 < IR * IR) {
                        // iris — concentric rings
                        if (Math.floor(Math.sqrt(d2) / CELL) % 2 === 0) stitch(col, row);
                    } else {
                        // sclera — solid
                        stitch(col, row);
                    }
                    break;
                }
            }
        }

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1.8;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // Hint
        var elapsed = (performance.now() - t0) / 1000;
        var ha = Math.min(1, (elapsed - 2) * 0.5);
        if (ha > 0) {
            ctx.globalAlpha = ha * 0.35;
            ctx.fillStyle   = '#ffffff';
            ctx.font        = '12px "Xanh Mono", monospace';
            ctx.textAlign   = 'center';
            ctx.fillText('click or move to continue', W * 0.5, H - 28);
            ctx.globalAlpha = 1;
        }
    }

    /* ── Frame loop ──────────────────────────────────────────────────── */
    function frame(now) {
        if (!active) return;
        if (now - lastFrame < FRAME_MS) { animId = requestAnimationFrame(frame); return; }
        var dt = Math.min((now - prevNow) / 1000, 0.1);
        prevNow = lastFrame = now;
        update(dt);
        render();
        animId = requestAnimationFrame(frame);
    }

    /* ── Idle timer ──────────────────────────────────────────────────── */
    function scheduleIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(activate, IDLE_MS);
    }

    /* ── Boot ────────────────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        setup();

        // Show immediately only on the very first page load of the session
        if (!sessionStorage.getItem('ss_visited')) {
            sessionStorage.setItem('ss_visited', '1');
            activate();
        } else {
            scheduleIdle();
        }

        // After user interacts: dismiss + restart idle timer
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function (type) {
            document.addEventListener(type, function () {
                if (active) dismiss(); else scheduleIdle();
            }, { passive: true });
        });
    });
}());
