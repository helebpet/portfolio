/* Pause control for autoplaying case-study video (WCAG 2.2.2).
 *
 * The videos loop indefinitely with no native controls, so there is no way to
 * stop them. This gives each one a small toggle. It also starts videos paused
 * under prefers-reduced-motion, where looping motion is exactly what the
 * visitor opted out of, and leaves the control there so they can start it.
 */
(function () {
    'use strict';

    var PLAY  = 'M5 3.5v9l7-4.5z';
    var PAUSE = 'M5.5 3.5h2v9h-2zM8.5 3.5h2v9h-2z';

    function icon(paused) {
        return '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
               '<path d="' + (paused ? PLAY : PAUSE) + '"/></svg>';
    }

    function wire(video) {
        if (video.dataset.hasControl) return;
        video.dataset.hasControl = '1';

        // Native controls stay off; this is our own so it can be styled and
        // sized to a proper target.
        video.removeAttribute('controls');

        // Moving a media element in the DOM can interrupt playback, and an
        // autoplay that has already fired will not fire again. Remember the
        // intent, move, then resume.
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var shouldPlay = !reduce && (video.autoplay || video.hasAttribute('autoplay') || !video.paused);

        var wrap = document.createElement('div');
        wrap.className = 'video-wrap';
        video.parentNode.insertBefore(wrap, video);
        wrap.appendChild(video);

        if (shouldPlay) {
            var resume = video.play();
            if (resume && resume.catch) resume.catch(function () {});
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'video-toggle';
        wrap.appendChild(btn);

        function sync() {
            var paused = video.paused;
            btn.innerHTML = icon(paused);
            btn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
            btn.setAttribute('aria-pressed', paused ? 'false' : 'true');
        }

        btn.addEventListener('click', function () {
            if (video.paused) {
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
            } else {
                video.pause();
            }
        });

        video.addEventListener('play', sync);
        video.addEventListener('pause', sync);

        if (reduce) {
            video.removeAttribute('autoplay');
            video.pause();
        }

        sync();
    }

    function run() {
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) wire(videos[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
