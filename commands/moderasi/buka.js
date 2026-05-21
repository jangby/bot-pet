/**
 * COMMAND: !buka
 * Membuka kunci grup sehingga semua anggota bisa mengirim pesan.
 * 
 * Tidak memerlukan library tambahan.
 * Hanya bisa digunakan oleh admin grup.
 */

module.exports = {
    name: 'buka',
    description: 'Buka kunci grup — semua anggota bisa chat',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!'
            }, { quoted: msg });
        }

        try {
            const metadataGrup = await sock.groupMetadata(chatId);
            const daftarAdmin = metadataGrup.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

            if (!daftarAdmin.includes(senderNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Hanya *Admin Grup* yang bisa membuka kunci grup!'
                }, { quoted: msg });
            }

            // Buka kunci grup: 'not_announcement' = semua anggota bisa kirim pesan
            await sock.groupSettingUpdate(chatId, 'not_announcement');

            await sock.sendMessage(chatId, {
                text: '🔓 *GRUP DIBUKA!*\n\nSemua anggota kini bisa mengirim pesan.\nGunakan `!tutup` untuk mengunci kembali.'
            });

        } catch (error) {
            console.error('[ERROR] !buka:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuka kunci grup. Pastikan bot adalah *Admin Grup*!'
            }, { quoted: msg });
        }
    }
};
