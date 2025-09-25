class SteamProfilePreviewer {
    constructor() {
        this.form = document.getElementById('previewForm');
        this.profileUrlInput = document.getElementById('profileUrl');
        this.bgUrlInput = document.getElementById('bgUrl');
        this.previewBtn = document.getElementById('btnPreview');
        this.resetBtn = document.getElementById('btnReset');
        this.iframe = document.getElementById('previewFrame');
        this.placeholder = document.getElementById('placeholder');
        this.skeleton = document.getElementById('skeleton');
        this.zoomRange = document.getElementById('zoomRange');
        this.zoomValue = document.getElementById('zoomValue');
        this.toastContainer = document.getElementById('toast');
        this.liveRegion = document.getElementById('liveRegion');
        this.bgGallery = document.getElementById('bgGallery');
        this.galleryToggle = document.getElementById('galleryToggle');
        
        this.selectedBgUrl = null;
        this.backgrounds = [];
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handlePreview(e));
        this.resetBtn.addEventListener('click', () => this.resetBg());
        this.zoomRange.addEventListener('input', (e) => this.setScale(parseInt(e.target.value)));
        this.galleryToggle.addEventListener('click', () => this.toggleGallery());
        
        this.setupCopyButtons();
        this.loadSavedData();
        this.loadBackgrounds();
    }

    setupCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const input = index === 0 ? this.profileUrlInput : this.bgUrlInput;
                if (input.value) {
                    navigator.clipboard.writeText(input.value).then(() => {
                        this.showToast('URL copied to clipboard!', 'success');
                    }).catch(() => {
                        this.showToast('Failed to copy URL', 'error');
                    });
                }
            });
        });
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

    async loadBackgrounds() {
        try {
            const response = await fetch('/steam_backgrounds.json');
            if (!response.ok) throw new Error('Failed to load backgrounds');
            
            this.backgrounds = await response.json();
            this.renderBackgroundGallery();
        } catch (error) {
            console.error('Error loading backgrounds:', error);
            this.bgGallery.innerHTML = '<div class="gallery-loading">Failed to load backgrounds</div>';
        }
    }

    renderBackgroundGallery() {
        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'gallery-grid';
        
        this.backgrounds.forEach((bgUrl, index) => {
            const thumb = this.createBackgroundThumbnail(bgUrl, index);
            galleryGrid.appendChild(thumb);
        });
        
        this.bgGallery.innerHTML = '';
        this.bgGallery.appendChild(galleryGrid);
    }

    createBackgroundThumbnail(bgUrl, index) {
        const thumb = document.createElement('div');
        thumb.className = 'bg-thumb loading';
        thumb.setAttribute('data-bg-url', bgUrl);
        thumb.setAttribute('title', `Background ${index + 1}`);
        
        const img = document.createElement('img');
        img.onload = () => {
            thumb.classList.remove('loading');
        };
        img.onerror = () => {
            thumb.classList.remove('loading');
            thumb.classList.add('error');
        };
        img.src = bgUrl;
        img.alt = `Background ${index + 1}`;
        
        const overlay = document.createElement('div');
        overlay.className = 'thumb-overlay';
        overlay.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h6v6"></path>
                <path d="M10 14 21 3"></path>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
        `;
        
        thumb.appendChild(img);
        thumb.appendChild(overlay);
        
        thumb.addEventListener('click', () => this.selectBackground(bgUrl, thumb));
        
        return thumb;
    }

    selectBackground(bgUrl, thumbElement) {
        // Remove selection from other thumbnails
        this.bgGallery.querySelectorAll('.bg-thumb.selected').forEach(thumb => {
            thumb.classList.remove('selected');
        });
        
        // Select current thumbnail
        thumbElement.classList.add('selected');
        
        // Update input and selected URL
        this.bgUrlInput.value = bgUrl;
        this.selectedBgUrl = bgUrl;
        
        this.showToast('Background selected!', 'success');
    }

    setLoading(loading) {
        if (loading) {
            this.previewBtn.disabled = true;
            this.previewBtn.querySelector('span').textContent = 'Loading...';
            this.resetBtn.disabled = true;
            this.showSkeleton();
            if (this.liveRegion) this.liveRegion.textContent = 'Loading profile preview...';
        } else {
            this.previewBtn.disabled = false;
            this.previewBtn.querySelector('span').textContent = 'Preview';
            this.resetBtn.disabled = false;
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

    setScale(percent) {
        const scale = percent / 100;
        this.iframe.style.transform = `scale(${scale})`;
        this.zoomValue.textContent = `${percent}%`;
        localStorage.setItem('steam-zoom', percent.toString());
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
        const bgUrl = this.bgUrlInput.value.trim();
        
        if (!profileUrl || !bgUrl) {
            this.showToast('Please fill in both URLs', 'error');
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

        try {
            const bgUrlObj = new URL(bgUrl);
            if (!bgUrlObj.protocol.startsWith('http')) {
                this.showToast('Background URL must use HTTP or HTTPS', 'error');
                return;
            }
        } catch {
            this.showToast('Please enter a valid background image URL', 'error');
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
            </html>
        `;

        this.iframe.srcdoc = iframeContent;
        this.iframe.style.display = 'block';
        this.placeholder.style.display = 'none';
        
        const currentZoom = parseInt(this.zoomRange.value);
        this.setScale(currentZoom);
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

                try {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch (e) {}
                
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
        localStorage.setItem('steam-bg-url', this.bgUrlInput.value);
        localStorage.setItem('steam-zoom', this.zoomRange.value);
        
        // Save gallery state
        const isGalleryExpanded = this.bgGallery.classList.contains('expanded');
        localStorage.setItem('steam-gallery-expanded', isGalleryExpanded.toString());
    }

    loadSavedData() {
        const savedProfile = localStorage.getItem('steam-profile-url');
        const savedBg = localStorage.getItem('steam-bg-url');
        const savedZoom = localStorage.getItem('steam-zoom');
        const galleryExpanded = localStorage.getItem('steam-gallery-expanded') === 'true';
        
        if (savedProfile) this.profileUrlInput.value = savedProfile;
        if (savedBg) {
            this.bgUrlInput.value = savedBg;
            this.selectedBgUrl = savedBg;
        }
        if (savedZoom) {
            this.zoomRange.value = savedZoom;
            this.setScale(parseInt(savedZoom));
        }
        if (galleryExpanded) {
            setTimeout(() => {
                this.bgGallery.classList.add('expanded');
                this.galleryToggle.classList.add('expanded');
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SteamProfilePreviewer();
});