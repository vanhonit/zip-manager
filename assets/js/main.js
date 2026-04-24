// Main JavaScript for Rusty Compress documentation site

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active navigation highlighting
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Copy code functionality
    document.querySelectorAll('pre code').forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        button.style.position = 'absolute';
        button.style.top = '0.5rem';
        button.style.right = '0.5rem';
        button.style.padding = '0.25rem 0.5rem';
        button.style.fontSize = '0.75rem';
        button.style.backgroundColor = '#667eea';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';

        const pre = block.parentElement;
        pre.style.position = 'relative';
        pre.appendChild(button);

        button.addEventListener('click', function() {
            navigator.clipboard.writeText(block.textContent).then(() => {
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            });
        });
    });

    // Mobile menu toggle (if needed)
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }

    // Search functionality (simple client-side search)
    const searchInput = document.querySelector('#search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.card');

            cards.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const content = card.textContent.toLowerCase();

                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Table of contents generation for long pages
    const content = document.querySelector('.page-content');
    if (content) {
        const headings = content.querySelectorAll('h2, h3');
        if (headings.length > 3) {
            const toc = document.createElement('div');
            toc.className = 'table-of-contents';
            toc.innerHTML = '<h3>Table of Contents</h3><ul></ul>';

            const tocList = toc.querySelector('ul');
            headings.forEach(heading => {
                const link = document.createElement('a');
                link.textContent = heading.textContent;
                link.href = `#${heading.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;

                // Add ID to heading if it doesn't have one
                if (!heading.id) {
                    heading.id = heading.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                }

                const listItem = document.createElement('li');
                listItem.appendChild(link);
                tocList.appendChild(listItem);
            });

            const headerContent = document.querySelector('.page-header');
            if (headerContent) {
                headerContent.parentNode.insertBefore(toc, headerContent.nextSibling);
            }
        }
    }

    // Accessibility improvements
    document.querySelectorAll('a').forEach(link => {
        if (!link.hasAttribute('aria-label') && link.textContent.trim() === '') {
            const href = link.getAttribute('href');
            if (href) {
                link.setAttribute('aria-label', `Link to ${href}`);
            }
        }
    });

    console.log('Rusty Compress documentation loaded successfully!');
});