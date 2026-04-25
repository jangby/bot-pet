const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'linktoko',
    description: 'Mendapatkan link rahasia untuk mengelola toko di Web Dashboard',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Cek apakah pemain ini benar-benar punya toko
        if (!global.db.market || !global.db.market.tokoPemain || !global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak memiliki lisensi toko yang aktif.' }, { quoted: msg });
        }

        const dataToko = global.db.market.tokoPemain[senderNumber];
        const token = dataToko.tokenWeb;
        const linkDashboard = `https://d687-180-241-241-59.ngrok-free.app/dashboard?token=${token}`;

        const teksLink = `🏪 *AKSES DASHBOARD TOKO* 🏪\n\nNama Toko: *${dataToko.nama}*\n\nKlik link di bawah ini untuk mengelola stok barang, mengubah harga jual, dan berbelanja ke Pasar Induk:\n\n🔐 ${linkDashboard}\n\n_⚠️ JANGAN BAGIKAN LINK INI KEPADA SIAPAPUN! Siapapun yang memiliki link ini bisa mengubah harga dan menguras isi kas tokomu._`;

        // 2. Jika perintah diketik di dalam grup (ID berakhiran @g.us)
        if (chatId.endsWith('@g.us')) {
            try {
                // --- KONVERSI LID KE NOMOR ASLI UNTUK JAPRI ---
                let realJid = `${senderNumber}@s.whatsapp.net`;
                let cleanNumber = senderNumber;
                
                try {
                    // Cari nomor aslinya dari data anggota grup
                    const metadata = await sock.groupMetadata(chatId);
                    const participant = metadata.participants.find(p => 
                        (p.id && p.id.includes(senderNumber)) || 
                        (p.lid && p.lid.includes(senderNumber))
                    );

                    if (participant) {
                        realJid = participant.id; // Nomor asli +62...
                        cleanNumber = realJid.split('@')[0];
                    }
                } catch (err) {
                    console.log("Gagal mengambil metadata grup di linktoko");
                }

                // Kirim link rahasia langsung ke nomor ASLI (Japri/PM)
                await sock.sendMessage(realJid, { text: teksLink });
                
                // Beri tahu di grup bahwa link sudah dikirim, dan tag nomor aslinya!
                await sock.sendMessage(chatId, { 
                    text: `✅ Link akses toko telah dikirimkan secara rahasia ke Pesan Pribadi (PM) kamu, @${cleanNumber}!\n\n_Cek chat pribadimu dengan bot ini._`, 
                    mentions: [realJid] 
                }, { quoted: msg });
            } catch (error) {
                // Jika gagal (biasanya karena belum pernah chat bot di PM sama sekali)
                await sock.sendMessage(chatId, { 
                    text: `⚠️ Gagal mengirim pesan! @${senderNumber}, pastikan kamu sudah pernah mengirim chat "P" atau apapun secara personal (PM) ke nomor bot ini agar bot diizinkan mengirim pesan kepadamu.`, 
                    mentions: [`${senderNumber}@s.whatsapp.net`] 
                }, { quoted: msg });
            }
        } 
        // 3. Jika perintah langsung diketik di PM bot
        else {
            await sock.sendMessage(chatId, { text: teksLink }, { quoted: msg });
        }
    }
};