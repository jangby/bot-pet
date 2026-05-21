/**
 * COMMAND: !ig [link]  — Download Instagram Reels/Foto
 * COMMAND: !fb [link]  — Download video Facebook
 * COMMAND: !pin [link] — Download media Pinterest
 * COMMAND: !twit [link] — Download video Twitter/X
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * Semua menggunakan RapidAPI dengan API Key yang sama.
 * Set: process.env.RAPIDAPI_KEY
 * 
 * API yang direkomendasikan per platform:
 *   - Instagram: instagram-looter2 atau reel-download
 *   - Facebook: facebook-video-downloader4
 *   - Pinterest: pinterest-downloader-api
 *   - Twitter/X: twitter-v2 atau twitter-downloader
 * 
 * Contoh:
 *   !ig https://www.instagram.com/reel/xxxxx/
 *   !fb https://www.facebook.com/watch/?v=xxxxx
 *   !pin https://www.pinterest.com/pin/xxxxx/
 *   !twit https://twitter.com/user/status/xxxxx
 */

const axios = require('axios'); // npm install axios

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'MASUKKAN_RAPIDAPI_KEY';

// ──────────────────────────────────────────
// HELPER: Download dan kirim video
// ──────────────────────────────────────────
async function downloadDanKirim(sock, chatId, msg, urlMedia, caption) {
    const responDownload = await axios.get(urlMedia, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024 // 50MB
    });
    const bufferMedia = Buffer.from(responDownload.data);
    const contentType = responDownload.headers['content-type'] || 'video/mp4';

    if (contentType.includes('image')) {
        await sock.sendMessage(chatId, { image: bufferMedia, caption });
    } else {
        await sock.sendMessage(chatId, { video: bufferMedia, caption });
    }
}

module.exports = [
    // ─── COMMAND !ig ───
    {
        name: 'ig',
        description: 'Download Instagram Reels/Foto. Format: !ig [link]',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const urlIG = args[0];

            if (!urlIG || !urlIG.includes('instagram.com')) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\n`!ig [link Instagram]`\n\nContoh: `!ig https://www.instagram.com/reel/xxxxx/`'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '📸 Mengunduh dari Instagram...' }, { quoted: msg });

                const responAPI = await axios.get('https://instagram-looter2.p.rapidapi.com/reel', {
                    params: { link: urlIG },
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'instagram-looter2.p.rapidapi.com'
                    },
                    timeout: 30000
                });

                const urlMedia = responAPI.data?.url || responAPI.data?.video_url || responAPI.data?.[0]?.url;
                if (!urlMedia) throw new Error('URL media tidak ditemukan dalam respons API');

                await downloadDanKirim(sock, chatId, msg, urlMedia, '📸 _Instagram — Nexus Bot_');

            } catch (error) {
                console.error('[ERROR] !ig:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengunduh dari Instagram. Pastikan link publik dan API Key valid.'
                }, { quoted: msg });
            }
        }
    },

    // ─── COMMAND !fb ───
    {
        name: 'fb',
        description: 'Download video Facebook. Format: !fb [link]',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const urlFB = args[0];

            if (!urlFB || !urlFB.includes('facebook.com')) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\n`!fb [link Facebook]`\n\nContoh: `!fb https://www.facebook.com/watch/?v=xxxxx`'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '🎬 Mengunduh dari Facebook...' }, { quoted: msg });

                const responAPI = await axios.get('https://facebook-video-downloader4.p.rapidapi.com/app/main.php', {
                    params: { url: urlFB },
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'facebook-video-downloader4.p.rapidapi.com'
                    },
                    timeout: 30000
                });

                // Pilih kualitas HD jika ada, fallback ke SD
                const urlMedia = responAPI.data?.hd || responAPI.data?.sd;
                if (!urlMedia) throw new Error('URL media tidak ditemukan');

                await downloadDanKirim(sock, chatId, msg, urlMedia, '🎬 _Facebook Video — Nexus Bot_');

            } catch (error) {
                console.error('[ERROR] !fb:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengunduh dari Facebook. Pastikan video publik dan API Key valid.'
                }, { quoted: msg });
            }
        }
    },

    // ─── COMMAND !pin ───
    {
        name: 'pin',
        description: 'Download media Pinterest. Format: !pin [link]',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const urlPin = args[0];

            if (!urlPin || !urlPin.includes('pinterest.com')) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\n`!pin [link Pinterest]`\n\nContoh: `!pin https://www.pinterest.com/pin/xxxxx/`'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '📌 Mengunduh dari Pinterest...' }, { quoted: msg });

                const responAPI = await axios.get('https://pinterest-downloader-api.p.rapidapi.com/download', {
                    params: { url: urlPin },
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'pinterest-downloader-api.p.rapidapi.com'
                    },
                    timeout: 30000
                });

                const urlMedia = responAPI.data?.url || responAPI.data?.media_url;
                if (!urlMedia) throw new Error('URL media tidak ditemukan');

                await downloadDanKirim(sock, chatId, msg, urlMedia, '📌 _Pinterest — Nexus Bot_');

            } catch (error) {
                console.error('[ERROR] !pin:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengunduh dari Pinterest. Pastikan link valid dan API Key sudah dikonfigurasi.'
                }, { quoted: msg });
            }
        }
    },

    // ─── COMMAND !twit ───
    {
        name: 'twit',
        description: 'Download video Twitter/X. Format: !twit [link]',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const urlTwit = args[0];
            const isValidTwitter = urlTwit && (urlTwit.includes('twitter.com') || urlTwit.includes('x.com'));

            if (!isValidTwitter) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\n`!twit [link Twitter/X]`\n\nContoh: `!twit https://twitter.com/user/status/xxxxx`'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '🐦 Mengunduh dari Twitter/X...' }, { quoted: msg });

                const responAPI = await axios.get('https://twitter-video-and-image-downloader.p.rapidapi.com/Twitter', {
                    params: { url: urlTwit },
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'twitter-video-and-image-downloader.p.rapidapi.com'
                    },
                    timeout: 30000
                });

                // Ambil kualitas tertinggi yang tersedia
                const hasilMedia = responAPI.data;
                let urlMedia;

                if (Array.isArray(hasilMedia)) {
                    // Urutkan berdasarkan bitrate dan ambil yang tertinggi
                    const sorted = hasilMedia.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                    urlMedia = sorted[0]?.url;
                } else {
                    urlMedia = hasilMedia?.url || hasilMedia?.media?.[0]?.url;
                }

                if (!urlMedia) throw new Error('URL media tidak ditemukan');

                await downloadDanKirim(sock, chatId, msg, urlMedia, '🐦 _Twitter/X — Nexus Bot_');

            } catch (error) {
                console.error('[ERROR] !twit:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengunduh dari Twitter/X. Pastikan tweet publik dan API Key valid.'
                }, { quoted: msg });
            }
        }
    }
];
