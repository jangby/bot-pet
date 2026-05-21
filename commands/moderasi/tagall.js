/**
 * COMMAND: !tagall / !everyone
 * Mentag/menyebut semua anggota grup sekaligus.
 * 
 * Tidak memerlukan library tambahan.
 * Hanya bisa digunakan oleh admin grup.
 * 
 * Contoh:
 *   !tagall
 *   !tagall Ada pengumuman penting!
 */

module.exports = {
    name: 'tagall',
    aliases: ['everyone'],
    description: 'Tag semua anggota grup sekaligus',

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
                    text: '⛔ Hanya *Admin Grup* yang bisa mentag semua anggota!'
                }, { quoted: msg });
            }

            // Kumpulkan semua JID anggota grup, resolve LID ke nomor asli
            const anggotaResolved = metadataGrup.participants.map(p => {
                // Jika p.id sudah @s.whatsapp.net → pakai langsung
                // Jika p.id masih @lid → cari yang p.lid-nya cocok di list
                let realJid = p.id;
                if (p.id.endsWith('@lid')) {
                    const match = metadataGrup.participants.find(q =>
                        q.id && q.id.endsWith('@s.whatsapp.net') && q.lid && q.lid === p.id
                    );
                    if (match) realJid = match.id;
                }
                return { realJid, nomor: realJid.split('@')[0] };
            });

            const jumlahAnggota = anggotaResolved.length;
            const pesanTambahan = args.join(' ').trim();

            let teksMention = `📢 *PENGUMUMAN GRUP* (${jumlahAnggota} anggota)\n`;
            if (pesanTambahan) teksMention += `\n_"${pesanTambahan}"_\n`;
            teksMention += '\n';

            anggotaResolved.forEach(({ nomor }) => {
                teksMention += `@${nomor} `;
            });

            await sock.sendMessage(chatId, {
                text: teksMention,
                mentions: anggotaResolved.map(({ realJid }) => realJid)
            });

        } catch (error) {
            console.error('[ERROR] !tagall:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mentag semua anggota. Pastikan bot adalah *Admin Grup*!'
            }, { quoted: msg });
        }
    }
};
