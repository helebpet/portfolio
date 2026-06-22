// Footer "Let's talk" button: scroll up to the sidebar contact links, then make
// them glow in the accent colors (same glow used by the about-page CTA button).
(function () {
    function wire() {
        var btn = document.getElementById('footer-contact');
        var contacts = document.querySelector('.contact-links');
        if (!btn || !contacts) return;

        function glow() {
            contacts.classList.remove('glow');
            // force reflow so the animation can restart on repeat clicks
            void contacts.offsetWidth;
            contacts.classList.add('glow');
        }

        btn.addEventListener('click', function () {
            // Scroll up so the contact links are in view, then glow them.
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(glow, 450);
        });

        contacts.addEventListener('animationend', function () {
            contacts.classList.remove('glow');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
    } else {
        wire();
    }
})();
