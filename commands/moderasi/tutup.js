/**
 * COMMAND: !tutup
 * Mengunci grup sehingga hanya admin yang bisa mengirim pesan.
 * 
 * Tidak memerlukan library tambahan.
 * Baileys sudah mendukung fungsi groupSettingUpdate().
 * 
 * Hanya bisa digunakan oleh admin grup.
 */

module.exports = {
    name: 'tutup',
    description: 'Kunci grup — hanya admin yang bisa chat',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        // Pastikan perintah digunakan di dalam grup
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!'
            }, { quoted: msg });
        }

        try {
            // Ambil metadata grup untuk cek apakah pengirim adalah admin
            const metadataGrup = await sock.groupMetadata(chatId);
            const daftarAdmin = metadataGrup.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

            if (!daftarAdmin.includes(senderNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Hanya *Admin Grup* yang bisa mengunci grup!'
                }, { quoted: msg });
            }

            // Kunci grup: 'announcement' = hanya admin bisa kirim pesan
            await sock.groupSettingUpdate(chatId, 'announcement');

            await sock.sendMessage(chatId, {
                text: '🔒 *GRUP DIKUNCI!*\n\nSekarang hanya admin yang bisa mengirim pesan.\nGunakan `!buka` untuk membuka kembali.'
            });

        } catch (error) {
            console.error('[ERROR] !tutup:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengunci grup. Pastikan bot adalah *Admin Grup*!'
            }, { quoted: msg });
        }
    }
};
