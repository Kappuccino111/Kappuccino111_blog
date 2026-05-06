(function() {
    'use strict';

    function initCopyButtons() {
        const codeBlocks = document.querySelectorAll('div.highlight');

        codeBlocks.forEach(function(block) {
            if (block.querySelector('.copy-code-button')) return;

            const button = document.createElement('button');
            button.className = 'copy-code-button';
            button.setAttribute('aria-label', 'Copy code to clipboard');
            button.setAttribute('title', 'Copy');
            button.innerHTML = '<i class="fa-regular fa-clipboard"></i>';

            button.addEventListener('click', function() {
                const code = block.querySelector('code');
                const text = code ? code.innerText : block.innerText;

                navigator.clipboard.writeText(text).then(function() {
                    button.classList.add('copied');
                    button.innerHTML = '<i class="fa-solid fa-check"></i><span class="copy-label">Copied</span>';
                    button.setAttribute('aria-label', 'Copied!');
                    button.setAttribute('title', 'Copied!');

                    setTimeout(function() {
                        button.classList.remove('copied');
                        button.innerHTML = '<i class="fa-regular fa-clipboard"></i>';
                        button.setAttribute('aria-label', 'Copy code to clipboard');
                        button.setAttribute('title', 'Copy');
                    }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy code:', err);
                });
            });

            block.appendChild(button);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopyButtons);
    } else {
        initCopyButtons();
    }
})();
