/* Keep every case-study video playing, silently and on loop.
 *
 * The markup already carries autoplay/loop/muted/playsinline, but iOS and
 * Android only honour autoplay when the element is muted AND playsinline AND
 * play() is called explicitly, and a tab that was backgrounded during load
 * never fires autoplay at all. This re-asserts that, with no visible UI. */
(function () {
    'use strict';

    function start(v) {
        v.muted = true;
        v.defaultMuted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.removeAttribute('controls');
        var p = v.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    function playAll() {
        var vids = document.querySelectorAll('video');
        for (var i = 0; i < vids.length; i++) start(vids[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', playAll);
    } else {
        playAll();
    }
    window.addEventListener('load', playAll);
    window.addEventListener('pageshow', playAll);

    // A tab that loads in the background never autoplays; catch it on return.
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) playAll();
    });

    // iOS can still refuse until the page has been touched once.
    document.addEventListener('touchstart', playAll, { once: true, passive: true });
})();
