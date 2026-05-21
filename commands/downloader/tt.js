/**
 * COMMAND: !tt [link]
 * Download video TikTok tanpa watermark.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang direkomendasikan:
 *   - TikTok API via RapidAPI (tikmateapi, tiktok-downloader, dll)
 *     → https://rapidapi.com/search/tiktok+download
 *   
 *   - savetik.net API (beberapa masih gratis)
 *   
 * Set: process.env.RAPIDAPI_KEY
 * 
 * Contoh: !tt https://www.tiktok.com/@user/video/123456789
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'tt',
    description: 'Download video TikTok tanpa watermark. Format: !tt [link]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const urlTikTok = args[0];
        if (!urlTikTok || !urlTikTok.includes('tiktok.com')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!tt [link TikTok]`\n\nContoh:\n`!tt https://www.tiktok.com/@user/video/123456`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '⬇️ Mengunduh video TikTok...' }, { quoted: msg });

            // ==========================================
            // KONFIGURASI RAPIDAPI (TikTok Downloader)
            // Daftar di https://rapidapi.com/
            // Pilih API: "TikTok Video No Watermark" atau sejenisnya
            // ==========================================
            const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'MASUKKAN_RAPIDAPI_KEY';

            const responAPI = await axios.get('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
                params: { url: urlTikTok, hd: '1' },
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
                },
                timeout: 30000
            });

            const data = responAPI.data?.data;
            if (!data || !data.play) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Gagal mendapatkan link video. Link mungkin private atau tidak valid.'
                }, { quoted: msg });
            }

            const urlVideoNoWM = data.play; // URL video tanpa watermark
            const judulVideo = data.title || 'TikTok Video';
            const pembuatVideo = data.author?.unique_id || 'Unknown';

            // Download video sebagai buffer
            const responVideo = await axios.get(urlVideoNoWM, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: 50 * 1024 * 1024 // Batas 50MB
            });

            const bufferVideo = Buffer.from(responVideo.data);

            await sock.sendMessage(chatId, {
                video: bufferVideo,
                caption: `🎵 *${judulVideo}*\n👤 @${pembuatVideo}\n\n_Downloaded via Nexus Bot • No Watermark_`
            });

        } catch (error) {
            console.error('[ERROR] !tt:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengunduh video TikTok.\n\nPastikan:\n• Link valid dan video tidak private\n• API Key RapidAPI sudah dikonfigurasi'
            }, { quoted: msg });
        }
    }
};
