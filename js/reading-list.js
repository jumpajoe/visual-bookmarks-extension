// Reading list management module
export class ReadingListManager {
    constructor() {
        this.items = [];
        this.usesChromeAPI = false;
    }

    async load() {
        try {
            // Try Chrome's reading list API first
            if (chrome.readingList) {
                const items = await chrome.readingList.query({});
                this.items = items.map(item => ({
                    id: item.url,
                    title: item.title,
                    url: item.url,
                    hasBeenRead: item.hasBeenRead,
                    dateAdded: item.creationTime
                }));
                this.usesChromeAPI = true;
                console.log(`Loaded ${this.items.length} items from Chrome Reading List`);
            } else {
                // Fallback to custom storage
                const result = await chrome.storage.local.get(['readingList']);
                this.items = result.readingList || [];
                this.usesChromeAPI = false;
                console.log(`Loaded ${this.items.length} items from custom storage`);
            }
        } catch (error) {
            console.error('Error loading reading list:', error);
            // Fallback to custom storage
            const result = await chrome.storage.local.get(['readingList']);
            this.items = result.readingList || [];
            this.usesChromeAPI = false;
        }
    }

    async save() {
        if (!this.usesChromeAPI) {
            try {
                await chrome.storage.local.set({ readingList: this.items });
            } catch (error) {
                console.error('Error saving reading list:', error);
            }
        }
    }

    async add(bookmark) {
        try {
            if (this.usesChromeAPI && chrome.readingList) {
                await chrome.readingList.addEntry({
                    title: bookmark.title,
                    url: bookmark.url,
                    hasBeenRead: false
                });
            } else {
                // Custom storage fallback
                const exists = this.items.some(item => item.url === bookmark.url);
                if (!exists) {
                    this.items.push({
                        id: bookmark.url,
                        title: bookmark.title,
                        url: bookmark.url,
                        dateAdded: Date.now()
                    });
                    await this.save();
                }
            }
            
            // Refresh the list
            await this.load();
        } catch (error) {
            console.error('Error adding to reading list:', error);
            throw error;
        }
    }

    async remove(url) {
        try {
            if (this.usesChromeAPI && chrome.readingList) {
                await chrome.readingList.removeEntry({ url });
            } else {
                // Custom storage fallback
                this.items = this.items.filter(item => item.url !== url);
                await this.save();
            }
            
            // Refresh the list
            await this.load();
        } catch (error) {
            console.error('Error removing from reading list:', error);
            throw error;
        }
    }

    getAll(query = '') {
        if (!query.trim()) return this.items;
        
        const lowerQuery = query.toLowerCase();
        return this.items.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) ||
            item.url.toLowerCase().includes(lowerQuery)
        );
    }

    exists(url) {
        return this.items.some(item => item.url === url);
    }
}