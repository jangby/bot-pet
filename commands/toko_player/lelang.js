const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'lelang',
    description: 'Melihat daftar toko yang disita dan sedang dilelang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Pastikan laci lelang ada
        if (!global.db.market.lelang) global.db.market.lelang = {};

        const BATAS_BANGKRUT = 2 * 24 * 60 * 60 * 1000; // 2 Hari
        // const BATAS_BANGKRUT = 2 * 60 * 1000; // UNTUK TESTING: 2 Menit (Buka komentar ini kalau mau tes cepat)
        
        let adaSitaanBaru = false;

        // 1. SWEEPING TOKO BANGKRUT (AUTO-LELANG)
        for (const [nomorPemilik, toko] of Object.entries(global.db.market.tokoPemain)) {
            const waktuNganggur = Date.now() - (toko.terakhirLaku || Date.now());
            
            if (waktuNganggur > BATAS_BANGKRUT) {
                // Hitung Valuasi Aset Toko (Harga Buka Lelang)
                let totalValuasiBarang = 0;
                const kategoriBarang = global.db.market.pasarInduk[toko.kategori];
                
                for (const [idBarang, dataEtalase] of Object.entries(toko.etalase)) {
                    if (dataEtalase.stok > 0 && kategoriBarang[idBarang]) {
                        totalValuasiBarang += (dataEtalase.stok * kategoriBarang[idBarang].modal);
                    }
                }

                // Modal Lisensi Awal (2000) + Total Valuasi Barang di Etalase
                const hargaBuka = 2000 + totalValuasiBarang;

                // Pindahkan ke Laci Lelang
                global.db.market.lelang[nomorPemilik] = {
                    nama: toko.nama,
                    kategori: toko.kategori,
                    etalase: toko.etalase,
                    tokenWeb: toko.tokenWeb, // Token web diwariskan ke pemilik baru nanti
                    hargaBuka: hargaBuka,
                    bidTertinggi: hargaBuka, // Nilai tawaran saat ini
                    pemenangSementara: null,
                    pemilikLama: nomorPemilik,
                    waktuSita: Date.now()
                };

                // Hapus lisensinya dari tangan pemilik lama
                delete global.db.market.tokoPemain[nomorPemilik];
                adaSitaanBaru = true;
            }
        }

        // Simpan jika ada perubahan
        if (adaSitaanBaru) {
            fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
            await sock.sendMessage(chatId, { text: `📢 *PENGUMUMAN BANK SENTRAL*\nAda toko yang baru saja disita karena bangkrut (tidak ada aktivitas penjualan)! Lisensi tersebut sekarang dilempar ke pasar lelang.` });
        }

        // 2. TAMPILKAN ETALASE LELANG
        const daftarLelang = Object.entries(global.db.market.lelang);
        
        if (daftarLelang.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚖️ *BALAI LELANG*\nSaat ini tidak ada lisensi toko yang sedang dilelang. Ekonomi sedang sehat!' }, { quoted: msg });
        }

        let teksLelang = `⚖️ *BALAI LELANG LISENSI TOKO* ⚖️\n_Toko-toko di bawah ini disita oleh Bank Sentral dan siap dipindahtangankan beserta seluruh aset di dalamnya._\n\n`;

        daftarLelang.forEach(([idLama, dataLelang], index) => {
            const penawar = dataLelang.pemenangSementara ? `@${dataLelang.pemenangSementara}` : 'Belum Ada';
            teksLelang += `🏢 *${dataLelang.nama}* (Pemilik Lama: @${idLama})\n`;
            teksLelang += `🏷️ Kategori: ${dataLelang.kategori.toUpperCase()}\n`;
            teksLelang += `💰 Harga Buka: *${dataLelang.hargaBuka.toLocaleString('id-ID')} 💠*\n`;
            teksLelang += `🔥 Tawaran Tertinggi: *${dataLelang.bidTertinggi.toLocaleString('id-ID')} 💠* (${penawar})\n`;
            teksLelang += `------------------------------\n`;
        });

        teksLelang += `\n💡 _Ketik !bid @PemilikLama [nominal] untuk menawar toko tersebut._`;

        await sock.sendMessage(chatId, { text: teksLelang, mentions: daftarLelang.map(d => `${d[0]}@s.whatsapp.net`) }, { quoted: msg });
    }
};