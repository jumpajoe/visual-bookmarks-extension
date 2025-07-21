// Drag and drop functionality module
export class DragDropManager {
    constructor(app) {
        this.app = app;
        this.draggedElement = null;
        this.draggedData = null;
        this.boundMethods = {};
    }

    init() {
        this.bindMethods();
    }

    bindMethods() {
        // Bind methods to maintain 'this' context
        this.boundMethods.handleDragStart = this.handleDragStart.bind(this);
        this.boundMethods.handleDragEnd = this.handleDragEnd.bind(this);
        this.boundMethods.handleDragOver = this.handleDragOver.bind(this);
        this.boundMethods.handleDragLeave = this.handleDragLeave.bind(this);
        this.boundMethods.handleDrop = this.handleDrop.bind(this);
    }

    makeDraggable(card, bookmark) {
        if (!card || !bookmark) return;
        
        card.draggable = true;
        
        // Remove existing listeners to prevent duplicates
        this.removeDragListeners(card);
        
        // Add drag event listeners
        card.addEventListener('dragstart', this.boundMethods.handleDragStart);
        card.addEventListener('dragend', this.boundMethods.handleDragEnd);
        card.addEventListener('dragover', this.boundMethods.handleDragOver);
        card.addEventListener('dragleave', this.boundMethods.handleDragLeave);
        card.addEventListener('drop', this.boundMethods.handleDrop);
        
        // Store bookmark data for reference
        card.bookmarkData = bookmark;
    }

    removeDragListeners(card) {
        card.removeEventListener('dragstart', this.boundMethods.handleDragStart);
        card.removeEventListener('dragend', this.boundMethods.handleDragEnd);
        card.removeEventListener('dragover', this.boundMethods.handleDragOver);
        card.removeEventListener('dragleave', this.boundMethods.handleDragLeave);
        card.removeEventListener('drop', this.boundMethods.handleDrop);
    }

    handleDragStart(e) {
        this.draggedElement = e.currentTarget;
        this.draggedData = e.currentTarget.bookmarkData;
        
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedData?.id || '');
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.clearDragEffects();
        this.draggedElement = null;
        this.draggedData = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        // Only remove if we're actually leaving the element
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const targetElement = e.currentTarget;
        const targetBookmark = targetElement.bookmarkData;
        
        if (targetElement !== this.draggedElement && this.draggedData && targetBookmark) {
            // FIX: Check the current view to decide which reordering logic to use
            if (this.app.currentView === 'favorites') {
                this.reorderFavorites(this.draggedData, targetBookmark);
            } else {
                this.reorderChromeBookmark(this.draggedData, targetBookmark);
            }
        }
        
        this.clearDragEffects();
    }

    clearDragEffects() {
        document.querySelectorAll('.bookmark-card').forEach(card => {
            card.classList.remove('drag-over', 'dragging');
        });
    }

    // FIX: Add a handler for reordering favorites
    async reorderFavorites(draggedBookmark, targetBookmark) {
        // Call the data manager to handle array reordering and saving
        this.app.bookmarks.reorderFavorite(draggedBookmark.id, targetBookmark.id);
        
        // Refresh the current view to show the new order
        this.app.ui.updateDisplay(this.app.currentView, this.app.currentFolder);
    }

    // FIX: Renamed this method for clarity
    async reorderChromeBookmark(draggedBookmark, targetBookmark) {
        try {
            // Get the target bookmark's index
            const targetIndex = await this.getBookmarkIndex(targetBookmark.id);
            
            // Move the dragged bookmark to the target position
            await chrome.bookmarks.move(draggedBookmark.id, {
                parentId: targetBookmark.parentId,
                index: targetIndex
            });
            
            // Refresh the current view
            await this.app.bookmarks.load();
            this.app.ui.updateDisplay(this.app.currentView, this.app.currentFolder);
            
        } catch (error) {
            console.error('Error reordering bookmark:', error);
            // Could show a toast notification here instead of console.error
        }
    }

    async getBookmarkIndex(bookmarkId) {
        try {
            const bookmark = await chrome.bookmarks.get(bookmarkId);
            if (bookmark?.[0]?.parentId) {
                const siblings = await chrome.bookmarks.getChildren(bookmark[0].parentId);
                const index = siblings.findIndex(child => child.id === bookmarkId);
                return index >= 0 ? index : 0;
            }
        } catch (error) {
            console.error('Error getting bookmark index:', error);
        }
        return 0;
    }

    destroy() {
        // Clean up all drag listeners
        document.querySelectorAll('.bookmark-card[draggable="true"]').forEach(card => {
            this.removeDragListeners(card);
            card.draggable = false;
            delete card.bookmarkData;
        });
        
        this.clearDragEffects();
        this.draggedElement = null;
        this.draggedData = null;
    }
}