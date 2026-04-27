const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'deal',
    description: 'Menyetujui tawaran tertinggi dan memindahtangankan toko yang sedang kamu lelang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Cek apakah Bank Sentral yang deal (Admin Only)
        const isSitaanBank = (args.length >= 1 && args[0].toUpperCase() === 'BANK_SENTRAL');
        
        // Target lelangnya adalah diri si pengirim sendiri (Kecuali jika ini aksi Bank Sentral)
        const targetLelangId = isSitaanBank ? 'BANK_SENTRAL' : senderNumber;
        
        // 2. Ambil data lelang
        const lelangTarget = global.db.market.lelang[targetLelangId];

        if (!lelangTarget) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak sedang melelang toko apapun di Balai Lelang.' }, { quoted: msg });
        }

        if (!lelangTarget.pemenangSementara) {
            return await sock.sendMessage(chatId, { text: '⚠️ Belum ada satupun pemain yang memberikan penawaran (bid) untuk tokomu! Tunggu sampai ada yang menawar.' }, { quoted: msg });
        }

        const pemenang = lelangTarget.pemenangSementara;
        const hargaAkhir = lelangTarget.bidTertinggi;

        // --- 3. PINDAHTANGAN ASET & UANG ---
        if (isSitaanBank) {
            global.db.bank.brankas += hargaAkhir; // Uang masuk kas Bank
        } else {
            // Uang hasil penjualan masuk ke saldo pemilik lama
            global.db.player[senderNumber].saldo = parseInt(global.db.player[senderNumber].saldo || 0) + hargaAkhir; 
        }

        // Memindahkan lisensi toko ke si pemenang
        global.db.market.tokoPemain[pemenang] = {
            nama: lelangTarget.nama,
            kategori: 'serba_ada', // Kategori mutlak menjadi Serba Ada
            etalase: lelangTarget.etalase || {},
            tokenWeb: lelangTarget.tokenWeb, 
            pendapatan: 0,
            terakhirLaku: Date.now()
        };

        // Hapus data dari balai lelang
        delete global.db.market.lelang[targetLelangId];

        // 4. Simpan perubahan ke Database
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        // 5. Generate Link Toko & Pengumuman
        const linkToko = `https://d687-180-241-241-59.ngrok-free.app/dashboard?token=${lelangTarget.tokenWeb}`;
        const teksDeal = `🤝 *AKUISISI TOKO BERHASIL!* 🤝\n\nPenjual telah menyetujui harga! Toko 🏢 *${lelangTarget.nama}* resmi berpindah tangan ke @${pemenang} dengan harga akhir *${hargaAkhir.toLocaleString('id-ID')} 💠*.\n\nPemenang mewarisi seluruh isi etalase toko ini.`;

        await sock.sendMessage(chatId, { text: teksDeal, mentions: [`${pemenang}@s.whatsapp.net`] }, { quoted: msg });
        
        // Kirim link manajemen toko ke PM Pemenang (Pemilik Baru)
        await sock.sendMessage(`${pemenang}@s.whatsapp.net`, { text: `🎉 Selamat! Kamu berhasil memenangkan lelang toko.\n\nKelola stok barang Serba Ada kamu melalui link rahasia ini:\n🔐 ${linkToko}` });
    }
};