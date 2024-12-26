from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
import json
from youtube_dl import YoutubeDL
import requests
import logging
import instaloader
import os
from urllib.parse import urlparse
import re
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Instagram loader
L = instaloader.Instaloader(
    download_videos=True,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False
)

def is_valid_instagram_url(url: str) -> bool:
    pattern = r'https?://(?:www\.)?instagram\.com/(?:p|reel)/[\w-]+/?'
    return bool(re.match(pattern, url))

async def download_instagram_content(url, chat_id, context):
    if not is_valid_instagram_url(url):
        raise ValueError("Invalid Instagram URL")
        
    path = urlparse(url).path
    shortcode = path.split('/')[-2]
    
    # Create base downloads directory
    base_path = os.path.join(os.getcwd(), 'downloads')
    os.makedirs(base_path, exist_ok=True)
    
    # Set specific download path
    download_path = os.path.join(base_path, shortcode)
    if os.path.exists(download_path):
        shutil.rmtree(download_path)
    os.makedirs(download_path)

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        L.dirname_pattern = download_path
        L.download_post(post, target=shortcode)

        if post.is_video:
            video_files = [f for f in os.listdir(download_path) if f.endswith('.mp4')]
            if video_files:
                with open(os.path.join(download_path, video_files[0]), 'rb') as video:
                    context.bot.send_video(
                        chat_id=chat_id,
                        video=video,
                        caption="✅ Instagram video downloaded successfully!"
                    )
        else:
            image_files = [f for f in os.listdir(download_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
            if image_files:
                for img_file in image_files:
                    with open(os.path.join(download_path, img_file), 'rb') as photo:
                        context.bot.send_photo(
                            chat_id=chat_id,
                            photo=photo,
                            caption="✅ Instagram image downloaded successfully!"
                        )
        return True
    finally:
        if os.path.exists(download_path):
            shutil.rmtree(download_path)

async def handle_webapp_data(update, context):
    try:
        data = json.loads(update.message.web_app_data.data)
        url = data['url']
        download_type = data['type']
        
        response = {
            'url': url,
            'status': 'processing'
        }
        
        if download_type == 'youtube':
            try:
                ydl_opts = {
                    'format': 'best',
                    'quiet': True
                }
                with YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    video_url = info['url']
                    await context.bot.send_video(
                        chat_id=update.effective_chat.id,
                        video=video_url,
                        caption="✅ YouTube video downloaded successfully!"
                    )
                    response['status'] = 'completed'
            except Exception as e:
                logger.error(f"YouTube download error: {str(e)}")
                response['status'] = 'failed'
                response['error'] = str(e)
        
        elif download_type == 'instagram':
            try:
                download_success = await download_instagram_content(url, update.effective_chat.id, context)
                response['status'] = 'completed' if download_success else 'failed'
            except Exception as e:
                logger.error(f"Instagram download error: {str(e)}")
                response['status'] = 'failed'
                response['error'] = str(e)
        
        # Send status back to webapp
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=json.dumps(response)
        )
        
    except Exception as e:
        logger.error(f"General error: {str(e)}")
        await update.message.reply_text(f"Error processing request: {str(e)}")

def main():
    # Update to use Application builder for async support
    application = ApplicationBuilder().token("7824250935:AAEDJ0gWhe1jsIhybpDA1cgY9IWRUPjgmps").build()
    
    # Update handler registration using new filters syntax
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    
    # Run the bot
    application.run_polling()

if __name__ == '__main__':
    main()