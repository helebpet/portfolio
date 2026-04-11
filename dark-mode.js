// Runs synchronously from <head> — applies dark class to <html> before first paint
(function () {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateButton() {
        btn.textContent = document.documentElement.classList.contains('dark') ? 'dark mode' : 'light mode';
    }

    updateButton();

    btn.addEventListener('click', function () {
        var isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateButton();
    });
});
