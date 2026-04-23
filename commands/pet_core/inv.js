const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'inv',
    description: 'Melihat isi tas / inventory kamu',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.inventory || !global.db.inventory[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '🎒 Tas kamu masih kosong. Beli barang dulu di toko pemain lain!' }, { quoted: msg });
        }

        const tas = global.db.inventory[senderNumber];
        let teksInv = `🎒 *TAS INVENTORY*\n━━━━━━━━━━━━━━━━━━━━━\n`;
        let adaBarang = false;

        // Menggabungkan semua barang di pasar induk untuk referensi nama asli
        let semuaBarang = {};
        if (global.db.market && global.db.market.pasarInduk) {
            for (const kategori in global.db.market.pasarInduk) {
                Object.assign(semuaBarang, global.db.market.pasarInduk[kategori]);
            }
        }

        for (const [idBarang, jumlah] of Object.entries(tas)) {
            if (jumlah > 0) {
                adaBarang = true;
                const info = semuaBarang[idBarang] || { nama: idBarang, efek: '' };
                teksInv += `• ${jumlah}x *${info.nama}* _(${info.efek || info.kegunaan})_\n`;
            }
        }

        if (!adaBarang) teksInv += `_Tidak ada barang tersimpan._\n`;
        teksInv += `━━━━━━━━━━━━━━━━━━━━━\n💡 _Gunakan !feed [ID Pet] [nama barang] untuk memberi makan._`;

        await sock.sendMessage(chatId, { text: teksInv }, { quoted: msg });
    }
};