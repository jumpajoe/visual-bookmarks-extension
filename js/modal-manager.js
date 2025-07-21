// Modal management module
export class ModalManager {
    constructor(app) {
        this.app = app;
        this.modals = {};
        this.boundHandlers = {};
    }

    init() {
        this.cacheModalElements();
        this.setupEventListeners();
    }

    cacheModalElements() {
        this.modals = {
            bookmark: {
                element: document.getElementById('bookmark-modal'),
                form: document.getElementById('bookmark-form'),
                title: document.getElementById('bookmark-modal-title'),
                fields: {
                    id: document.getElementById('bookmark-id'),
                    name: document.getElementById('bookmark-name'),
                    url: document.getElementById('bookmark-url'),
                    folder: document.getElementById('bookmark-folder'),
                    favorite: document.getElementById('bookmark-favorite')
                },
                buttons: {
                    cancel: document.getElementById('bookmark-cancel-btn')
                }
            },
            folder: {
                element: document.getElementById('folder-modal'),
                form: document.getElementById('folder-form'),
                fields: {
                    name: document.getElementById('folder-name')
                },
                buttons: {
                    cancel: document.getElementById('folder-cancel-btn')
                }
            },
            settings: {
                element: document.getElementById('settings-modal'),
                fields: {
                    theme: document.querySelectorAll('input[name="theme"]'),
                    fontFamily: document.getElementById('font-family'),
                    fontSize: document.getElementById('font-size'),
                    fontSizeValue: document.getElementById('font-size-value')
                },
                buttons: {
                    save: document.getElementById('settings-save-btn'),
                    cancel: document.getElementById('settings-cancel-btn')
                }
            }
        };
    }

    setupEventListeners() {
        this.bindHandlers();
        this.setupBookmarkModal();
        this.setupFolderModal();
        this.setupSettingsModal();
    }

    bindHandlers() {
        // Bind methods to maintain context
        this.boundHandlers.handleBookmarkSubmit = this.handleBookmarkSubmit.bind(this);
        this.boundHandlers.handleFolderSubmit = this.handleFolderSubmit.bind(this);
        this.boundHandlers.handleSettingsSubmit = this.handleSettingsSubmit.bind(this);
        this.boundHandlers.handleFontSizeChange = this.handleFontSizeChange.bind(this);
    }

    setupBookmarkModal() {
        const modal = this.modals.bookmark;
        if (!modal.form || !modal.buttons.cancel) return;

        modal.form.addEventListener('submit', this.boundHandlers.handleBookmarkSubmit);
        modal.buttons.cancel.addEventListener('click', () => this.hide('bookmark'));
        modal.element.addEventListener('click', (e) => {
            if (e.target === modal.element) this.hide('bookmark');
        });
    }

    setupFolderModal() {
        const modal = this.modals.folder;
        if (!modal.form || !modal.buttons.cancel) return;

        modal.form.addEventListener('submit', this.boundHandlers.handleFolderSubmit);
        modal.buttons.cancel.addEventListener('click', () => this.hide('folder'));
        modal.element.addEventListener('click', (e) => {
            if (e.target === modal.element) this.hide('folder');
        });
    }

    setupSettingsModal() {
        const modal = this.modals.settings;
        if (!modal.buttons.save || !modal.buttons.cancel) return;

        modal.buttons.save.addEventListener('click', this.boundHandlers.handleSettingsSubmit);
        modal.buttons.cancel.addEventListener('click', () => this.hide('settings'));
        modal.element.addEventListener('click', (e) => {
            if (e.target === modal.element) this.hide('settings');
        });

        // Font size slider
        if (modal.fields.fontSize) {
            modal.fields.fontSize.addEventListener('input', this.boundHandlers.handleFontSizeChange);
        }
    }

    handleFontSizeChange(e) {
        const modal = this.modals.settings;
        if (modal.fields.fontSizeValue) {
            modal.fields.fontSizeValue.textContent = e.target.value + 'px';
        }
    }

