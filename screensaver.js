(function () {
    'use strict';

    var IDLE_MS  = 10000;
    var CELL     = 12;
    var PAD      = 2;
    var FRAME_MS = 1000 / 30;

    var overlay, canvas, ctx, animId, t0, prevNow = 0, lastFrame = 0;
    var active = false, idleTimer = null;

    /* ── Animation state ─────────────────────────────────────────────── */
    var lookX = 0, lookY = 0;           // current iris position (−1..1)
    var lookTX = 0, lookTY = 0;         // targets
    var topLid = 1, botLid = 1;         // eyelid openness 0=closed 1=open
    var topLidT = 1, botLidT = 1;
    var eyeScale = 1, eyeScaleT = 1;    // overall eye size multiplier

    // Action timer
    var actionTimer = 0, nextAction = 2;

    // Blink sub-machine
    var blinkPhase = 0;   // 0=idle 1=closing 2=closed 3=opening
    var blinkT = 0;
    var autoBlinkTimer = 0, nextBlink = 3 + Math.random() * 3;

    /* ── Setup ───────────────────────────────────────────────────────── */
    function setup() {
        overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:9999;display:none;cursor:none;' +
            'opacity:0;transition:opacity 1.4s ease;';
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

    /* ── Show / dismiss ──────────────────────────────────────────────── */
    function activate() {
        if (active) return;
        active = true;
        t0 = prevNow = performance.now();
        // Reset to neutral open eyes
        lookX = lookY = lookTX = lookTY = 0;
        topLid = botLid = topLidT = botLidT = 1;
        eyeScale = eyeScaleT = 1;
        blinkPhase = 0;
        overlay.style.display = 'block';
        requestAnimationFrame(function () { overlay.style.opacity = '1'; });
        animId = requestAnimationFrame(frame);
    }

    function dismiss() {
        if (!active) return;
        active = false;
        overlay.style.opacity = '0';
        cancelAnimationFrame(animId);
        setTimeout(function () { overlay.style.display = 'none'; }, 1400);
        scheduleIdle();
    }

    /* ── Cross-stitch X ──────────────────────────────────────────────── */
    function stitch(col, row) {
        var px = col * CELL, py = row * CELL;
        var x0 = px + PAD,        y0 = py + PAD;
        var x1 = px + CELL - PAD, y1 = py + CELL - PAD;
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.moveTo(x1, y0); ctx.lineTo(x0, y1);
    }

    function lerpV(a, b, t) { return a + (b - a) * (t < 1 ? t : 1); }

    /* ── Animation update ────────────────────────────────────────────── */
    function update(dt) {
        // Frame-rate independent smoothing
        var lookS  = 1 - Math.exp(-7  * dt);
        var lidS   = 1 - Math.exp(-12 * dt);
        var scaleS = 1 - Math.exp(-5  * dt);

        // Blink overrides lid target
        if (blinkPhase === 0) {
            topLid = lerpV(topLid, topLidT, lidS);
        } else {
            blinkT += dt;
            if (blinkPhase === 1) {                        // closing
                topLid = Math.max(0, 1 - blinkT / 0.09);
                if (blinkT >= 0.09) { blinkPhase = 2; blinkT = 0; }
            } else if (blinkPhase === 2) {                 // closed
                topLid = 0;
                if (blinkT >= 0.07) { blinkPhase = 3; blinkT = 0; }
            } else if (blinkPhase === 3) {                 // opening
                topLid = Math.min(topLidT, blinkT / 0.11);
                if (blinkT >= 0.11) { blinkPhase = 0; }
            }
        }

        lookX  = lerpV(lookX,  lookTX,  lookS);
        lookY  = lerpV(lookY,  lookTY,  lookS);
        botLid = lerpV(botLid, botLidT, lidS);
        eyeScale = lerpV(eyeScale, eyeScaleT, scaleS);

        // Slow idle drift on look target (eyes never fully still)
        var elapsed = (performance.now() - t0) / 1000;
        var driftX = 0.08 * Math.sin(elapsed * 0.41);
        var driftY = 0.04 * Math.sin(elapsed * 0.57 + 1.1);

        // Auto blink
        autoBlinkTimer += dt;
        if (autoBlinkTimer >= nextBlink && blinkPhase === 0) {
            blinkPhase = 1; blinkT = 0;
            autoBlinkTimer = 0;
            nextBlink = 2.5 + Math.random() * 4;
        }

        // Action state machine
        actionTimer += dt;
        if (actionTimer >= nextAction) {
            actionTimer = 0;
            pickExpression();
        }

        // Apply drift on top of look target
        lookTX += driftX * dt * 0.3;
        lookTY += driftY * dt * 0.3;
        // Clamp drift accumulation
        if (lookTX >  1) lookTX =  1;
        if (lookTX < -1) lookTX = -1;
        if (lookTY >  0.7) lookTY =  0.7;
        if (lookTY < -0.7) lookTY = -0.7;
    }

    function pickExpression() {
        var r = Math.random();

        if (r < 0.30) {
            // Look somewhere new
            lookTX = (Math.random() - 0.5) * 1.6;
            lookTY = (Math.random() - 0.5) * 1.0;
            topLidT = 1; botLidT = 1; eyeScaleT = 1;
            nextAction = 1.2 + Math.random() * 2.5;

        } else if (r < 0.45) {
            // Surprised — eyes wide, look forward
            lookTX = (Math.random() - 0.5) * 0.3;
            lookTY = -0.1;
            eyeScaleT = 1.22;
            topLidT = 1; botLidT = 1;
            nextAction = 0.8 + Math.random() * 1.2;

        } else if (r < 0.60) {
            // Sleepy — upper lid droops
            topLidT = 0.40;
            botLidT = 1;
            eyeScaleT = 1;
            lookTX = (Math.random() - 0.5) * 0.4;
            lookTY = 0.2;
            nextAction = 2.5 + Math.random() * 3;

        } else if (r < 0.72) {
            // Squinting / amused
            topLidT = 0.68;
            botLidT = 0.78;
            eyeScaleT = 0.92;
            lookTX = (Math.random() - 0.5) * 0.6;
            lookTY = 0.1;
            nextAction = 1.5 + Math.random() * 2;

        } else if (r < 0.82) {
            // Hard side glance
            lookTX = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.2);
            lookTY = (Math.random() - 0.5) * 0.3;
            topLidT = 0.85; botLidT = 1; eyeScaleT = 1;
            nextAction = 1 + Math.random() * 2;

        } else {
            // Return to neutral
            lookTX = (Math.random() - 0.5) * 0.15;
            lookTY = (Math.random() - 0.5) * 0.1;
            topLidT = 1; botLidT = 1; eyeScaleT = 1;
            nextAction = 1.5 + Math.random() * 2;
        }
    }

    /* ── Render ──────────────────────────────────────────────────────── */
    function render() {
        var W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, W, H);

        // Eye geometry — scales with screen width
        var RX = W * 0.13 * eyeScale;       // horizontal radius
        var RY = RX * 0.46;                  // vertical radius (natural eye ratio)
        var IR = RX * 0.42;                  // iris radius
        var PR = IR * 0.40;                  // pupil radius

        var centers = [
            { x: W * 0.33, y: H * 0.50 },
            { x: W * 0.67, y: H * 0.50 },
        ];

        // Iris offset clamped so iris stays inside eye
        var maxDX = (RX - IR) * 0.60;
        var maxDY = (RY - IR * 0.5) * 0.55;
        var idx = lookX * maxDX;
        var idy = lookY * maxDY;

        ctx.beginPath();

        var cols = (W / CELL + 2) | 0;
        var rows = (H / CELL + 2) | 0;

        for (var row = 0; row <= rows; row++) {
            var py = row * CELL + CELL * 0.5;   // cell centre

            for (var col = 0; col <= cols; col++) {
                var px = col * CELL + CELL * 0.5;

                for (var ei = 0; ei < 2; ei++) {
                    var ec = centers[ei];

                    // Horizontal check first (cheap)
                    var nx = (px - ec.x) / RX;
                    if (nx < -1 || nx > 1) continue;

                    // Ellipse half-height at this x
                    var halfH = Math.sqrt(Math.max(0, 1 - nx * nx));

                    // Eyelid positions
                    var topY = ec.y - RY * halfH * topLid;
                    var botY = ec.y + RY * halfH * botLid;
                    if (py < topY || py > botY) continue;

                    // Inside eye opening — iris / pupil / sclera
                    var icx = ec.x + idx;
                    var icy = ec.y + idy;
                    var d2  = (px - icx) * (px - icx) + (py - icy) * (py - icy);

                    if (d2 < PR * PR) {
                        // Pupil — black, no stitch
                    } else if (d2 < IR * IR) {
                        // Iris — concentric ring texture (every other ring)
                        var ringIdx = Math.floor(Math.sqrt(d2) / CELL);
                        if (ringIdx % 2 === 0) stitch(col, row);
                    } else {
                        // Sclera — solid
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
        var ha = Math.min(1, (elapsed - 3) * 0.4);
        if (ha > 0) {
            ctx.globalAlpha = ha * 0.38;
            ctx.fillStyle   = '#ffffff';
            ctx.font        = '12px "Xanh Mono", monospace';
            ctx.textAlign   = 'center';
            ctx.fillText('move cursor or press any key to continue', W * 0.5, H - 28);
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
        scheduleIdle();
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function (type) {
            document.addEventListener(type, function () {
                if (active) dismiss(); else scheduleIdle();
            }, { passive: true });
        });
    });
}());
