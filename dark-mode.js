// Runs synchronously from <head> — applies dark class to <html> before first paint
(function () {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}

    // An explicit choice always wins. With nothing stored, follow the OS, so a
    // visitor whose system is in dark mode is not handed the light site.
    var dark = stored
        ? stored === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (dark) document.documentElement.classList.add('dark');
})();

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.innerHTML = '<span class="toggle-switch"><span class="toggle-knob"></span></span><span class="toggle-label"></span>';
    var label = btn.querySelector('.toggle-label');

    btn.setAttribute('aria-label', 'Dark mode');

    function updateButton() {
        var isDark = document.documentElement.classList.contains('dark');
        label.textContent = isDark ? 'dark' : 'light';
        // The visible label already changes, but the state has to be exposed
        // programmatically too, not only visually (WCAG 4.1.2).
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }

    updateButton();

    var themeTimer = null;

    btn.addEventListener('click', function () {
        var root = document.documentElement;

        // Only ease colours while the toggle is actually running, so the
        // transition never fires on page load or on unrelated colour changes.
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            root.classList.add('theme-animating');
            clearTimeout(themeTimer);
            themeTimer = setTimeout(function () {
                root.classList.remove('theme-animating');
            }, 250);
        }

        var isDark = root.classList.toggle('dark');
        try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
        updateButton();
    });
});

/* Mobile header menu. The nav and the theme toggle are folded behind a
 * hamburger below 768px; above that the button is display:none and none of
 * this has any effect. */
document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.top-bar');
    var btn = bar && bar.querySelector('.nav-toggle');
    if (!bar || !btn) return;

    function setOpen(open) {
        bar.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    }

    btn.addEventListener('click', function () {
        setOpen(!bar.classList.contains('is-open'));
    });

    // Following a link should not leave the menu hanging open behind the
    // next page's paint, and tapping the theme toggle is a deliberate act
    // that does not need the menu to stay up either.
    bar.querySelectorAll('.top-nav a, .theme-toggle').forEach(function (el) {
        el.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && bar.classList.contains('is-open')) {
            setOpen(false);
            btn.focus();
        }
    });

    // Back above the breakpoint the menu is irrelevant; drop the state so it
    // cannot linger and re-appear on the next resize down.
    var wide = window.matchMedia('(min-width: 769px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') :
        wide.addListener.bind(wide))(function (e) {
        if (e.matches) setOpen(false);
    });
});

/* Publish the header's real height so a full-view cover image can size itself
 * to the remainder of the first screen. */
(function () {
    function setHeaderHeight() {
        var bar = document.querySelector('.top-bar');
        if (!bar) return;
        document.documentElement.style.setProperty(
            '--header-h', Math.round(bar.getBoundingClientRect().bottom) + 'px');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setHeaderHeight);
    } else {
        setHeaderHeight();
    }
    window.addEventListener('load', setHeaderHeight);
    window.addEventListener('resize', setHeaderHeight);
})();
