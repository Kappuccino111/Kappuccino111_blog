---
layout: null
---

(function() {
    'use strict';

    const searchModal = document.getElementById('search-modal');
    const searchTrigger = document.getElementById('search-trigger');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchClose = document.getElementById('search-close');

    let searchIndex = [];
    let debounceTimer;
    let isOpen = false;
    let selectedIndex = -1;


    const BASE_URL = '{{ site.baseurl }}' || '';


    async function loadSearchIndex() {
        try {
            const response = await fetch(BASE_URL + '/search.json');
            if (!response.ok) throw new Error('Failed to load search index');
            searchIndex = await response.json();
        } catch (error) {
            console.error('Search index load failed:', error);
            searchIndex = [];
        }
    }


    function openModal() {
        if (isOpen) return;
        isOpen = true;
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            searchInput.focus();
            searchInput.select();
        }, 50);
    }


    function closeModal() {
        if (!isOpen) return;
        isOpen = false;
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
    }


    function performSearch(query) {
        if (!searchResults) return;

        const trimmedQuery = query.trim().toLowerCase();

        if (!trimmedQuery) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }


        const matches = searchIndex.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(trimmedQuery);
            const excerptMatch = post.excerpt.toLowerCase().includes(trimmedQuery);
            const dateMatch = post.date.includes(trimmedQuery);
            return titleMatch || excerptMatch || dateMatch;
        }).slice(0, 8);

        if (matches.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fa-regular fa-face-frown"></i>
                    <p>No results found for "<strong>${escapeHtml(query)}</strong>"</p>
                </div>
            `;
        } else {
            searchResults.innerHTML = matches.map(post => `
                <a href="${escapeHtml(post.url)}" class="search-result-item">
                    <div class="search-result-title">${highlightMatch(escapeHtml(post.title), trimmedQuery)}</div>
                    <div class="search-result-meta">
                        <span class="search-result-date">${escapeHtml(post.date)}</span>
                    </div>
                </a>
            `).join('');
        }
        selectedIndex = -1;
        searchResults.style.display = 'block';
    }


    function updateSelection() {
        if (!searchResults) return;
        const items = searchResults.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            item.classList.toggle('keyboard-selected', index === selectedIndex);
        });
        if (items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }


    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }


    function init() {

        loadSearchIndex();


        if (searchTrigger) {
            searchTrigger.addEventListener('click', function(e) {
                e.preventDefault();
                openModal();
            });
        }


        if (searchClose) {
            searchClose.addEventListener('click', closeModal);
        }


        if (searchModal) {
            searchModal.addEventListener('click', function(e) {
                if (e.target === searchModal) {
                    closeModal();
                }
            });
        }


        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    performSearch(e.target.value);
                }, 100);
            });
        }


        document.addEventListener('keydown', function(e) {

            if (e.key === '/' && !isOpen) {
                const tag = document.activeElement.tagName.toLowerCase();
                const isEditable = document.activeElement.isContentEditable;
                if (tag !== 'input' && tag !== 'textarea' && !isEditable) {
                    e.preventDefault();
                    openModal();
                }
            }


            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                closeModal();
            }

            if (!isOpen) return;

            const items = searchResults ? searchResults.querySelectorAll('.search-result-item') : [];
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection();
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    e.preventDefault();
                    window.location.href = items[selectedIndex].href;
                }
            }
        });
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
