/**
 * COMMAND: !ss [link]
 * Screenshot halaman website berdasarkan URL yang diberikan.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API Screenshot yang direkomendasikan (pilih salah satu):
 *   - screenshotone.com (freemium 100 req/bulan gratis): https://screenshotone.com/
 *   - htmlcsstoimage.com: https://htmlcsstoimage.com/
 *   - Atau self-hosted dengan: npm install puppeteer (berat, ~300MB)
 * 
 * Contoh: !ss https://google.com
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'ss',
    description: 'Screenshot halaman website. Format: !ss [link]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const urlTarget = args[0];

        if (!urlTarget) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!ss [URL website]`\n\nContoh: `!ss https://google.com`'
            }, { quoted: msg });
        }

        // Validasi format URL
        const isUrlValid = /^https?:\/\/.+/.test(urlTarget);
        if (!isUrlValid) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ URL tidak valid! Pastikan dimulai dengan `https://` atau `http://`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: `📸 Mengambil screenshot *${urlTarget}*...` }, { quoted: msg });

            // ==========================================
            // KONFIGURASI API SCREENSHOT
            // Daftar di https://screenshotone.com/
            // ==========================================
            const API_KEY_SS = process.env.SS_API_KEY || 'MASUKKAN_API_KEY_DISINI';

            const responAPI = await axios.get('https://api.screenshotone.com/take', {
                params: {
                    access_key: API_KEY_SS,
                    url: urlTarget,
                    viewport_width: 1280,
                    viewport_height: 800,
                    format: 'jpg',
                    image_quality: 80,
                    full_page: false,
                    delay: 2 // Tunggu 2 detik agar halaman render sempurna
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const bufferGambar = Buffer.from(responAPI.data);

            await sock.sendMessage(chatId, {
                image: bufferGambar,
                caption: `📸 *Screenshot:* ${urlTarget}`
            });

        } catch (error) {
            console.error('[ERROR] !ss:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal screenshot. Kemungkinan penyebab:\n• URL tidak bisa diakses\n• API Key belum dikonfigurasi\n• Website memblokir bot'
            }, { quoted: msg });
        }
    }
};