    async handleBookmarkSubmit(e) {
        e.preventDefault();
        
        const modal = this.modals.bookmark;
        const formData = {
            id: modal.fields.id.value,
            title: modal.fields.name.value.trim(),
            url: modal.fields.url.value.trim(),
            parentId: modal.fields.folder.value || null,
            isFavorite: modal.fields.favorite.checked
        };
        
        if (!this.validateBookmarkForm(formData)) return;

        try {
            if (formData.id) {
                await this.app.editBookmark(formData.id, formData);
            } else {
                await this.app.addBookmark(formData);
            }
            this.hide('bookmark');
        } catch (error) {
            this.showError('Error saving bookmark: ' + error.message);
        }
    }

    async handleFolderSubmit(e) {
        e.preventDefault();
        
        const modal = this.modals.folder;
        const name = modal.fields.name.value.trim();
        
        if (!name) {
            this.showError('Please enter a folder name');
            return;
        }

        try {
            await this.app.createFolder(name);
            this.hide('folder');
        } catch (error) {
            this.showError('Error creating folder: ' + error.message);
        }
    }

    async handleSettingsSubmit() {
        const modal = this.modals.settings;
        
        try {
            const themeInput = document.querySelector('input[name="theme"]:checked');
            const settings = {
                theme: themeInput?.value || 'dark-modern',
                fontFamily: modal.fields.fontFamily?.value || 'system',
                fontSize: parseInt(modal.fields.fontSize?.value || '16')
            };
            
            await this.app.updateSettings(settings);
            this.hide('settings');
        } catch (error) {
            this.showError('Error saving settings: ' + error.message);
        }
    }

    validateBookmarkForm(formData) {
        if (!formData.title || !formData.url) {
            this.showError('Please fill in both name and URL');
            return false;
        }

        // Basic URL validation
        try {
            new URL(formData.url);
        } catch {
            this.showError('Please enter a valid URL');
            return false;
        }

        return true;
    }

    showError(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(message);
    }

    // Modal display methods
    showBookmarkModal(isEdit = false, bookmark = {}) {
        const modal = this.modals.bookmark;
        
        modal.title.textContent = isEdit ? 'Edit Bookmark' : 'Add Bookmark';
        modal.fields.id.value = bookmark.id || '';
        modal.fields.name.value = bookmark.title || '';
        modal.fields.url.value = bookmark.url || '';
        modal.fields.folder.value = bookmark.parentId || '';
        modal.fields.favorite.checked = this.app.bookmarks?.isFavorite(bookmark.id) || false;
        
        this.populateFolderSelect();
        this.show('bookmark');
        modal.fields.name.focus();
    }

    showFolderModal() {
        this.show('folder');
        this.modals.folder.fields.name.focus();
    }

    showSettingsModal() {
        const modal = this.modals.settings;
        const settings = this.app.getCurrentSettings();
        
        // Set theme radio button
        const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        } else {
            const firstTheme = document.querySelector('input[name="theme"]');
            if (firstTheme) firstTheme.checked = true;
        }
        
        // Set other fields
        if (modal.fields.fontFamily) {
            modal.fields.fontFamily.value = settings.fontFamily;
        }
        if (modal.fields.fontSize) {
            modal.fields.fontSize.value = settings.fontSize;
        }
        if (modal.fields.fontSizeValue) {
            modal.fields.fontSizeValue.textContent = settings.fontSize + 'px';
        }
        
        this.show('settings');
    }

    populateFolderSelect() {
        const modal = this.modals.bookmark;
        const select = modal.fields.folder;
        
        select.innerHTML = '<option value="">Choose a folder...</option>';
        
        const folders = this.app.getFolders();
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.title;
            select.appendChild(option);
        });
    }

    show(modalName) {
        const modal = this.modals[modalName];
        if (modal?.element) {
            modal.element.classList.remove('hidden');
        }
    }

    hide(modalName) {
        const modal = this.modals[modalName];
        if (modal?.element) {
            modal.element.classList.add('hidden');
            if (modal.form) {
                modal.form.reset();
            }
        }
    }

    hideAll() {
        Object.keys(this.modals).forEach(modalName => this.hide(modalName));
    }

    destroy() {
        // Remove all event listeners
        const modal = this.modals.bookmark;
        if (modal?.form) {
            modal.form.removeEventListener('submit', this.boundHandlers.handleBookmarkSubmit);
        }
        
        this.hideAll();
    }
}