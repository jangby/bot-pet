/**
 * COMMAND: !rembg
 * Menghapus background gambar menggunakan AI.
 * 
 * COMMAND: !stickerbg
 * Mengubah gambar menjadi stiker tanpa background.
 * 
 * Library yang dibutuhkan:
 *   npm install axios form-data
 * 
 * API yang direkomendasikan:
 *   - Remove.bg (50 free credits/bulan): https://www.remove.bg/api
 *     → Set: process.env.REMOVEBG_API_KEY
 * 
 *   - PhotoRoom API: https://www.photoroom.com/api
 * 
 * Contoh:
 *   Kirim gambar + ketik !rembg
 *   Kirim gambar + ketik !stickerbg
 */

const axios = require('axios');   // npm install axios
const FormData = require('form-data'); // npm install form-data

// ==========================================
// KONFIGURASI REMOVE.BG API
// ==========================================
const API_KEY_REMBG = process.env.REMOVEBG_API_KEY || 'MASUKKAN_REMOVEBG_API_KEY';

async function hapusBackground(bufferGambar) {
    const form = new FormData();
    form.append('image_file', bufferGambar, { filename: 'image.jpg', contentType: 'image/jpeg' });
    form.append('size', 'auto');

    const respon = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
        headers: {
            ...form.getHeaders(),
            'X-Api-Key': API_KEY_REMBG
        },
        responseType: 'arraybuffer',
        timeout: 45000
    });

    return Buffer.from(respon.data); // Buffer PNG tanpa background (transparan)
}

module.exports = [
    // ─── COMMAND !rembg ───
    {
        name: 'rembg',
        description: 'Hapus background gambar via AI. Balas/kirim gambar + !rembg',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const adaGambar = pesanDikutip?.imageMessage || msg.message?.imageMessage;

            if (!adaGambar) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\nKirim gambar lalu ketik `!rembg`, atau balas gambar dengan `!rembg`.'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '✂️ Sedang menghapus background...' }, { quoted: msg });

                const bufferGambar = await sock.downloadMediaMessage(
                    pesanDikutip ? { message: pesanDikutip, key: msg.key } : msg
                );
                const bufferHasil = await hapusBackground(bufferGambar);

                await sock.sendMessage(chatId, {
                    image: bufferHasil,
                    caption: '✅ *Background berhasil dihapus!*\n_Powered by Remove.bg AI_'
                });

            } catch (error) {
                console.error('[ERROR] !rembg:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal menghapus background. Cek API Key Remove.bg atau coba dengan gambar lain.'
                }, { quoted: msg });
            }
        }
    },

    // ─── COMMAND !stickerbg ───
    {
        name: 'stickerbg',
        description: 'Ubah gambar jadi stiker tanpa background. Kirim gambar + !stickerbg',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const adaGambar = pesanDikutip?.imageMessage || msg.message?.imageMessage;

            if (!adaGambar) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\nKirim gambar lalu ketik `!stickerbg`, atau balas gambar dengan `!stickerbg`.'
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '✨ Membuat stiker tanpa background...' }, { quoted: msg });

                const bufferGambar = await sock.downloadMediaMessage(
                    pesanDikutip ? { message: pesanDikutip, key: msg.key } : msg
                );

                // Hapus background terlebih dahulu, lalu kirim sebagai stiker
                const bufferTanpaBg = await hapusBackground(bufferGambar);

                // Kirim sebagai stiker (Baileys otomatis konversi PNG transparan ke WebP stiker)
                await sock.sendMessage(chatId, {
                    sticker: bufferTanpaBg
                });

            } catch (error) {
                console.error('[ERROR] !stickerbg:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal membuat stiker. Cek API Key Remove.bg atau coba dengan gambar lain.'
                }, { quoted: msg });
            }
        }
    }
];
