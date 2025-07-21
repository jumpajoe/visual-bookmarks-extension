// Main application entry point
// FIX: Updated import paths to look inside the /js folder
import { BookmarkManager } from './js/bookmarks.js';
import { UIManager } from './js/ui.js';
import { SettingsManager } from './js/settings.js';
import { ReadingListManager } from './js/reading-list.js';

class VisualBookmarksApp {
    constructor() {
        this.bookmarks = new BookmarkManager();
        this.ui = new UIManager();
        this.settings = new SettingsManager();
        this.readingList = new ReadingListManager();
        this.currentView = 'favorites';
        this.currentFolder = null;
        
        // Performance optimization - debounced search
        this.debouncedSearch = this.debounce(this.performSearch.bind(this), 300);
    }

    async init() {
        try {
            console.log('Initializing Visual Bookmarks...');
            
            // Load settings first to apply theme
            await this.settings.load();
            
            // Load data in parallel for faster startup
            await Promise.all([
                this.bookmarks.load(),
                this.readingList.load()
            ]);

            // Initialize UI last
            this.ui.init(this);
            this.ui.switchTab('favorites');

            console.log('Visual Bookmarks initialized successfully');
        } catch (error) {
            console.error('Error initializing Visual Bookmarks:', error);
            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #ef4444; color: white; padding: 2rem; border-radius: 8px;
            font-family: system-ui; text-align: center; z-index: 9999;
        `;
        errorMessage.innerHTML = `
            <h3>Failed to Initialize</h3>
            <p>Please try reloading the page or check the console for details.</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: none; border-radius: 4px; background: white; color: #ef4444; cursor: pointer;">Reload</button>
        `;
        document.body.appendChild(errorMessage);
    }

    // Navigation methods
    switchView(view, folderId = null) {
        this.currentView = view;
        this.currentFolder = folderId ? this.bookmarks.getFolder(folderId) : null;
        this.ui.switchTab(view, this.currentFolder);
    }

    // Search functionality with debouncing for performance
    search(query) {
        this.debouncedSearch(query);
    }

    performSearch(query) {
        this.ui.updateDisplay(this.currentView, this.currentFolder, query);
    }

    // Bookmark CRUD operations
    async addBookmark(data) {
        try {
            const bookmark = await this.bookmarks.create(data);
            
            // Handle additional actions
            if (data.isFavorite) {
                this.bookmarks.addToFavorites(bookmark);
            }
            if (data.addToReading) {
                await this.readingList.add(bookmark);
            }
            
            this.refreshCurrentView();
            this.showSuccessMessage('Bookmark added successfully!');
            return bookmark;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            this.showErrorMessage('Failed to add bookmark');
            throw error;
        }
    }

    async editBookmark(id, data) {
        try {
            await this.bookmarks.update(id, data);
            this.refreshCurrentView();
            this.showSuccessMessage('Bookmark updated successfully!');
        } catch (error) {
            console.error('Error editing bookmark:', error);
            this.showErrorMessage('Failed to update bookmark');
            throw error;
        }
    }

    async deleteBookmark(id) {
        try {
            await this.bookmarks.delete(id);
            this.bookmarks.removeFromFavorites(id);
            this.refreshCurrentView();
            this.showSuccessMessage('Bookmark deleted successfully!');
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            this.showErrorMessage('Failed to delete bookmark');
            throw error;
        }
    }

    async toggleFavorite(id) {
        try {
            this.bookmarks.toggleFavorite(id);
            this.refreshCurrentView();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showErrorMessage('Failed to update favorite');
        }
    }

    async createFolder(name) {
        try {
            await this.bookmarks.createFolder(name);
            this.refreshCurrentView();
            this.showSuccessMessage('Folder created successfully!');
        } catch (error) {
            console.error('Error creating folder:', error);
            this.showErrorMessage('Failed to create folder');
            throw error;
        }
    }

    // Reading list operations
    async addToReadingList(bookmark) {
        try {
            await this.readingList.add(bookmark);
            this.showSuccessMessage('Added to reading list!');
        } catch (error) {
            console.error('Error adding to reading list:', error);
            this.showErrorMessage('Failed to add to reading list');
        }
    }

    async removeFromReadingList(url) {
        try {
            await this.readingList.remove(url);
            if (this.currentView === 'reading') {
                this.refreshCurrentView();
            }
            this.showSuccessMessage('Removed from reading list!');
        } catch (error) {
            console.error('Error removing from reading list:', error);
            this.showErrorMessage('Failed to remove from reading list');
        }
    }

    // Settings operations
    async updateSettings(newSettings) {
        try {
            await this.settings.save(newSettings);
            this.showSuccessMessage('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showErrorMessage('Failed to save settings');
            throw error;
        }
    }

    // Data getter methods (optimized with caching where appropriate)
    getFavorites(query = '') {
        return this.bookmarks.getFavorites(query);
    }

    getAllBookmarks(query = '') {
        return this.bookmarks.getAll(query);
    }

    getFolders(query = '') {
        return this.bookmarks.getFolders(query);
    }

    getFolderBookmarks(folderId, query = '') {
        return this.bookmarks.getFolderBookmarks(folderId, query);
    }

    getReadingList(query = '') {
        return this.readingList.getAll(query);
    }

    getCurrentSettings() {
        return this.settings.current;
    }

    // Utility methods
    refreshCurrentView() {
        this.ui.updateDisplay(this.currentView, this.currentFolder);
    }

    showSuccessMessage(message) {
        // Could be enhanced with toast notifications
        console.log('SUCCESS:', message);
    }

    showErrorMessage(message) {
        console.error('ERROR:', message);
        // Simple alert for now - could be enhanced with toast notifications
    }

    // Performance utility - debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cleanup method
    destroy() {
        this.ui?.destroy();
        this.debouncedSearch = null;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Error handling for unhandled promises
    window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
        event.preventDefault();
    });

    // Initialize the app
    window.app = new VisualBookmarksApp();
    window.app.init();
    
    // Development helper - removed process check
    console.log('App instance available as window.app');
});