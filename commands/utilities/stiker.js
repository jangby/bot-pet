/**
 * COMMAND: !stiker / !sticker
 * Mengubah gambar, GIF, video pendek, atau TEKS menjadi stiker WhatsApp.
 * 
 * Fitur: Support membaca nama kontak yang tersimpan di memori Bot (Store).
 * Library yang dibutuhkan:
 *   npm install sharp axios
 */

const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Fungsi bantuan untuk mencari nama dari buku kontak bot
function cariNamaKontak(jid, sock) {
    // Pastikan JID valid
    if (!jid) return null;
    
    // Coba cari di memori kontak Baileys (sock.store)
    if (sock.store && sock.store.contacts && sock.store.contacts[jid]) {
        const kontak = sock.store.contacts[jid];
        // Prioritaskan "name" (nama yang di-save), lalu "notify" (pushname dari WA)
        return kontak.name || kontak.vname || kontak.notify || null;
    }
    return null;
}

module.exports = {
    name: 'stiker',
    aliases: ['sticker', 's', 'qc'],
    description: 'Ubah media atau teks jadi stiker WhatsApp',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Ambil pesan yang dikutip (reply) atau pesan saat ini
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const pesanMedia = pesanDikutip || msg.message;

        // Deteksi tipe pesan
        const adaGambar = pesanMedia?.imageMessage;
        const adaVideo = pesanMedia?.videoMessage;
        
        let teksStiker = '';
        let senderJid = '';
        let pushName = 'User';

        // ==========================================
        // 1. EKSTRAK TEKS DAN NAMA PENGIRIM
        // ==========================================
        if (pesanDikutip) {
            teksStiker = pesanDikutip.conversation || pesanDikutip.extendedTextMessage?.text || '';
            senderJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
            
            // 1) Coba cari nama yang di-save di kontak
            let namaTersimpan = cariNamaKontak(senderJid, sock);
            // 2) Kalau gak di-save, pakai PushName asli WA dia
            let namaPushName = msg.message?.extendedTextMessage?.contextInfo?.pushName;
            
            // Tentukan nama final
            let namaFinal = namaTersimpan || namaPushName;

            // Jika masih kosong (orangnya misterius / pakai LID tanpa save)
            if (!namaFinal && senderJid) {
                if (senderJid.includes('@s.whatsapp.net')) {
                    namaFinal = senderJid.split('@')[0]; // Ambil nomor
                } else if (senderJid.includes('@lid')) {
                    namaFinal = 'Pengguna WA'; 
                }
            }
            
            // Format Nama di Header Stiker
            pushName = (namaFinal && namaFinal.match(/^\d+$/)) ? `+${namaFinal}` : `${namaFinal || 'Seseorang'}`;

        } else if (args && args.length > 0) {
            teksStiker = args.join(' ');
            senderJid = msg.key.participant || msg.key.remoteJid;
            
            let namaTersimpan = cariNamaKontak(senderJid, sock);
            let namaFinal = namaTersimpan || msg.pushName;
            
            if (!namaFinal && senderJid) {
                if (senderJid.includes('@s.whatsapp.net')) {
                    namaFinal = senderJid.split('@')[0];
                } else {
                    namaFinal = 'Kamu';
                }
            }
            pushName = (namaFinal && namaFinal.match(/^\d+$/)) ? `+${namaFinal}` : `${namaFinal || 'Kamu'}`;
        }

        // ==========================================
        // 2. MEMBERSIHKAN TAG / MENTION DI DALAM TEKS
        // ==========================================
        const contextInfo = pesanDikutip 
            ? pesanDikutip.extendedTextMessage?.contextInfo 
            : msg.message?.extendedTextMessage?.contextInfo;
        
        const mentionedJids = contextInfo?.mentionedJid || [];

        // Loop semua tag yang ada di pesan tersebut
        mentionedJids.forEach(jid => {
            const idMentah = jid.split('@')[0];
            const isLid = jid.includes('@lid');
            
            // Cek apakah nomor/LID yang di-tag ini ada di kontak kamu?
            let namaTag = cariNamaKontak(jid, sock);

            // Kalau gak ada di kontak kamu:
            if (!namaTag) {
                if (isLid) {
                    namaTag = 'Pengguna'; // LID gak disave -> Pengguna
                } else {
                    namaTag = idMentah; // Nomor biasa gak disave -> Munculin angkanya
                }
            }
            
            // Replace tag berwujud @angka_panjang menjadi @NamaKontaknya
            const regex = new RegExp(`@${idMentah}`, 'g');
            teksStiker = teksStiker.replace(regex, `@${namaTag}`);
        });

        // Fallback Keamanan: Membersihkan sisa angka LID panjang (di atas 14 digit) di dalam teks yang tidak terbaca
        teksStiker = teksStiker.replace(/@\d{15,}/g, '@Pengguna');

        // ==========================================

        // Validasi jika tidak ada media dan tidak ada teks
        if (!adaGambar && !adaVideo && !teksStiker) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n1. Kirim/balas media dengan `!stiker`\n2. Balas pesan teks dengan `!stiker` (Jadi screenshot chat)'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '⏳ Sedang memproses stiker...' }, { quoted: msg });

            let bufferStiker;

            // === 3. JIKA PESAN ADALAH MEDIA (GAMBAR / VIDEO) ===
            if (adaGambar || adaVideo) {
                const targetMessage = pesanDikutip ? { message: pesanDikutip, key: msg.key } : msg;
                
                const mediaBuffer = await downloadMediaMessage(
                    targetMessage,
                    'buffer',
                    {},
                    { 
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
                
                bufferStiker = await sharp(mediaBuffer)
                    .webp({ quality: 80 })
                    .toBuffer();
            } 
            
            // === 4. JIKA PESAN ADALAH TEKS (JADI SCREENSHOT BUBBLE) ===
            else if (teksStiker) {
                let ppUrl = 'https://i.ibb.co/3Fh9Q6M/blank-profile-picture.png';
                try {
                    if (senderJid) {
                        ppUrl = await sock.profilePictureUrl(senderJid, 'image');
                    }
                } catch (error) {
                    // Abaikan jika tidak ada foto profil
                }

                // Payload untuk API Quote
                const quotePayload = {
                    type: "quote",
                    format: "png",
                    backgroundColor: "#202c33", // Dark Mode WA
                    width: 512,
                    height: 768,
                    scale: 2,
                    messages: [
                        {
                            entities: [],
                            avatar: true,
                            from: {
                                id: 1,
                                name: pushName, // Nama pengirim (Berdasarkan kontak/PushName)
                                photo: { url: ppUrl }
                            },
                            text: teksStiker, // Teks yang tag-nya sudah diubah jadi nama kontak
                            replyMessage: {}
                        }
                    ]
                };

                const response = await axios.post('https://bot.lyo.su/quote/generate', quotePayload, {
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.data?.result?.image) {
                    throw new Error('API Quote gagal');
                }

                const bufferImage = Buffer.from(response.data.result.image, 'base64');

                bufferStiker = await sharp(bufferImage)
                    .webp({ quality: 80, lossless: false })
                    .toBuffer();
            }

            // === 5. KIRIM STIKER ===
            await sock.sendMessage(chatId, {
                sticker: bufferStiker
            }, { quoted: msg });

        } catch (error) {
            console.error('[ERROR] !stiker:', error?.response?.data || error.message);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuat stiker. Pastikan bot terhubung dengan benar.'
            }, { quoted: msg });
        }
    }
};