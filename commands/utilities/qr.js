/**
 * COMMAND: !qr [teks/link]
 * Mengubah teks atau link menjadi gambar QR Code.
 * 
 * Library yang dibutuhkan:
 *   npm install qrcode
 *   (qrcode adalah library node.js yang bisa generate QR langsung tanpa API eksternal)
 * 
 * Contoh:
 *   !qr https://google.com
 *   !qr Ini adalah teks rahasia
 */

// CATATAN: 'qrcode' di-require secara lazy di dalam execute()
// agar bot tidak crash saat library belum terinstall.

module.exports = {
    name: 'qr',
    description: 'Ubah teks/link jadi gambar QR Code',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const teksQR = args.join(' ').trim();

        if (!teksQR) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!qr [teks atau link]`\n\nContoh:\n• `!qr https://google.com`\n• `!qr Pesan rahasia ini`'
            }, { quoted: msg });
        }

        if (teksQR.length > 500) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Teks terlalu panjang! Maksimal 500 karakter untuk QR Code.'
            }, { quoted: msg });
        }

        try {
            // Lazy require qrcode — hanya di-load saat !qr digunakan
            let QRCode;
            try { QRCode = require('qrcode'); }
            catch { return await sock.sendMessage(chatId, { text: '❌ Library `qrcode` belum terinstall!\nJalankan: `npm install qrcode`' }, { quoted: msg }); }

            // Generate QR Code langsung sebagai Buffer PNG (tanpa API eksternal!)
            const bufferQR = await QRCode.toBuffer(teksQR, {
                type: 'png',
                width: 512,          // Ukuran 512x512 pixel
                margin: 2,           // Margin tepi
                color: {
                    dark: '#1a1a2e',  // Warna modul QR (biru tua)
                    light: '#ffffff' // Warna latar belakang
                },
                errorCorrectionLevel: 'H' // Level koreksi tinggi (lebih tahan banting)
            });

            await sock.sendMessage(chatId, {
                image: bufferQR,
                caption: `🔲 *QR Code Berhasil Dibuat!*\n\n📝 Isi: _${teksQR.length > 50 ? teksQR.substring(0, 50) + '...' : teksQR}_`
            });

        } catch (error) {
            console.error('[ERROR] !qr:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuat QR Code. Pastikan library `qrcode` sudah terinstall:\n`npm install qrcode`'
            }, { quoted: msg });
        }
    }
};
