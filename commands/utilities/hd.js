/**
 * COMMAND: !hd
 * Meningkatkan kualitas gambar (upscale) menggunakan AI Upscaler API.
 * 
 * Library yang dibutuhkan:
 *   npm install axios form-data
 * 
 * API yang direkomendasikan (pilih salah satu):
 *   - waifu2x (gratis, untuk anime/gambar): https://waifu2x.udp.jp/
 *   - Deep-image.ai (freemium): https://deep-image.ai/
 *   - RapidAPI AI Image Upscaler: https://rapidapi.com/search/image+upscaler
 * 
 * Atur API_KEY_HD di config.js atau process.env.HD_API_KEY
 */

const axios = require('axios'); // npm install axios
const FormData = require('form-data'); // npm install form-data

module.exports = {
    name: 'hd',
    description: 'Tingkatkan kualitas gambar via AI Upscaler',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Ambil gambar dari reply atau gambar langsung
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const adaGambar = pesanDikutip?.imageMessage || msg.message?.imageMessage;

        if (!adaGambar) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\nKirim gambar lalu ketik `!hd`, atau balas gambar dengan `!hd`.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '⏳ Sedang memproses HD... Mohon tunggu sebentar.' }, { quoted: msg });

            // Download gambar asli sebagai buffer
            const bufferGambar = await sock.downloadMediaMessage(
                pesanDikutip
                    ? { message: pesanDikutip, key: msg.key }
                    : msg
            );

            // ==========================================
            // KONFIGURASI API HD UPSCALER
            // Ganti dengan API yang kamu pilih.
            // Contoh menggunakan deep-image.ai:
            // ==========================================
            const API_KEY_HD = process.env.HD_API_KEY || 'MASUKKAN_API_KEY_DISINI';

            const formData = new FormData();
            formData.append('image', bufferGambar, { filename: 'image.jpg', contentType: 'image/jpeg' });

            const responAPI = await axios.post('https://deep-image.ai/rest_api/process_result', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'x-api-key': API_KEY_HD
                },
                responseType: 'arraybuffer', // Terima hasil sebagai buffer gambar
                timeout: 60000 // 60 detik timeout
            });

            const bufferHasil = Buffer.from(responAPI.data);

            await sock.sendMessage(chatId, {
                image: bufferHasil,
                caption: '✅ *Gambar berhasil di-HD-kan!*\n_Kualitas ditingkatkan menggunakan AI Upscaler._'
            });

        } catch (error) {
            console.error('[ERROR] !hd:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal meningkatkan kualitas gambar. Cek koneksi atau API Key HD kamu.'
            }, { quoted: msg });
        }
    }
};
