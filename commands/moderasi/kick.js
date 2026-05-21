/**
 * COMMAND: !kick [@tag]
 * Mengeluarkan anggota dari grup.
 * 
 * Tidak memerlukan library tambahan.
 * Hanya bisa digunakan oleh admin grup.
 * 
 * Contoh: !kick @namaanggota
 */

module.exports = {
    name: 'kick',
    description: 'Tendang anggota dari grup. Format: !kick @tag',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!'
            }, { quoted: msg });
        }

        // Ambil daftar yang di-tag (mention)
        const daftarMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (daftarMention.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!kick @namaanggota`\n\nTag anggota yang ingin dikeluarkan.'
            }, { quoted: msg });
        }

        try {
            const metadataGrup = await sock.groupMetadata(chatId);
            const daftarAdmin = metadataGrup.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

            // Cek apakah pengirim perintah adalah admin
            if (!daftarAdmin.includes(senderNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Hanya *Admin Grup* yang bisa mengeluarkan anggota!'
                }, { quoted: msg });
            }

            const targetId = daftarMention[0];
            const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];

            // Cegah menendang admin lain
            if (daftarAdmin.includes(targetNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Tidak bisa mengeluarkan sesama *Admin Grup*!'
                }, { quoted: msg });
            }

            // Keluarkan anggota dari grup
            await sock.groupParticipantsUpdate(chatId, [targetId], 'remove');

            await sock.sendMessage(chatId, {
                text: `👢 @${targetNumber} telah dikeluarkan dari grup oleh admin.`,
                mentions: [targetId]
            });

        } catch (error) {
            console.error('[ERROR] !kick:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengeluarkan anggota. Pastikan bot adalah *Admin Grup* dan nomor target masih ada di grup!'
            }, { quoted: msg });
        }
    }
};
