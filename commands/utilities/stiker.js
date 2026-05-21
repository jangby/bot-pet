/**
 * COMMAND: !stiker / !sticker
 * Mengubah gambar, GIF, atau video pendek menjadi stiker WhatsApp.
 * 
 * Library yang dibutuhkan:
 *   npm install sharp
 *   (Baileys sendiri sudah support pengiriman stiker via { sticker: buffer })
 */

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'stiker',
    aliases: ['sticker'],
    description: 'Ubah gambar/GIF/video pendek jadi stiker WhatsApp',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Ambil pesan yang dikutip (reply) atau pesan saat ini yang berisi media
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const pesanMedia = pesanDikutip || msg.message;

        // Deteksi tipe media yang dikirim
        const adaGambar = pesanMedia?.imageMessage;
        const adaVideo = pesanMedia?.videoMessage;
        const adaGif = pesanMedia?.videoMessage?.gifPlayback; // GIF di WA terdeteksi sebagai video

        if (!adaGambar && !adaVideo) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\nKirim gambar/GIF/video lalu ketik `!stiker`, atau balas pesan media dengan `!stiker`.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '⏳ Sedang memproses stiker...' }, { quoted: msg });

            // Download buffer media dari pesan
            const bufferMedia = await sock.downloadMediaMessage(
                pesanDikutip
                    ? { message: pesanDikutip, key: msg.key }
                    : msg
            );

            // Kirim sebagai stiker
            // Baileys menerima buffer gambar/video dan otomatis mengkonversi
            await sock.sendMessage(chatId, {
                sticker: bufferMedia
            });

        } catch (error) {
            console.error('[ERROR] !stiker:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuat stiker. Pastikan file media tidak terlalu besar (maks ~1MB untuk video).'
            }, { quoted: msg });
        }
    }
};
