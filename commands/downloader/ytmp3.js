/**
 * COMMAND: !ytmp3 [link]
 * Download audio YouTube dan konversi menjadi MP3.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang direkomendasikan:
 *   - youtube-mp36 via RapidAPI: https://rapidapi.com/ytjar/api/youtube-mp36
 *   - y2mate atau zylalabs via RapidAPI
 * 
 * Set: process.env.RAPIDAPI_KEY
 * 
 * Catatan: File audio YouTube bisa besar. WhatsApp membatasi file audio ~16MB.
 * 
 * Contoh: !ytmp3 https://www.youtube.com/watch?v=dQw4w9WgXcQ
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'ytmp3',
    description: 'Download audio YouTube jadi MP3. Format: !ytmp3 [link]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const urlYT = args[0];
        const isValidYT = urlYT && (urlYT.includes('youtube.com/watch') || urlYT.includes('youtu.be/'));

        if (!isValidYT) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!ytmp3 [link YouTube]`\n\nContoh:\n• `!ytmp3 https://youtube.com/watch?v=xxxxx`\n• `!ytmp3 https://youtu.be/xxxxx`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '🎵 Mengkonversi YouTube ke MP3...\n_Mohon tunggu, proses ini bisa 30-60 detik._' }, { quoted: msg });

            // ==========================================
            // KONFIGURASI RAPIDAPI (youtube-mp36)
            // ==========================================
            const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'MASUKKAN_RAPIDAPI_KEY';

            // Langkah 1: Minta konversi ke API
            const responKonversi = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
                params: { id: urlYT }, // Bisa URL lengkap atau video ID
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
                },
                timeout: 60000
            });

            const data = responKonversi.data;

            if (data.status !== 'ok' || !data.link) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Konversi gagal. Video mungkin terlalu panjang, private, atau tidak tersedia.'
                }, { quoted: msg });
            }

            const judulMP3 = data.title || 'YouTube Audio';
            const urlMP3 = data.link;

            // Langkah 2: Download file MP3 sebagai buffer
            const responDownload = await axios.get(urlMP3, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: 16 * 1024 * 1024 // Batas 16MB (limit WhatsApp)
            });

            const bufferMP3 = Buffer.from(responDownload.data);

            // Kirim sebagai dokumen audio (agar bisa disimpan dengan nama file)
            await sock.sendMessage(chatId, {
                audio: bufferMP3,
                mimetype: 'audio/mpeg',
                fileName: `${judulMP3}.mp3`,
                ptt: false // false = tampil sebagai audio biasa (bisa diunduh), bukan voice note
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                text: `🎵 *${judulMP3}*\n_Downloaded via Nexus Bot_`
            });

        } catch (error) {
            console.error('[ERROR] !ytmp3:', error);
            if (error.response?.status === 429) {
                await sock.sendMessage(chatId, {
                    text: '⚠️ Terlalu banyak request. Coba lagi beberapa menit lagi.'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengunduh MP3. Pastikan link valid dan API Key sudah dikonfigurasi.'
                }, { quoted: msg });
            }
        }
    }
};
