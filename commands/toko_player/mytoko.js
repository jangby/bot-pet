const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'mytoko',
    description: 'Menampilkan etalase toko milikmu ke grup',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.market || !global.db.market.tokoPemain || !global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum memiliki lisensi toko. Tunggu rilis lisensi dari Bank Sentral.' }, { quoted: msg });
        }

        const dataToko = global.db.market.tokoPemain[senderNumber];
        
        // Gabungkan seluruh kategori di pasar induk menjadi satu referensi
        if (!global.db.market.pasarInduk) global.db.market.pasarInduk = {};
        let semuaBarangInduk = {};
        for (const kat in global.db.market.pasarInduk) { 
            Object.assign(semuaBarangInduk, global.db.market.pasarInduk[kat]); 
        }

        let teksToko = `🏪 *${dataToko.nama.toUpperCase()}* 🏪\n`;
        teksToko += `🏷️ Kategori: *TOKO SERBA ADA*\n`;
        teksToko += `👤 Pemilik: @${senderNumber}\n`;
        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        teksToko += `📦 *ETALASE BARANG:*\n`;

        let adaBarang = false;
        for (const [idBarang, etalaseData] of Object.entries(dataToko.etalase)) {
            if (etalaseData.stok > 0 && semuaBarangInduk[idBarang]) {
                adaBarang = true;
                teksToko += `• *${semuaBarangInduk[idBarang].nama}*\n`;
                teksToko += `  💰 Harga: *${etalaseData.harga.toLocaleString('id-ID')} 💠 Nexus*\n`;
                teksToko += `  📦 Sisa Stok: ${etalaseData.stok}\n\n`;
            }
        }

        if (!adaBarang) {
            teksToko += `_Etalase kosong. Sedang tidak ada barang yang dijual. Silakan restock lewat Web Dashboard._\n\n`;
        }

        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n`;
        teksToko += `💡 _Ketik !beli @${senderNumber} [jumlah] [nama barang] untuk membeli_`;

        await sock.sendMessage(chatId, { 
            text: teksToko, 
            mentions: [senderId] 
        }, { quoted: msg });
    }
};