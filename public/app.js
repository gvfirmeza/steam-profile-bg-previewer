class SteamProfilePreviewer {
    constructor() {
        this.form = document.getElementById('previewForm');
        this.profileUrlInput = document.getElementById('profileUrl');
        this.searchInput = document.getElementById('searchInput');
        this.previewBtn = document.getElementById('btnPreview');
        this.randomBtn = document.getElementById('btnRandom');
        this.resetBtn = document.getElementById('btnReset');
        this.iframe = document.getElementById('previewFrame');
        this.placeholder = document.getElementById('placeholder');
        this.skeleton = document.getElementById('skeleton');
        this.toastContainer = document.getElementById('toast');
        this.liveRegion = document.getElementById('liveRegion');
        this.bgGallery = document.getElementById('bgGallery');
        this.galleryToggle = document.getElementById('galleryToggle');

        this.selectedBgUrl = null;
        this.selectedBgStoreUrl = null;
        this.backgrounds = [];
        this.filteredBackgrounds = [];

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handlePreview(e));
        this.resetBtn.addEventListener('click', () => this.resetBg());
        this.randomBtn.addEventListener('click', () => this.selectRandomBackground());
        this.galleryToggle.addEventListener('click', () => this.toggleGallery());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        this.profileUrlInput.addEventListener('blur', () => {
            if (this.profileUrlInput.value.trim() && this.selectedBgUrl) {
                this.handlePreview(new Event('submit'));
            }
        });

        this.loadSavedData();
        this.loadBackgrounds();

        setTimeout(() => {
            this.bgGallery.classList.add('expanded');
            this.galleryToggle.classList.add('expanded');
        }, 100);
    }

    toggleGallery() {
        const isExpanded = this.bgGallery.classList.contains('expanded');

        if (isExpanded) {
            this.bgGallery.classList.remove('expanded');
            this.galleryToggle.classList.remove('expanded');
        } else {
            this.bgGallery.classList.add('expanded');
            this.galleryToggle.classList.add('expanded');
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredBackgrounds = [...this.backgrounds];
        } else {
            this.filteredBackgrounds = this.backgrounds.filter(bg => {
                const titleMatch = bg.title.toLowerCase().includes(searchTerm);
                const gameMatch = bg.game.toLowerCase().includes(searchTerm);
                return titleMatch || gameMatch;
            });
        }

        this.renderBackgroundGallery();
    }

    async loadBackgrounds() {
        try {
            const response = await fetch('/steam_backgrounds.json');
            if (!response.ok) throw new Error('Failed to load backgrounds');

            this.backgrounds = await response.json();
            this.filteredBackgrounds = [...this.backgrounds];
            this.renderBackgroundGallery();
        } catch (error) {
            console.error('Error loading backgrounds:', error);
            this.bgGallery.innerHTML = '<div class="gallery-loading">Failed to load backgrounds</div>';
        }
    }

    renderBackgroundGallery() {
        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'gallery-grid';

        if (this.filteredBackgrounds.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-loading">No backgrounds found</div>';
        } else {
            this.filteredBackgrounds.forEach((bg, index) => {
                const thumb = this.createBackgroundThumbnail(bg, index);
                galleryGrid.appendChild(thumb);
            });
        }

        this.bgGallery.innerHTML = '';
        this.bgGallery.appendChild(galleryGrid);

        if (this.selectedBgUrl) {
            const selected = this.bgGallery.querySelector(`[data-bg-url="${this.selectedBgUrl}"]`);
            if (selected) {
                selected.classList.add('selected');
            }
        }
    }

    createBackgroundThumbnail(bg, index) {
        const thumb = document.createElement('div');
        thumb.className = 'bg-thumb loading';
        thumb.setAttribute('data-bg-url', bg.img);
        thumb.setAttribute('data-store-url', bg.url);
        thumb.setAttribute('title', `${bg.title} - ${bg.game}`);

        const img = document.createElement('img');
        img.onload = () => {
            thumb.classList.remove('loading');
        };
        img.onerror = () => {
            thumb.classList.remove('loading');
            thumb.classList.add('error');
        };
        img.src = bg.img;
        img.alt = `${bg.title} - ${bg.game}`;

        const overlay = document.createElement('div');
        overlay.className = 'thumb-overlay';
        overlay.innerHTML = `
            <div class="bg-info">
                <div class="bg-title">${bg.title}</div>
                <div class="bg-game">${bg.game}</div>
            </div>
            <div class="overlay-actions">
                <button class="overlay-btn store-btn" onclick="event.stopPropagation(); window.open('${bg.url}', '_blank')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v8m-4-4h8"/>
                    </svg>
                    Store
                </button>
            </div>
        `;

        thumb.appendChild(img);
        thumb.appendChild(overlay);

        thumb.addEventListener('click', (e) => {
            if (!e.target.closest('.store-btn')) {
                this.selectBackground(bg.img, bg.url, thumb);
            }
        });

        return thumb;
    }

    selectBackground(bgUrl, storeUrl, thumbElement) {
        this.bgGallery.querySelectorAll('.bg-thumb.selected').forEach(thumb => {
            thumb.classList.remove('selected');
        });

        thumbElement.classList.add('selected');

        this.selectedBgUrl = bgUrl;
        this.selectedBgStoreUrl = storeUrl;

        if (this.profileUrlInput.value.trim()) {
            this.handlePreview(new Event('submit'));
        } else {
            this.showToast('Select a Steam profile URL to preview', 'info');
        }
    }

    selectRandomBackground() {
        if (this.filteredBackgrounds.length === 0) {
            this.showToast('No backgrounds available', 'error');
            return;
        }

        const randomIndex = Math.floor(Math.random() * this.filteredBackgrounds.length);
        const randomBg = this.filteredBackgrounds[randomIndex];

        const thumbs = this.bgGallery.querySelectorAll('.bg-thumb');
        const matchingThumb = Array.from(thumbs).find(thumb =>
            thumb.getAttribute('data-bg-url') === randomBg.img
        );

        if (matchingThumb) {
            matchingThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.selectBackground(randomBg.img, randomBg.url, matchingThumb);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.previewBtn.disabled = true;
            this.previewBtn.querySelector('span').textContent = 'Loading...';
            this.resetBtn.disabled = true;
            this.randomBtn.disabled = true;
            this.showSkeleton();
            if (this.liveRegion) this.liveRegion.textContent = 'Loading profile preview...';
        } else {
            this.previewBtn.disabled = false;
            this.previewBtn.querySelector('span').textContent = 'Preview';
            this.resetBtn.disabled = false;
            this.randomBtn.disabled = false;
            this.hideSkeleton();
        }
    }

    showSkeleton() {
        this.placeholder.style.display = 'none';
        this.skeleton.style.display = 'block';
        this.iframe.style.display = 'none';
    }

    hideSkeleton() {
        this.skeleton.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);
        if (this.liveRegion) this.liveRegion.textContent = message;

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    async handlePreview(e) {
        e.preventDefault();

        const profileUrl = this.profileUrlInput.value.trim();
        const bgUrl = this.selectedBgUrl;

        if (!profileUrl) {
            this.showToast('Please enter a Steam profile URL', 'error');
            return;
        }

        if (!bgUrl) {
            this.showToast('Please select a background from the gallery', 'error');
            return;
        }

        try {
            const url = new URL(profileUrl);
            if (url.hostname !== 'steamcommunity.com') {
                this.showToast('Please enter a valid steamcommunity.com URL', 'error');
                return;
            }
        } catch {
            this.showToast('Please enter a valid Steam profile URL', 'error');
            return;
        }

        this.saveData();
        await this.preview(profileUrl, bgUrl);
    }

    async preview(profileUrl, bgUrl) {
        try {
            this.setLoading(true);
            this.showToast('Fetching Steam profile...', 'info');

            const response = await fetch(`/fetch?url=${encodeURIComponent(profileUrl)}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const html = await response.text();
            this.displayInIframe(html, bgUrl);

            this.showToast('Profile loaded successfully!', 'success');
            this.resetBtn.disabled = false;

        } catch (error) {
            console.error('Preview error:', error);
            this.showToast(`Error: ${error.message}`, 'error');
            this.placeholder.style.display = 'flex';
        } finally {
            this.setLoading(false);
        }
    }

    displayInIframe(html, bgUrl) {
        const backgroundScript = this.createBackgroundScript();

        const iframeContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <base href="https://steamcommunity.com/">
                <style>
                    body { margin: 0; padding: 0; }
                    html, body { overflow-x: auto; }
                </style>
            </head>
            <body>
                ${html}
                <script>
                    ${backgroundScript}
                    
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            setBg('${bgUrl.replace(/'/g, "\\'")}');
                        }, 500);
                    });
                    
                    setTimeout(function() {
                        setBg('${bgUrl.replace(/'/g, "\\'")}');
                    }, 100);
                </script>
            </body>
            </html>`;

        this.iframe.srcdoc = iframeContent;
        this.iframe.style.display = 'block';
        this.placeholder.style.display = 'none';
    }

    createBackgroundScript() {
        return `
            function setBg(url) {
                console.log('Setting background to:', url);
                
                const el = document.querySelector('div.no_header.profile_page.has_profile_background')
                    || document.querySelector('.profile_page.has_profile_background')
                    || document.querySelector('.profile_page');

                if (!el) {
                    console.error('Elemento não encontrado no iframe');
                    return null;
                }

                const styleAttr = el.getAttribute('style') || '';
                
                const re = /background-image\\s*:\\s*url\\(\\s*['"]?([^'")]+)['"]?\\s*\\)/i;

                if (re.test(styleAttr)) {
                    const newStyle = styleAttr.replace(re, 'background-image: url("' + url + '")');
                    el.setAttribute('style', newStyle);
                    console.log('Substituído style inline:', newStyle);
                } else {
                    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
                    el.style.setProperty('background-size', 'cover', 'important');
                    el.style.setProperty('background-position', 'center', 'important');
                    el.style.setProperty('background-repeat', 'no-repeat', 'important');
                    console.log('Aplicado via style.setProperty !important');
                }
                
                return el;
            }

            function resetBg() {
                console.log('Resetting background');
                
                const el = document.querySelector('div.no_header.profile_page.has_profile_background')
                    || document.querySelector('.profile_page.has_profile_background')
                    || document.querySelector('.profile_page')
                    || document.body;

                if (el) {
                    const styleAttr = el.getAttribute('style') || '';
                    const re = /background-image\\s*:\\s*url\\([^)]*\\)/i;
                    
                    if (re.test(styleAttr)) {
                        const newStyle = styleAttr.replace(re, '').replace(/;\\s*;/g, ';').replace(/^;|;$/g, '');
                        if (newStyle.trim()) {
                            el.setAttribute('style', newStyle);
                        } else {
                            el.removeAttribute('style');
                        }
                    } else {
                        el.style.removeProperty('background-image');
                        el.style.removeProperty('background-size');
                        el.style.removeProperty('background-position');
                        el.style.removeProperty('background-repeat');
                    }
                    console.log('Background reset');
                }
            }

            window.setBg = setBg;
            window.resetBg = resetBg;
            
            window.addEventListener('message', function(e){
                if(!e || !e.data) return;
                if(e.data.type === 'resetBg') resetBg();
            });
        `;
    }

    resetBg() {
        try {
            if (this.iframe.contentWindow) {
                this.iframe.contentWindow.postMessage({ type: 'resetBg' }, '*');
                this.showToast('Background reset!', 'success');
            } else {
                throw new Error('Cannot access iframe');
            }
        } catch (error) {
            console.error('Reset error:', error);
            this.showToast('Error resetting background', 'error');
        }
    }

    saveData() {
        localStorage.setItem('steam-profile-url', this.profileUrlInput.value);
        localStorage.setItem('steam-bg-url', this.selectedBgUrl || '');
        localStorage.setItem('steam-bg-store-url', this.selectedBgStoreUrl || '');
        localStorage.setItem('steam-gallery-expanded', 'true');
    }

    loadSavedData() {
        const savedProfile = localStorage.getItem('steam-profile-url');
        const savedBg = localStorage.getItem('steam-bg-url');
        const savedStoreUrl = localStorage.getItem('steam-bg-store-url');

        if (savedProfile) this.profileUrlInput.value = savedProfile;
        if (savedBg) {
            this.selectedBgUrl = savedBg;
            this.selectedBgStoreUrl = savedStoreUrl;

            setTimeout(() => {
                const thumbs = this.bgGallery.querySelectorAll('.bg-thumb');
                thumbs.forEach(thumb => {
                    if (thumb.getAttribute('data-bg-url') === savedBg) {
                        thumb.classList.add('selected');
                    }
                });
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SteamProfilePreviewer();
});