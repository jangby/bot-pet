const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'deal',
    description: 'Menyetujui tawaran tertinggi dan memindahtangankan toko',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        let pemilikLamaNumber = '';
        if (args.length >= 1 && args[0].toUpperCase() === 'BANK_SENTRAL') {
            pemilikLamaNumber = 'BANK_SENTRAL';
        } else if (mentioned.length > 0) {
            pemilikLamaNumber = mentioned[0].replace(/:\d+/, '').split('@')[0];
        } else {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nKetik: `!deal BANK_SENTRAL` atau `!deal @PemilikLama`' }, { quoted: msg });
        }

        const lelangTarget = global.db.market.lelang[pemilikLamaNumber];

        if (!lelangTarget) return await sock.sendMessage(chatId, { text: '⚠️ Toko tersebut tidak ada di Balai Lelang.' }, { quoted: msg });

        if (!lelangTarget.pemenangSementara) {
            return await sock.sendMessage(chatId, { text: '⚠️ Belum ada yang menawar toko ini! Tidak bisa deal.' }, { quoted: msg });
        }

        const BATAS_BANGKRUT = 2 * 24 * 60 * 60 * 1000;
        const isSitaanBank = pemilikLamaNumber === 'BANK_SENTRAL' || (Date.now() - lelangTarget.waktuSita) <= BATAS_BANGKRUT;

        if (senderNumber !== pemilikLamaNumber && !isSitaanBank) {
            return await sock.sendMessage(chatId, { text: '⚠️ Hanya pemilik lama yang bisa mengetik !deal untuk menyetujui harga lelang.' }, { quoted: msg });
        }

        const pemenang = lelangTarget.pemenangSementara;
        const hargaAkhir = lelangTarget.bidTertinggi;

        // --- PINDAHTANGAN ASET ---
        if (isSitaanBank) {
            global.db.bank.brankas += hargaAkhir; // Uang masuk ke Bank
        } else {
            global.db.player[pemilikLamaNumber].saldo = parseInt(global.db.player[pemilikLamaNumber].saldo || 0) + hargaAkhir; // Uang ke pemilik lama
        }

        // Pindahkan toko ke pemenang
        global.db.market.tokoPemain[pemenang] = {
            nama: lelangTarget.nama,
            kategori: 'serba_ada', // Kategori mutlak menjadi Serba Ada
            etalase: lelangTarget.etalase || {},
            tokenWeb: lelangTarget.tokenWeb, 
            pendapatan: 0,
            terakhirLaku: Date.now()
        };

        // Hapus dari lelang
        delete global.db.market.lelang[pemilikLamaNumber];

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        // Generate Link Toko Baru
        const linkToko = `https://pet.jagokas.online/dashboard?token=${lelangTarget.tokenWeb}`;
        const teksDeal = `🤝 *AKUISISI TOKO BERHASIL!* 🤝\n\nToko 🏢 *${lelangTarget.nama}* resmi berpindah tangan ke @${pemenang} dengan harga *${hargaAkhir.toLocaleString('id-ID')} 💠*.\n\nPemenang mewarisi seluruh isi etalase toko ini.`;

        await sock.sendMessage(chatId, { text: teksDeal, mentions: [`${pemenang}@s.whatsapp.net`] }, { quoted: msg });
        
        // Kirim link manajemen toko ke PM Pemenang
        await sock.sendMessage(`${pemenang}@s.whatsapp.net`, { text: `🎉 Selamat! Kamu berhasil memenangkan lelang toko.\n\nKelola stok barang Serba Ada kamu melalui link rahasia ini:\n🔐 ${linkToko}` });
    }
};