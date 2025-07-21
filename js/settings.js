// Settings management module
export class SettingsManager {
    constructor() {
        this.current = {
            theme: 'dark-modern',
            fontFamily: 'system',
            fontSize: 16
        };
    }

    async load() {
        try {
            const result = await chrome.storage.local.get(['userSettings']);
            this.current = { ...this.current, ...result.userSettings };
            this.apply(this.current);
            return this.current;
        } catch (error) {
            console.error('Error loading settings:', error);
            this.apply(this.current);
            return this.current;
        }
    }

    async save(settings) {
        try {
            this.current = { ...this.current, ...settings };
            await chrome.storage.local.set({ userSettings: this.current });
            this.apply(this.current);
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    apply(settings) {
        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);
        
        // Apply font family
        const fontFamily = this.getFontFamily(settings.fontFamily);
        document.documentElement.style.setProperty('--font-family', fontFamily);
        document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
        
        // Load Google Font if needed
        if (settings.fontFamily !== 'system') {
            this.loadGoogleFont(settings.fontFamily);
        }
    }

    getFontFamily(fontKey) {
        const fontFamilies = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'poppins': '"Poppins", sans-serif',
            'inter': '"Inter", sans-serif',
            'roboto': '"Roboto", sans-serif',
            'open-sans': '"Open Sans", sans-serif',
            'source-sans': '"Source Sans Pro", sans-serif',
            'lato': '"Lato", sans-serif'
        };
        
        return fontFamilies[fontKey] || fontFamilies.system;
    }

    loadGoogleFont(fontFamily) {
        const fontUrls = {
            'poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
            'inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            'roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
            'open-sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap',
            'source-sans': 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap',
            'lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap'
        };
        
        const fontUrl = fontUrls[fontFamily];
        if (fontUrl && !document.querySelector(`link[href="${fontUrl}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontUrl;
            document.head.appendChild(link);
        }
    }
}