const { isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'progresnik',
    description: 'Melihat progres pengumpulan data NIK dan daftar anggota yang belum mengisi (Khusus Presiden & Wapres)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Validasi Presiden/Wapres
        if (!isPresiden(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⛔ Perintah ini hanya bisa diakses oleh Presiden atau Wakil Presiden!' }, { quoted: msg });
        }

        // 2. Cek inisialisasi database NIK
        if (!global.db.nik) {
            return await sock.sendMessage(chatId, { text: '⚠️ Basis data NIK belum siap atau kosong.' });
        }

        const session = global.db.nik.session || {};
        const records = global.db.nik.records || {};
        const pendingUsers = global.db.nik.pending || [];
        
        const totalTerkumpul = Object.keys(records).length;
        const totalPending = pendingUsers.length;

        let teks = `🏛️ *PROGRES PENGUMPULAN NIK REPUBLIK NEXUS* 🏛️\n\n`;
        teks += `📊 *Status Sesi:* ${session.active ? '🟢 Aktif' : '🔴 Tidak Aktif'}\n`;
        if (session.active) {
            teks += `👥 *Grup Target:* ${session.groupName || '-'}\n`;
        }
        teks += `📈 *Jumlah Terkumpul:* *${totalTerkumpul}* orang\n`;
        teks += `⏳ *Sisa Belum Mengisi:* *${totalPending}* orang\n\n`;

        const mentions = [];
        if (totalPending > 0) {
            teks += `📋 *Daftar Anggota Pending:* (Silakan segera melengkapi)\n`;
            pendingUsers.forEach((jid, i) => {
                const num = jid.split('@')[0];
                teks += `${i + 1}. @${num}\n`;
                mentions.push(jid);
            });
            teks += `\n_Format penginputan PM bot:_\n*!nik |Nama Lengkap Sesuai KK| Nomor NIK*`;
        } else {
            teks += `🎉 *Selesai!* Seluruh anggota grup target sudah melengkapi data NIK mereka.`;
        }

        await sock.sendMessage(chatId, { 
            text: teks, 
            mentions: mentions 
        }, { quoted: msg });
    }
};
