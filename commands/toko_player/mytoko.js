const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'mytoko',
    description: 'Menampilkan etalase toko milikmu ke grup',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Validasi Kepemilikan Toko
        if (!global.db.market || !global.db.market.tokoPemain || !global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum memiliki lisensi toko. Daftar dulu dengan perintah `!daftartoko` via Japri (Chat Pribadi).' }, { quoted: msg });
        }

        const dataToko = global.db.market.tokoPemain[senderNumber];
        
        // Antisipasi jika pasar induk belum ter-load sempurna
        if (!global.db.market.pasarInduk) global.db.market.pasarInduk = {};
        const kategoriBarang = global.db.market.pasarInduk[dataToko.kategori] || {};

        // 2. Merakit Teks Etalase
        let teksToko = `🏪 *${dataToko.nama.toUpperCase()}* 🏪\n`;
        teksToko += `🏷️ Kategori: *${dataToko.kategori.toUpperCase()}*\n`;
        teksToko += `👤 Pemilik: @${senderNumber}\n`;
        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        teksToko += `📦 *ETALASE BARANG:*\n`;

        let adaBarang = false;
        for (const [idBarang, etalaseData] of Object.entries(dataToko.etalase)) {
            if (etalaseData.stok > 0 && kategoriBarang[idBarang]) {
                adaBarang = true;
                teksToko += `• *${kategoriBarang[idBarang].nama}*\n`;
                teksToko += `  💰 Harga: *${etalaseData.harga.toLocaleString('id-ID')} 💠 Nexus*\n`;
                teksToko += `  📦 Sisa Stok: ${etalaseData.stok}\n\n`;
            }
        }

        if (!adaBarang) {
            teksToko += `_Etalase kosong. Sedang tidak ada barang yang dijual. Silakan restock lewat Web Dashboard._\n\n`;
        }

        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n`;
        teksToko += `💡 _Ketik !beli @${senderNumber} [jumlah] [nama barang] untuk membeli_`;

        // 3. Eksekusi Pesan DENGAN MENTIONS
        // Kuncinya ada di array mentions: [senderId] agar @nomor berubah jadi tag biru
        await sock.sendMessage(chatId, { 
            text: teksToko, 
            mentions: [senderId] 
        }, { quoted: msg });
    }
};