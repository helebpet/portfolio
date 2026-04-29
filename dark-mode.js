// Runs synchronously from <head> — applies dark class to <html> before first paint
(function () {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
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

    btn.addEventListener('click', function () {
        var isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateButton();
    });
});
