// Bookmark management module
export class BookmarkManager {
    constructor() {
        this.chromeBookmarks = [];
        this.folders = [];
        this.favorites = [];
    }

    async load() {
        await Promise.all([
            this.loadChromeBookmarks(),
            this.loadFavorites()
        ]);
    }

    async loadChromeBookmarks() {
        try {
            const bookmarkTree = await chrome.bookmarks.getTree();
            this.chromeBookmarks = [];
            this.folders = [];

            this.traverseBookmarksTree(bookmarkTree);
            
            // FIX: Sort folders alphabetically by title
            this.folders.sort((a, b) => a.title.localeCompare(b.title));

            console.log(`Loaded ${this.chromeBookmarks.length} bookmarks and ${this.folders.length} folders`);
        } catch (error) {
            console.error('Error loading Chrome bookmarks:', error);
        }
    }

    traverseBookmarksTree(nodes) {
        nodes.forEach(node => {
            if (node.children) {
                // This is a folder
                if (node.title && !['0', '1', '2'].includes(node.id)) {
                    const bookmarksInFolder = [];
                    this.collectBookmarksFromFolder(node.children, bookmarksInFolder);
                    
                    this.folders.push({
                        id: node.id,
                        title: node.title,
                        children: bookmarksInFolder,
                        parentId: node.parentId
                    });
                }
                this.traverseBookmarksTree(node.children);
            } else if (node.url) {
                // This is a bookmark
                this.chromeBookmarks.push({
                    id: node.id,
                    title: node.title,
                    url: node.url,
                    parentId: node.parentId
                });
            }
        });
    }

    collectBookmarksFromFolder(children, bookmarksArray) {
        children.forEach(child => {
            if (child.url) {
                bookmarksArray.push({
                    id: child.id,
                    title: child.title,
                    url: child.url,
                    parentId: child.parentId
                });
            } else if (child.children) {
                this.collectBookmarksFromFolder(child.children, bookmarksArray);
            }
        });
    }

    async loadFavorites() {
        try {
            const result = await chrome.storage.local.get(['favoriteBookmarks']);
            this.favorites = result.favoriteBookmarks || [];
        } catch (error)
        {
            console.error('Error loading favorites:', error);
        }
    }

    async saveFavorites() {
        try {
            await chrome.storage.local.set({ favoriteBookmarks: this.favorites });
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    // CRUD operations
    async create(data) {
        try {
            const bookmark = await chrome.bookmarks.create({
                title: data.title,
                url: data.url,
                parentId: data.parentId || undefined
            });
            
            await this.loadChromeBookmarks(); // Refresh
            return bookmark;
        } catch (error) {
            console.error('Error creating bookmark:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            await chrome.bookmarks.update(id, {
                title: data.title,
                url: data.url
            });
            
            await this.loadChromeBookmarks(); // Refresh
        } catch (error) {
            console.error('Error updating bookmark:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            await chrome.bookmarks.remove(id);
            await this.loadChromeBookmarks(); // Refresh
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            throw error;
        }
    }

    async createFolder(title) {
        try {
            const bookmarkTree = await chrome.bookmarks.getTree();
            const parentId = bookmarkTree[0].children[0].id; // Bookmarks Bar
            
            await chrome.bookmarks.create({
                title,
                parentId
            });
            
            await this.loadChromeBookmarks(); // Refresh
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    // Favorites management
    toggleFavorite(bookmarkId) {
        const bookmark = this.chromeBookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        const favoriteIndex = this.favorites.findIndex(b => b.id === bookmarkId);
        
        if (favoriteIndex > -1) {
            this.favorites.splice(favoriteIndex, 1);
        } else {
            this.favorites.push(bookmark);
        }
        
        this.saveFavorites();
    }

    addToFavorites(bookmark) {
        const exists = this.favorites.some(fav => fav.id === bookmark.id);
        if (!exists) {
            this.favorites.push(bookmark);
            this.saveFavorites();
        }
    }

    removeFromFavorites(bookmarkId) {
        const index = this.favorites.findIndex(b => b.id === bookmarkId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
        }
    }
    
    // FIX: Add a method to reorder the custom favorites array
    reorderFavorite(draggedId, targetId) {
        const draggedIndex = this.favorites.findIndex(b => b.id === draggedId);
        const targetIndex = this.favorites.findIndex(b => b.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove the dragged item from its original position
        const [draggedItem] = this.favorites.splice(draggedIndex, 1);
        
        // Insert it at the target's position
        this.favorites.splice(targetIndex, 0, draggedItem);
        
        // Save the newly ordered array
        this.saveFavorites();
    }

    // Data getters with filtering
    getFavorites(query = '') {
        return this.filterBookmarks(this.favorites, query);
    }

    getAll(query = '') {
        return this.filterBookmarks(this.chromeBookmarks, query);
    }

    getFolders(query = '') {
        if (!query.trim()) return this.folders;
        return this.folders.filter(folder => 
            folder.title.toLowerCase().includes(query.toLowerCase())
        );
    }

    getFolderBookmarks(folderId, query = '') {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return [];
        return this.filterBookmarks(folder.children, query);
    }

    getFolder(folderId) {
        return this.folders.find(f => f.id === folderId);
    }

    filterBookmarks(bookmarks, query) {
        if (!query.trim()) return bookmarks;
        const lowerQuery = query.toLowerCase();
        return bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(lowerQuery) ||
            bookmark.url.toLowerCase().includes(lowerQuery)
        );
    }

    // Check if bookmark is favorited
    isFavorite(bookmarkId) {
        return this.favorites.some(fav => fav.id === bookmarkId);
    }
}