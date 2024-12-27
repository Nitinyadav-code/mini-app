const tg = window.Telegram.WebApp;


 

// Add initialization check
if (!tg) {
    console.error('Telegram WebApp is not properly initialized');
    alert('Error: Telegram WebApp not initialized');
}

tg.expand();

class DownloadManager {
    constructor() {
        this.downloads = [];
        this.init();
    }

    init() {
        // Add error handling for GitHub Pages
        try {

            this.linkInput = document.getElementById('linkInput');
            this.taskList = document.getElementById('taskList');
            this.taskStatus = document.getElementById('taskStatus');

            show_8702730().then(() => {

                document.getElementById('youtubeBtn').addEventListener('click', () => 
                    this.startDownload('youtube'));
                document.getElementById('instagramBtn').addEventListener('click', () => 
                    this.startDownload('instagram'));
                // You need to add your user reward function here, which will be executed after the user watches the ad.
                // For more details, please refer to the detailed instructions.
                alert('You have seen ad ad!');
            })
            
           
                
            // Listen for bot responses
            tg.onEvent('message', (message) => this.handleBotResponse(message));
        } catch (e) {
            console.error('Initialization error:', e);
        }
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
        const data = { type, url };
        console.log('Sending data to bot:', data);
        try {
            tg.sendData(JSON.stringify(data));
            console.log('Data sent successfully');
        } catch (error) {
            console.error('Error sending data:', error);
            this.showError('Failed to send request to bot');
        }
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

    showError(message) {
        this.taskStatus.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize with error handling
try {
    const downloadManager = new DownloadManager();
    console.log('Download manager initialized');
} catch (error) {
    console.error('Failed to initialize download manager:', error);
}