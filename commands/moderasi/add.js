/**
 * COMMAND: !add [nomor]
 * Menambahkan nomor baru ke dalam grup.
 * 
 * Tidak memerlukan library tambahan.
 * Hanya bisa digunakan oleh admin grup.
 * 
 * Contoh: !add 08123456789
 *         !add 628123456789  (format internasional)
 */

module.exports = {
    name: 'add',
    description: 'Tambah anggota baru ke grup. Format: !add [nomor]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!'
            }, { quoted: msg });
        }

        const inputNomor = args[0];

        if (!inputNomor) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!add [nomor telepon]`\n\nContoh:\n• `!add 08123456789`\n• `!add 628123456789`'
            }, { quoted: msg });
        }

        try {
            const metadataGrup = await sock.groupMetadata(chatId);
            const daftarAdmin = metadataGrup.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

            if (!daftarAdmin.includes(senderNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Hanya *Admin Grup* yang bisa menambahkan anggota!'
                }, { quoted: msg });
            }

            // Normalisasi format nomor ke format internasional tanpa "+"
            // Contoh: 08123456789 → 628123456789
            let nomorBersih = inputNomor.replace(/[^0-9]/g, '');
            if (nomorBersih.startsWith('0')) {
                nomorBersih = '62' + nomorBersih.slice(1);
            }

            const jidTarget = `${nomorBersih}@s.whatsapp.net`;

            // Tambahkan ke grup
            const responTambah = await sock.groupParticipantsUpdate(chatId, [jidTarget], 'add');

            // Cek hasil penambahan
            const statusTambah = responTambah[0]?.status;
            if (statusTambah === '200' || statusTambah === 200) {
                await sock.sendMessage(chatId, {
                    text: `✅ Nomor *+${nomorBersih}* berhasil ditambahkan ke grup!`
                }, { quoted: msg });
            } else if (statusTambah === '403' || statusTambah === 403) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ Gagal menambahkan *+${nomorBersih}*.\nPrivasi orang ini mungkin memblokir penambahan dari non-kontak.`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `⚠️ Nomor *+${nomorBersih}* tidak bisa ditambahkan (status: ${statusTambah}).\nPastikan nomor valid dan terdaftar di WhatsApp.`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('[ERROR] !add:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal menambahkan anggota. Pastikan bot adalah *Admin Grup* dan nomor yang dimasukkan valid!'
            }, { quoted: msg });
        }
    }
};
