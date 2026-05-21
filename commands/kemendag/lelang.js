const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'lelang',
    description: 'Melihat daftar toko yang disita dan sedang dilelang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Pastikan laci lelang dan tokoPemain ada
        if (!global.db.market) global.db.market = {};
        if (!global.db.market.lelang) global.db.market.lelang = {};
        if (!global.db.market.tokoPemain) global.db.market.tokoPemain = {};

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

        // Resolve nomor pemilik lama ke JID asli (anti-LID)
        let groupParticipants = [];
        if (chatId.endsWith('@g.us')) {
            try {
                const metaGrup = await sock.groupMetadata(chatId);
                groupParticipants = metaGrup.participants;
            } catch(e) {}
        }

        const resolveJid = (nomor) => {
            if (nomor === 'BANK_SENTRAL') return null;
            if (groupParticipants.length > 0) {
                const part = groupParticipants.find(p =>
                    (p.id && p.id.includes(nomor)) || (p.lid && p.lid.includes(nomor))
                );
                if (part && part.id.endsWith('@s.whatsapp.net')) return { jid: part.id, num: part.id.split('@')[0] };
            }
            return { jid: `${nomor}@s.whatsapp.net`, num: nomor };
        };

        const mentionsLelang = [];
        daftarLelang.forEach(([idLama, dataLelang], index) => {
            const rPemilik = resolveJid(idLama);
            const rPenawar = dataLelang.pemenangSementara ? resolveJid(dataLelang.pemenangSementara) : null;
            const penawarTeks = rPenawar ? `@${rPenawar.num}` : 'Belum Ada';

            teksLelang += `🏢 *${dataLelang.nama}* (Pemilik Lama: @${rPemilik ? rPemilik.num : idLama})\n`;
            teksLelang += `🏷️ Kategori: ${dataLelang.kategori.toUpperCase()}\n`;
            teksLelang += `💰 Harga Buka: *${dataLelang.hargaBuka.toLocaleString('id-ID')} 💪*\n`;
            teksLelang += `🔥 Tawaran Tertinggi: *${dataLelang.bidTertinggi.toLocaleString('id-ID')} 💪* (${penawarTeks})\n`;
            teksLelang += `------------------------------\n`;

            if (rPemilik) mentionsLelang.push(rPemilik.jid);
            if (rPenawar) mentionsLelang.push(rPenawar.jid);
        });

        teksLelang += `\n💡 _Ketik !bid @PemilikLama [nominal] untuk menawar toko tersebut._`;

        await sock.sendMessage(chatId, { text: teksLelang, mentions: mentionsLelang }, { quoted: msg });
    }
};
