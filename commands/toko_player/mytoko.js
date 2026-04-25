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
        
        let teksToko = `🏪 *${dataToko.nama.toUpperCase()}* 🏪\n`;
        teksToko += `🏷️ Kategori: *TOKO SERBA ADA*\n`;
        teksToko += `👤 Pemilik: @${senderNumber}\n`;
        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        let adaBarang = false;
        
        // Memastikan data pasar induk tersedia
        if (!global.db.market.pasarInduk) global.db.market.pasarInduk = {};
        const pasarInduk = global.db.market.pasarInduk;

        // Kamus Icon agar judul kategori otomatis punya icon yang pas
        const iconKategori = {
            'makanan': '🍖',
            'obat': '💊',
            'apotek': '🏥',
            'peralatan': '⚒️',
            'senjata': '⚔️',
            'armor': '🛡️'
        };

        // Looping Dinamis: Mengecek setiap kategori yang ada di Pasar Induk
        for (const kategori in pasarInduk) {
            let isiKategori = "";
            let hasItemInCat = false;

            // Cek barang di etalase pemain yang cocok dengan kategori ini
            for (const [idBarang, etalaseData] of Object.entries(dataToko.etalase)) {
                if (etalaseData.stok > 0 && pasarInduk[kategori][idBarang]) {
                    hasItemInCat = true;
                    adaBarang = true;
                    
                    isiKategori += `• *${pasarInduk[kategori][idBarang].nama}*\n`;
                    isiKategori += `  💰 Harga: *${etalaseData.harga.toLocaleString('id-ID')} 💠 Nexus*\n`;
                    isiKategori += `  📦 Sisa Stok: ${etalaseData.stok}\n\n`;
                }
            }

            // Jika ada barang di kategori ini, tambahkan ke teks tampilan
            if (hasItemInCat) {
                const icon = iconKategori[kategori.toLowerCase()] || '📦';
                const namaJudulKategori = kategori.replace(/_/g, ' ').toUpperCase();
                
                teksToko += `${icon} *KATEGORI ${namaJudulKategori}:*\n${isiKategori}`;
            }
        }

        if (!adaBarang) {
            teksToko += `📦 *ETALASE KOSONG:*\n_Sedang tidak ada barang yang dijual. Silakan restock lewat Web Dashboard._\n\n`;
        }

        teksToko += `━━━━━━━━━━━━━━━━━━━━━\n`;
        teksToko += `💡 _Ketik !beli @${senderNumber} [jumlah] [nama barang] untuk membeli_`;

        await sock.sendMessage(chatId, { 
            text: teksToko, 
            mentions: [senderId] 
        }, { quoted: msg });
    }
};