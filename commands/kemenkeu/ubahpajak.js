const fs = require('fs');
const path = require('path');
const { isPrivate, isMenteri } = require('../../utils/middleware.js');

module.exports = {
    name: 'ubahpajak',
    description: 'Mengubah rate pajak pendapatan kerja/gajian (Khusus Kemenkeu)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Menteri hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        if (!isMenteri(senderNumber, 'keuangan')) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Menteri Keuangan!' }, { quoted: msg });
        }

        if (args.length < 1 || isNaN(args[0])) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!ubahpajak [angka persentase]`\nContoh: `!ubahpajak 10`' });
        }

        const pajakBaru = parseInt(args[0]);
        if (pajakBaru < 0 || pajakBaru > 100) {
            return await sock.sendMessage(chatId, { text: '❌ Persentase pajak harus antara 0 hingga 100!' });
        }

        global.db.kabinet.menteri_keuangan.pajak_pendapatan = pajakBaru;
        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));

        await sock.sendMessage(chatId, { text: `✅ *KEBIJAKAN DISAHKAN*\n\nPajak pendapatan berhasil diubah menjadi *${pajakBaru}%*.` });

        // Broadcast ke semua grup yang bot ada di dalamnya
        try {
            const groups = Object.keys(await sock.groupFetchAllParticipating());
            for (const group of groups) {
                await sock.sendMessage(group, { text: `📢 *PENGUMUMAN RESMI NEGARA* 📢\n\nKementerian Keuangan telah menetapkan kebijakan baru:\n*Pajak Pendapatan diubah menjadi ${pajakBaru}%*\n\n_Kebijakan ini berlaku efektif untuk semua aktivitas kerja dan gajian._` });
            }
        } catch(e) {
            console.log("Gagal broadcast ubah pajak: ", e);
        }
    }
};
