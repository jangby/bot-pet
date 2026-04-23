const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ubahnamatoko',
    description: 'Mengganti nama toko milikmu',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Format salah!\nContoh: `!ubahnamatoko Apotek Sehat Selalu`' 
            }, { quoted: msg });
        }

        const namaBaru = args.join(' ');

        // Validasi kepemilikan toko
        if (!global.db.market || !global.db.market.tokoPemain || !global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Kamu tidak memiliki toko yang aktif.' 
            }, { quoted: msg });
        }

        // Batasi panjang nama agar tampilan UI tidak rusak
        if (namaBaru.length > 20) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ Nama toko terlalu panjang! (Maksimal 20 karakter)' 
            }, { quoted: msg });
        }

        const toko = global.db.market.tokoPemain[senderNumber];
        const namaLama = toko.nama;
        
        // Eksekusi perubahan nama
        toko.nama = namaBaru;

        // Simpan langsung ke database secara real-time
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

        const teksHasil = 
`✨ *REBRANDING TOKO BERHASIL!* ✨

Lisensi toko milikmu telah diperbarui.
Toko yang sebelumnya bernama _${namaLama}_ kini resmi beroperasi dengan nama baru:
🏢 *${namaBaru}*

_Ketik !mytoko untuk memamerkan identitas barumu ke grup!_`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};