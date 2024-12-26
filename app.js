const tg = window.Telegram.WebApp;
tg.expand();

class DownloadManager {
    constructor() {
        this.downloads = [];
        this.init();
    }

    init() {
        this.linkInput = document.getElementById('linkInput');
        this.taskList = document.getElementById('taskList');
        this.taskStatus = document.getElementById('taskStatus');
        
        document.getElementById('youtubeBtn').addEventListener('click', () => 
            this.startDownload('youtube'));
        document.getElementById('instagramBtn').addEventListener('click', () => 
            this.startDownload('instagram'));
            
        // Listen for bot responses
        tg.onEvent('message', (message) => this.handleBotResponse(message));
    }

    startDownload(platform) {
        const url = this.linkInput.value.trim();
        if (!url) return;

        const download = {
            id: Date.now(),
            platform,
            url,
            status: 'pending'
        };

        this.downloads.push(download);
        this.updateUI();
        this.sendToBot(platform, url);
        this.linkInput.value = '';
    }

    sendToBot(type, url) {
        tg.sendData(JSON.stringify({ type, url }));
    }

    handleBotResponse(message) {
        try {
            const response = JSON.parse(message);
            const download = this.downloads.find(d => d.url === response.url);
            if (download) {
                download.status = response.status;
                if (response.error) {
                    download.error = response.error;
                }
            }
        } catch (e) {
            console.error('Invalid bot response:', e);
        }
        this.updateUI();
    }

    updateUI() {
        this.taskList.innerHTML = this.downloads.map(download => `
            <div class="task-item ${download.status}">
                <div>${download.platform}: ${download.url}</div>
                <div>Status: ${download.status}</div>
                ${download.error ? `<div class="error">${download.error}</div>` : ''}
            </div>
        `).join('');
    }
}

// Initialize the app
const downloadManager = new DownloadManager();