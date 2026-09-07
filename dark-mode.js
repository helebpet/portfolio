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

    function updateButton() {
        label.textContent = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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
