/**
 * COMMAND: !confess [nomor] | [pesan]
 * Mengirim pesan rahasia/anonim ke nomor WhatsApp tujuan via pesan pribadi (PM).
 * 
 * Tidak memerlukan library tambahan.
 * 
 * Format: !confess 08123456789 | Hai, aku suka sama kamu :)
 * 
 * PERHATIAN: Fitur ini bisa disalahgunakan. Tambahkan rate limiting jika perlu.
 */

module.exports = {
    name: 'confess',
    description: 'Kirim pesan anonim ke seseorang via PM. Format: !confess [nomor] | [pesan]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

        const teksLengkap = args.join(' ');
        const bagian = teksLengkap.split('|');

        if (bagian.length < 2) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!confess [nomor/tag] | [pesan rahasia]`\n\nContoh:\n• `!confess 08123456789 | Hai, aku suka sama kamu!`\n• `!confess @namaOrang | Kamu terlihat baik hari ini 😊`'
            }, { quoted: msg });
        }

        let inputTujuan = bagian[0].trim();
        const pesanRahasia = bagian[1].trim();

        if (!pesanRahasia) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Pesan rahasia tidak boleh kosong!'
            }, { quoted: msg });
        }

        // Cek apakah ada mention (@tag) atau nomor langsung
        const daftarMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let nomorTujuan;
        let jidTujuan;

        if (daftarMention.length > 0) {
            // Ambil dari mention pertama
            jidTujuan = daftarMention[0];
            nomorTujuan = jidTujuan.replace(/:\d+/, '').split('@')[0];
        } else {
            // Ambil dari nomor yang diketik manual
            nomorTujuan = inputTujuan.replace(/[^0-9]/g, '');
            if (nomorTujuan.startsWith('0')) {
                nomorTujuan = '62' + nomorTujuan.slice(1);
            }
            jidTujuan = `${nomorTujuan}@s.whatsapp.net`;
        }

        if (!nomorTujuan || nomorTujuan.length < 9) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Nomor tujuan tidak valid!'
            }, { quoted: msg });
        }

        // Cegah confess ke diri sendiri
        if (nomorTujuan === senderNumber) {
            return await sock.sendMessage(chatId, {
                text: '😂 Kamu tidak bisa mengirim confess ke dirimu sendiri!'
            }, { quoted: msg });
        }

        try {
            // Kirim pesan anonim ke tujuan via PM
            const teksConfess = 
`💌 *PESAN ANONIM UNTUKMU* 💌
─────────────────────────

_"${pesanRahasia}"_

─────────────────────────
_Seseorang yang peduli padamu mengirimkan pesan ini 🎀_
_Pengirim dirahasiakan._`;

            await sock.sendMessage(jidTujuan, { text: teksConfess });

            // Kirim konfirmasi ke pengirim (di grup)
            await sock.sendMessage(chatId, {
                text: `✅ Confess berhasil dikirim!\n\n_Pesanmu sudah tersampaikan secara anonim. Identitasmu dirahasiakan._`
            }, { quoted: msg });

        } catch (error) {
            console.error('[ERROR] !confess:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengirim confess. Pastikan nomor tujuan terdaftar di WhatsApp.'
            }, { quoted: msg });
        }
    }
};
