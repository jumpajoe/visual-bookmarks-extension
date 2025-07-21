// Element creation factory module
export class ElementFactory {
    constructor(dragDropManager) {
        this.dragDropManager = dragDropManager;
    }

    createBookmarkCard(bookmark, isFavorite = false) {
        const card = document.createElement('a');
        card.href = bookmark.url;
        card.target = '_blank';
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;

        // Create action buttons
        const actionsDiv = this.createActionButtons(isFavorite);
        
        // Create favicon
        const favicon = this.createFavicon(bookmark.url);
        
        // Create text content
        const nameDiv = this.createTextElement('div', 'bookmark-name', bookmark.title || 'Untitled');
        const urlDiv = this.createTextElement('div', 'bookmark-url', this.getDomainFromUrl(bookmark.url));
        
        // Assemble card
        card.appendChild(actionsDiv);
        card.appendChild(favicon);
        card.appendChild(nameDiv);
        card.appendChild(urlDiv);

        // Make draggable if dragDropManager is available
        if (this.dragDropManager) {
            this.dragDropManager.makeDraggable(card, bookmark);
        }

        return card;
    }

    createActionButtons(isFavorite) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'bookmark-actions';
        
        const buttons = [
            { class: 'favorite-btn', text: isFavorite ? '★' : '☆', title: isFavorite ? 'Remove from favorites' : 'Add to favorites' },
            { class: 'edit-btn', text: '✏️', title: 'Edit bookmark' },
            { class: 'delete-btn', text: '🗑️', title: 'Delete bookmark' },
            { class: 'reading-btn', text: '📖', title: 'Add to reading list' }
        ];
        
        buttons.forEach(btn => {
            const button = this.createButton(btn.class, btn.text, btn.title);
            actionsDiv.appendChild(button);
        });
        
        return actionsDiv;
    }

    createButton(className, text, title) {
        const button = document.createElement('button');
        button.className = `action-btn ${className}`;
        button.title = title;
        button.textContent = text;
        return button;
    }

    createFavicon(url) {
        const favicon = document.createElement('img');
        favicon.src = this.getFaviconUrl(url);
        favicon.alt = 'Favicon';
        favicon.className = 'bookmark-favicon';
        favicon.onerror = () => {
            favicon.src = this.generateFallbackIcon(url);
        };
        return favicon;
    }

    createTextElement(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    createFolderCard(folder) {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.dataset.folderId = folder.id;

        const nameDiv = this.createTextElement('div', 'folder-name', folder.title || 'Untitled Folder');
        const countDiv = this.createTextElement('div', 'folder-count', `${folder.children?.length || 0} bookmarks`);
        
        card.appendChild(nameDiv);
        card.appendChild(countDiv);

        return card;
    }

    createCreateFolderCard() {
        const card = document.createElement('div');
        card.className = 'create-folder-card';
        card.id = 'create-folder-card';

        const iconDiv = this.createTextElement('div', 'create-folder-icon', '📁+');
        const nameDiv = this.createTextElement('div', 'folder-name', 'Create New Folder');
        
        card.appendChild(iconDiv);
        card.appendChild(nameDiv);

        return card;
    }

    createReadingListItem(item) {
        const readingItem = document.createElement('a');
        readingItem.href = item.url;
        readingItem.target = '_blank';
        readingItem.className = 'reading-item';
        readingItem.dataset.id = item.url;
        // FIX: Explicitly set draggable to false since reordering is not supported
        readingItem.draggable = false;

        const favicon = this.createFavicon(item.url);
        favicon.className = 'reading-favicon';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'reading-content';
        
        const titleDiv = this.createTextElement('div', 'reading-title', item.title || 'Untitled');
        const urlDiv = this.createTextElement('div', 'reading-url', this.getDomainFromUrl(item.url));
        
        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(urlDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'reading-actions';
        
        const removeBtn = this.createButton('remove-reading-btn', '🗑️', 'Remove from reading list');
        actionsDiv.appendChild(removeBtn);
        
        readingItem.appendChild(favicon);
        readingItem.appendChild(contentDiv);
        readingItem.appendChild(actionsDiv);

        return readingItem;
    }

    createEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        
        const heading = this.createTextElement('h3', '', 'Nothing here yet');
        const paragraph = this.createTextElement('p', '', message);
        
        empty.appendChild(heading);
        empty.appendChild(paragraph);
        
        return empty;
    }

    // Utility methods
    getDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return this.generateFallbackIcon(url);
        }
    }

    generateFallbackIcon(url) {
        try {
            const domain = new URL(url).hostname;
            const firstLetter = domain.charAt(0).toUpperCase();
            const colors = [
                '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', 
                '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
            ];
            const color = colors[firstLetter.charCodeAt(0) % colors.length];
            
            return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                <rect width="64" height="64" rx="8" fill="${encodeURIComponent(color)}"/>
                <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">${firstLetter}</text>
            </svg>`;
        } catch {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="%23374151"/><circle cx="32" cy="32" r="12" fill="%23ffffff"/></svg>';
        }
    }
}