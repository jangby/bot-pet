/**
 * COMMAND: !anime
 * Mengubah foto wajah menjadi gaya anime menggunakan AI.
 * 
 * Library yang dibutuhkan:
 *   npm install axios form-data
 * 
 * API yang direkomendasikan:
 *   - Waifu Diffusion API via Replicate.com: https://replicate.com/
 *     → Bayar per penggunaan (~$0.01/gambar), sangat terjangkau
 *     → Set: process.env.REPLICATE_API_KEY
 * 
 *   - AnimeGANv3 via RapidAPI: https://rapidapi.com/search/anime
 *     → Beberapa provider gratis dengan limit
 * 
 * Contoh: Kirim foto wajah lalu ketik !anime
 */

const axios = require('axios');    // npm install axios
const FormData = require('form-data'); // npm install form-data

module.exports = {
    name: 'anime',
    description: 'Ubah foto wajah jadi karakter anime via AI',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const adaGambar = pesanDikutip?.imageMessage || msg.message?.imageMessage;

        if (!adaGambar) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\nKirim foto wajah lalu ketik `!anime`, atau balas foto dengan `!anime`.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '🎌 Sedang menganimasi wajahmu...\n_Proses membutuhkan waktu 30-60 detik_' }, { quoted: msg });

            const bufferGambar = await sock.downloadMediaMessage(
                pesanDikutip ? { message: pesanDikutip, key: msg.key } : msg
            );

            // ==========================================
            // KONFIGURASI REPLICATE API
            // Daftar di https://replicate.com/
            // Model: tencentarc/photomaker-style
            // ==========================================
            const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || 'MASUKKAN_REPLICATE_API_KEY';

            // Konversi buffer ke base64 untuk dikirim ke API
            const base64Gambar = bufferGambar.toString('base64');
            const dataURI = `data:image/jpeg;base64,${base64Gambar}`;

            // Buat prediksi (request ke Replicate)
            const responBuat = await axios.post('https://api.replicate.com/v1/predictions', {
                version: 'e8d9d01e69dda4a8986f10a43e7e4c26', // ID model anime converter
                input: {
                    image: dataURI,
                    style: 'anime'
                }
            }, {
                headers: {
                    Authorization: `Token ${REPLICATE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const prediksiId = responBuat.data?.id;
            if (!prediksiId) throw new Error('Gagal membuat prediksi');

            // Polling hasil (tunggu sampai selesai)
            let hasilURL = null;
            const MAKS_COBA = 20; // Coba maksimal 20 kali (20 * 5 detik = 100 detik)

            for (let i = 0; i < MAKS_COBA; i++) {
                await new Promise(r => setTimeout(r, 5000)); // Tunggu 5 detik

                const responCek = await axios.get(`https://api.replicate.com/v1/predictions/${prediksiId}`, {
                    headers: { Authorization: `Token ${REPLICATE_API_KEY}` }
                });

                const status = responCek.data?.status;
                if (status === 'succeeded') {
                    hasilURL = responCek.data?.output?.[0] || responCek.data?.output;
                    break;
                } else if (status === 'failed') {
                    throw new Error('Proses anime gagal di server AI');
                }
            }

            if (!hasilURL) throw new Error('Timeout: AI terlalu lama memproses');

            // Download hasil gambar
            const responGambar = await axios.get(hasilURL, { responseType: 'arraybuffer' });
            const bufferHasil = Buffer.from(responGambar.data);

            await sock.sendMessage(chatId, {
                image: bufferHasil,
                caption: '🎌 *Transformasi Anime Selesai!*\n_Powered by AI Diffusion Model_'
            });

        } catch (error) {
            console.error('[ERROR] !anime:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal memproses foto. Pastikan:\n• Foto memiliki wajah yang jelas\n• API Key Replicate sudah dikonfigurasi\n• Koneksi internet stabil'
            }, { quoted: msg });
        }
    }
};
