/**
 * COMMAND: !nulis [teks]
 * Mengubah teks menjadi gambar tulisan tangan (handwritten style).
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang direkomendasikan:
 *   - Handwriting.io API: https://handwriting.io/
 *   - Atau gunakan Canvas + Google Font handwriting (lihat alternatif di bawah)
 * 
 * Daftar API key: https://handwriting.io/account/
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'nulis',
    description: 'Ubah teks jadi gambar tulisan tangan',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Ambil teks dari argumen perintah
        const teksTulis = args.join(' ').trim();

        if (!teksTulis) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!nulis [teks yang ingin ditulis]`\n\nContoh: `!nulis Aku Cinta Kamu ❤️`'
            }, { quoted: msg });
        }

        if (teksTulis.length > 200) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Teks terlalu panjang! Maksimal 200 karakter.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '✍️ Sedang menulis...' }, { quoted: msg });

            // ==========================================
            // KONFIGURASI API HANDWRITING.IO
            // Daftar di https://handwriting.io/ untuk API key
            // ==========================================
            const API_KEY_NULIS = process.env.HANDWRITING_API_KEY || 'KEY_DISINI';
            const API_SECRET_NULIS = process.env.HANDWRITING_API_SECRET || 'SECRET_DISINI';

            const responAPI = await axios.get('https://api.handwriting.io/render/png', {
                params: {
                    handwriting_id: '2B9B6F38B01EFCD9', // Ganti dengan ID font tulisan tangan yang diinginkan
                    text: teksTulis,
                    width: '1000px',
                    height: 'auto',
                    line_spacing: '1.5em',
                    font_size: '25px',
                    ink_color: '#1a1a2e' // Warna tinta (biru tua seperti pulpen)
                },
                auth: {
                    username: API_KEY_NULIS,
                    password: API_SECRET_NULIS
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const bufferGambar = Buffer.from(responAPI.data);

            await sock.sendMessage(chatId, {
                image: bufferGambar,
                caption: `✍️ *"${teksTulis}"*\n\n_— ditulis dengan tangan oleh Nexus Bot_`
            });

        } catch (error) {
            console.error('[ERROR] !nulis:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuat gambar tulisan tangan. Cek API Key Handwriting.io kamu.'
            }, { quoted: msg });
        }
    }
};
