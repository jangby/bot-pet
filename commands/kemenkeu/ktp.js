const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ktp',
    description: 'Melihat Kartu Tanda Penduduk (Profil Warga) Republik Nexus',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Cek apakah pemain sudah daftar nama
        if (!global.db.player[senderNumber] || !global.db.player[senderNumber].nama) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum terdaftar sebagai warga negara! Ketik `!nama [Nama Kamu]` terlebih dahulu.' }, { quoted: msg });
        }

        const player = global.db.player[senderNumber];
        const nama = player.nama;
        const saldo = player.saldo || 0;
        const reputasi = player.reputasi || 0;
        const pasangan = player.pasangan ? `@${player.pasangan}` : 'Belum Kawin';
        const statusWarga = player.pekerjaan || 'Buruh Lepas';

        // Hitung jumlah peliharaan
        const jumlahPet = (global.db.pet[senderNumber] || []).length;

        let teksKTP = `🪪 *KARTU TANDA PENDUDUK (KTP)* 🪪\n`;
        teksKTP += `🏛️ *Republik Nexus*\n\n`;
        teksKTP += `👤 *Nama:* ${nama}\n`;
        teksKTP += `📱 *NIK:* ${senderNumber}\n`;
        teksKTP += `💼 *Status Pekerjaan:* ${statusWarga}\n`;
        teksKTP += `💍 *Status Sipil:* ${pasangan}\n`;
        teksKTP += `⭐ *Skor Reputasi:* ${reputasi} Poin\n`;
        teksKTP += `🐾 *Jumlah Peliharaan:* ${jumlahPet} Ekor\n\n`;
        teksKTP += `💰 *Kekayaan Bersih:* ${saldo.toLocaleString('id-ID')} Nexus\n\n`;
        teksKTP += `_"Warga negara yang baik taat membayar pajak!"_`;

        // Siapkan tag (mention) jika ada pasangan
        let mentions = [senderId];
        if (player.pasangan) mentions.push(`${player.pasangan}@s.whatsapp.net`);

        await sock.sendMessage(chatId, { text: teksKTP, mentions: mentions }, { quoted: msg });
    }
};
