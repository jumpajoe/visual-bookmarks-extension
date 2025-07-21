// Optimized UI management module
// FIX: Corrected import paths to be relative to ui.js's location inside the /js folder.
import { ClockManager } from './clock-manager.js';
import { DragDropManager } from './drag-drop-manager.js';
import { ElementFactory } from './element-factory.js';
import { ModalManager } from './modal-manager.js';

export class UIManager {
    constructor() {
        this.app = null;
        this.elements = {};
        
        // Initialize sub-managers
        this.clock = new ClockManager();
        this.dragDrop = null;
        this.elementFactory = null;
        this.modals = null;
        
        // Bind methods for performance
        this.boundHandlers = {};
    }

    init(app) {
        this.app = app;
        this.cacheElements();
        this.initializeManagers();
        this.setupEventListeners();
    }

    cacheElements() {
        // Cache frequently used elements
        this.elements = {
            // Search elements
            googleSearch: document.getElementById('google-search'),
            search: document.getElementById('search'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // Navigation
            tabs: document.querySelectorAll('.tab'),
            sections: document.querySelectorAll('.section'),
            backBtn: document.getElementById('back-btn'),
            folderTitle: document.getElementById('folder-title'),
            
            // Content grids
            grids: {
                favorites: document.getElementById('favorites-grid'),
                all: document.getElementById('all-grid'),
                folders: document.getElementById('folders-grid'),
                folderBookmarks: document.getElementById('folder-bookmarks-grid'),
                reading: document.getElementById('reading-grid')
            },
            
            // Buttons
            addBtn: document.getElementById('add-btn')
        };
    }

    initializeManagers() {
        // Initialize sub-managers
        this.dragDrop = new DragDropManager(this.app);
        this.elementFactory = new ElementFactory(this.dragDrop);
        this.modals = new ModalManager(this.app);
        
        // Initialize all managers
        this.clock.init();
        this.dragDrop.init();
        this.modals.init();
    }

    setupEventListeners() {
        this.bindHandlers();
        this.setupSearchListeners();
        this.setupNavigationListeners();
        this.setupGlobalListeners();
    }

    bindHandlers() {
        // Bind frequently used handlers for performance
        this.boundHandlers.handleGoogleSearch = this.handleGoogleSearch.bind(this);
        this.boundHandlers.handleBookmarkSearch = this.handleBookmarkSearch.bind(this);
        this.boundHandlers.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.boundHandlers.handleKeyboard = this.handleKeyboard.bind(this);
        this.boundHandlers.switchToFolders = () => this.app.switchView('folders');
        this.boundHandlers.showBookmarkModal = () => this.modals.showBookmarkModal();
        this.boundHandlers.showSettingsModal = () => this.modals.showSettingsModal();
    }

    setupSearchListeners() {
        this.elements.googleSearch?.addEventListener('keypress', this.boundHandlers.handleGoogleSearch);
        this.elements.search?.addEventListener('input', this.boundHandlers.handleBookmarkSearch);
    }

    setupNavigationListeners() {
        // Tab navigation
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.app.switchView(tab.dataset.tab));
        });
        
        // Other navigation
        this.elements.backBtn?.addEventListener('click', this.boundHandlers.switchToFolders);
        this.elements.addBtn?.addEventListener('click', this.boundHandlers.showBookmarkModal);
        this.elements.settingsBtn?.addEventListener('click', this.boundHandlers.showSettingsModal);
    }

    setupGlobalListeners() {
        document.addEventListener('click', this.boundHandlers.handleGlobalClick);
        document.addEventListener('keydown', this.boundHandlers.handleKeyboard);
    }

    // Event handlers
    handleGoogleSearch(e) {
        if (e.key !== 'Enter') return;
        
        const query = this.elements.googleSearch.value.trim();
        if (!query) return;
        
        const url = query.includes('.') && !query.includes(' ') 
            ? (query.startsWith('http') ? query : `https://${query}`)
            : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        
        window.open(url, '_blank');
        this.elements.googleSearch.value = '';
    }

    handleBookmarkSearch(e) {
        this.app.search(e.target.value);
    }

    async handleGlobalClick(e) {
        // Prevent default for action buttons
        if (e.target.classList.contains('action-btn')) {
            e.preventDefault();
            e.stopPropagation();
        }

        const action = this.getActionFromElement(e.target);
        if (!action) return;

        try {
            await this.executeAction(action, e);
        } catch (error) {
            console.error('Error executing action:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }

    getActionFromElement(target) {
        const actionMap = {
            'favorite-btn': 'favorite',
            'edit-btn': 'edit',
            'delete-btn': 'delete',
            'reading-btn': 'addToReading',
            'remove-reading-btn': 'removeFromReading'
        };

        // Check direct button classes
        for (const [className, action] of Object.entries(actionMap)) {
            if (target.classList.contains(className)) return action;
        }

        // Check parent elements
        if (target.closest('#create-folder-card')) return 'createFolder';
        if (target.closest('.folder-card')) return 'openFolder';
        if (target.closest('.bookmark-card') && !target.classList.contains('action-btn')) return 'openBookmark';
        if (target.closest('.reading-item') && !target.classList.contains('action-btn')) return 'openReading';

        return null;
    }

    async executeAction(action, e) {
        const target = e.target;
        
        const actionHandlers = {
            'favorite': () => this.handleFavoriteAction(target),
            'edit': () => this.handleEditAction(target),
            'delete': () => this.handleDeleteAction(target),
            'addToReading': () => this.handleAddToReadingAction(target),
            'removeFromReading': () => this.handleRemoveFromReadingAction(target),
            'createFolder': () => this.modals.showFolderModal(),
            'openFolder': () => this.handleOpenFolderAction(target),
            'openBookmark': () => this.handleOpenBookmarkAction(target),
            'openReading': () => this.handleOpenReadingAction(target)
        };

        const handler = actionHandlers[action];
        if (handler) await handler();
    }

    async handleFavoriteAction(target) {
        const card = target.closest('.bookmark-card');
        if (card?.dataset.id) {
            await this.app.toggleFavorite(card.dataset.id);
        }
    }

    handleEditAction(target) {
        const card = target.closest('.bookmark-card');
        if (card?.dataset.id) {
            const bookmark = this.app.getAllBookmarks().find(b => b.id === card.dataset.id);
            if (bookmark) this.modals.showBookmarkModal(true, bookmark);
        }
    }

    async handleDeleteAction(target) {
        if (!confirm('Are you sure you want to delete this bookmark?')) return;
        
        const card = target.closest('.bookmark-card');
        if (card?.dataset.id) {
            await this.app.deleteBookmark(card.dataset.id);
        }
    }

    async handleAddToReadingAction(target) {
        const card = target.closest('.bookmark-card');
        if (card?.dataset.id) {
            const bookmark = this.app.getAllBookmarks().find(b => b.id === card.dataset.id);
            if (bookmark) await this.app.addToReadingList(bookmark);
        }
    }

    async handleRemoveFromReadingAction(target) {
        const item = target.closest('.reading-item');
        if (item?.dataset.id) {
            await this.app.removeFromReadingList(item.dataset.id);
        }
    }

    handleOpenFolderAction(target) {
        const card = target.closest('.folder-card');
        if (card?.dataset.folderId && !target.closest('#create-folder-card')) {
            this.app.switchView('folder-view', card.dataset.folderId);
        }
    }

    handleOpenBookmarkAction(target) {
        const card = target.closest('.bookmark-card');
        if (card?.href) window.open(card.href, '_blank');
    }

    handleOpenReadingAction(target) {
        const item = target.closest('.reading-item');
        if (item?.href) window.open(item.href, '_blank');
    }

    handleKeyboard(e) {
        const keyHandlers = {
            'k': () => this.focusSearch(e),
            'b': () => this.showAddBookmark(e),
            'Escape': () => this.handleEscape(),
            '/': () => this.focusGoogleSearch(e)
        };

        const handler = keyHandlers[e.key];
        if (handler) handler();
    }

    focusSearch(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            this.elements.search?.focus();
            this.elements.search?.select();
        }
    }

    showAddBookmark(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            this.modals.showBookmarkModal();
        }
    }

    handleEscape() {
        // Check if any modal is open first
        if (!this.modals.modals.bookmark.element.classList.contains('hidden')) {
            this.modals.hide('bookmark');
        } else if (!this.modals.modals.folder.element.classList.contains('hidden')) {
            this.modals.hide('folder');
        } else if (!this.modals.modals.settings.element.classList.contains('hidden')) {
            this.modals.hide('settings');
        } else if (this.elements.search?.value) {
            this.elements.search.value = '';
            this.app.search('');
        }
    }

    focusGoogleSearch(e) {
        if (!e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            this.elements.googleSearch?.focus();
        }
    }

    // Display management
    switchTab(view, folder = null) {
        this.updateActiveTab(view);
        this.showSection(view === 'folder-view' ? 'folder-view' : view);
        
        if (folder && this.elements.folderTitle) {
            this.elements.folderTitle.textContent = folder.title;
        }
        
        this.updateDisplay(view, folder);
    }

    updateActiveTab(view) {
        this.elements.tabs.forEach(tab => {
            const isActive = tab.dataset.tab === view || (view === 'folder-view' && tab.dataset.tab === 'folders');
            tab.classList.toggle('active', isActive);
        });
    }

    showSection(sectionId) {
        this.elements.sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
    }

    updateDisplay(view, folder = null, query = '') {
        const displayMethods = {
            'favorites': () => this.displayFavorites(query),
            'all': () => this.displayAllBookmarks(query),
            'folders': () => this.displayFolders(query),
            'folder-view': () => folder && this.displayFolderBookmarks(folder.id, query),
            'reading': () => this.displayReadingList(query)
        };

        const method = displayMethods[view];
        if (method) method();
    }

    displayFavorites(query = '') {
        const favorites = this.app.getFavorites(query);
        this.renderBookmarksGrid('favorites', favorites, query, 'No favorites yet! Star some bookmarks to see them here.');
    }

    displayAllBookmarks(query = '') {
        const bookmarks = this.app.getAllBookmarks(query);
        this.renderBookmarksGrid('all', bookmarks, query, 'No bookmarks found. Add some bookmarks to get started!');
    }

    displayFolders(query = '') {
        const folders = this.app.getFolders(query);
        const grid = this.elements.grids.folders;
        
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.appendChild(this.elementFactory.createCreateFolderCard());
        
        if (folders.length === 0 && query) {
            grid.appendChild(this.elementFactory.createEmptyState(`No folders matching "${query}"`));
        } else {
            folders.forEach(folder => {
                grid.appendChild(this.elementFactory.createFolderCard(folder));
            });
        }
    }

    displayFolderBookmarks(folderId, query = '') {
        const bookmarks = this.app.getFolderBookmarks(folderId, query);
        this.renderBookmarksGrid('folderBookmarks', bookmarks, query, 'This folder is empty. Add some bookmarks to it!');
    }

    displayReadingList(query = '') {
        const items = this.app.getReadingList(query);
        const grid = this.elements.grids.reading;
        
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (items.length === 0) {
            const message = query ? 
                `No reading list items matching "${query}"` : 
                'Your reading list is empty. Click the 📖 button on bookmarks to add them!';
            grid.appendChild(this.elementFactory.createEmptyState(message));
        } else {
            items.forEach(item => {
                grid.appendChild(this.elementFactory.createReadingListItem(item));
            });
        }
    }

    renderBookmarksGrid(gridName, bookmarks, query, emptyMessage) {
        const grid = this.elements.grids[gridName];
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (bookmarks.length === 0) {
            const message = query ? 
                `No bookmarks matching "${query}"` : 
                emptyMessage;
            grid.appendChild(this.elementFactory.createEmptyState(message));
        } else {
            bookmarks.forEach(bookmark => {
                const isFavorite = this.app.bookmarks?.isFavorite(bookmark.id) || false;
                const card = this.elementFactory.createBookmarkCard(bookmark, isFavorite);
                grid.appendChild(card);
            });
        }
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Simple alert for now - could be enhanced with toast notifications
        console.log(`${type.toUpperCase()}: ${message}`);
        if (type === 'error') alert(message);
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        this.elements.googleSearch?.removeEventListener('keypress', this.boundHandlers.handleGoogleSearch);
        this.elements.search?.removeEventListener('input', this.boundHandlers.handleBookmarkSearch);
        document.removeEventListener('click', this.boundHandlers.handleGlobalClick);
        document.removeEventListener('keydown', this.boundHandlers.handleKeyboard);
        
        // Destroy sub-managers
        this.clock?.destroy();
        this.dragDrop?.destroy();
        this.modals?.destroy();
    }
}