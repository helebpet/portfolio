/* Rag control: bind the last two words of a block with a non-breaking space so
   no line ever ends up carrying a single word on its own.

   CSS `text-wrap: balance` / `pretty` already handle this in Chrome and Safari;
   this pass covers the browsers that don't support them yet, and it runs on the
   last text node of a block so nested links and spans keep working. */
(function () {
    'use strict';

    var SELECTOR = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.text-column p',
        '.cv-about p',
        '.cv-entry p',
        '.project-details p',
        '.hero p',
        '.cta-section p',
        '.footer-tagline',
        '.project-title',
        'figcaption',
        '.caption',
        'blockquote p',
        'li'
    ].join(', ');

    /* Joining two long words can push a narrow column into a horizontal
       scroll, so only bind when the pair is short enough to sit on one line. */
    var MAX_PAIR_LENGTH = 18;

    function lastTextNode(el) {
        for (var i = el.childNodes.length - 1; i >= 0; i--) {
            var node = el.childNodes[i];
            if (node.nodeType === 3 && node.nodeValue.trim() !== '') return node;
            if (node.nodeType === 1) {
                var nested = lastTextNode(node);
                if (nested) return nested;
            }
        }
        return null;
    }

    function bindLastWords(el) {
        // Skip anything whose wrapping is driven by markup or script.
        if (el.querySelector('br, .circle, #rotating-word')) return;
        if (el.dataset.noWidont !== undefined) return;

        var node = lastTextNode(el);
        if (!node) return;

        var text = node.nodeValue;
        var trimmedEnd = text.replace(/\s+$/, '');
        var words = trimmedEnd.split(/\s+/);
        if (words.length < 3) return;

        var pair = words[words.length - 2] + words[words.length - 1];
        if (pair.length > MAX_PAIR_LENGTH) return;

        // Replace only the final run of whitespace between the last two words.
        node.nodeValue = trimmedEnd.replace(/\s+(\S+)$/, '\u00A0$1') +
            text.slice(trimmedEnd.length);
    }

    function run() {
        var blocks = document.querySelectorAll(SELECTOR);
        for (var i = 0; i < blocks.length; i++) bindLastWords(blocks[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
