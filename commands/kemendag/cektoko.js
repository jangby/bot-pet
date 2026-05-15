module.exports = {
    name: 'cektoko',
    description: 'Melihat etalase toko milik pemain lain',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!cektoko @tag_pemain`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.market || !global.db.market.tokoPemain || !global.db.market.tokoPemain[targetNumber]) {
            return await sock.sendMessage(chatId, { text: '❌ Pemain tersebut tidak memiliki lisensi toko yang aktif.' }, { quoted: msg });
        }

        const dataToko = global.db.market.tokoPemain[targetNumber];
        const namaPemilik = global.db.player[targetNumber]?.nama || targetNumber;

        let teksToko = `🏪 *${dataToko.nama.toUpperCase()}* 🏪\n`;
        teksToko += `👤 Pemilik: ${namaPemilik}\n\n`;

        let adaBarang = false;
        const pasarInduk = global.db.market.pasarInduk || {};

        const iconKategori = {
            'makanan': '🍖', 'obat': '💊', 'apotek': '🏥', 
            'peralatan': '🛠️', 'senjata': '⚔️', 'armor': '🛡️'
        };

        for (const kategori in pasarInduk) {
            let isiKategori = "";
            let hasItemInCat = false;

            for (const [idBarang, etalaseData] of Object.entries(dataToko.etalase)) {
                if (etalaseData.stok > 0 && pasarInduk[kategori][idBarang]) {
                    hasItemInCat = true;
                    adaBarang = true;
                    
                    isiKategori += `🔸 *${pasarInduk[kategori][idBarang].nama}*\n`;
                    isiKategori += `   Harga: *${etalaseData.harga.toLocaleString('id-ID')} Nexus*\n`;
                    isiKategori += `   Sisa Stok: ${etalaseData.stok}\n\n`;
                }
            }

            if (hasItemInCat) {
                const icon = iconKategori[kategori.toLowerCase()] || '📦';
                const namaJudulKategori = kategori.replace(/_/g, ' ').toUpperCase();
                teksToko += `${icon} *KATEGORI ${namaJudulKategori}:*\n${isiKategori}`;
            }
        }

        if (!adaBarang) {
            teksToko += `💨 *ETALASE KOSONG:*\n_Toko ini sedang kehabisan stok barang._\n\n`;
        }

        teksToko += `🛒 _Ketik !beli @tag [jumlah] [nama barang] untuk membeli_`;

        await sock.sendMessage(chatId, { text: teksToko, mentions: [targetId] }, { quoted: msg });
    }
};
