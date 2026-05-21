/**
 * COMMAND: !toimg
 * Mengubah stiker WhatsApp menjadi gambar biasa (PNG).
 * 
 * Library yang dibutuhkan:
 *   npm install sharp
 *   (sharp digunakan untuk konversi WebP stiker ke PNG)
 */

// CATATAN: 'sharp' di-require secara lazy di dalam execute()
// agar bot tidak crash saat library belum terinstall.

module.exports = {
    name: 'toimg',
    description: 'Ubah stiker jadi gambar biasa (PNG)',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Ambil pesan yang di-reply
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const adaStiker = pesanDikutip?.stickerMessage || msg.message?.stickerMessage;

        if (!adaStiker) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\nBalas sebuah stiker dengan mengetik `!toimg`.'
            }, { quoted: msg });
        }

        try {
            // Lazy require sharp — hanya di-load saat !toimg digunakan
            let sharp;
            try { sharp = require('sharp'); }
            catch { return await sock.sendMessage(chatId, { text: '❌ Library `sharp` belum terinstall!\nJalankan: `npm install sharp`' }, { quoted: msg }); }

            await sock.sendMessage(chatId, { text: '⏳ Mengkonversi stiker...' }, { quoted: msg });

            // Download stiker sebagai buffer (format WebP)
            const bufferWebP = await sock.downloadMediaMessage(
                pesanDikutip
                    ? { message: pesanDikutip, key: msg.key }
                    : msg
            );

            // Konversi WebP → PNG menggunakan sharp
            const bufferPNG = await sharp(bufferWebP).png().toBuffer();

            // Kirim sebagai gambar biasa
            await sock.sendMessage(chatId, {
                image: bufferPNG,
                caption: '✅ Stiker berhasil diubah jadi gambar!'
            });

        } catch (error) {
            console.error('[ERROR] !toimg:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengkonversi stiker. Pastikan kamu me-reply pesan stiker dengan benar.'
            }, { quoted: msg });
        }
    }
};
