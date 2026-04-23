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
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Tag pemilik lama toko yang lelangnya ingin kamu tutup!\nContoh: `!deal @PemilikLama`' }, { quoted: msg });
        }

        const pemilikLamaNumber = mentioned[0].replace(/:\d+/, '').split('@')[0];
        const lelangTarget = global.db.market.lelang[pemilikLamaNumber];

        if (!lelangTarget) return await sock.sendMessage(chatId, { text: '⚠️ Toko tersebut tidak ada di Balai Lelang.' }, { quoted: msg });

        if (!lelangTarget.pemenangSementara) {
            return await sock.sendMessage(chatId, { text: '⚠️ Belum ada yang menawar toko ini! Tidak bisa deal.' }, { quoted: msg });
        }

        // Jika penjualnya adalah pemain asli, dia yang harus mengetik !deal
        // Jika tokonya hasil sitaan Bank, siapa saja boleh menutup lelang ini untuk pemain tertinggi
        const BATAS_BANGKRUT = 2 * 24 * 60 * 60 * 1000;
        const isSitaanBank = (Date.now() - lelangTarget.waktuSita) <= BATAS_BANGKRUT; // Penanda sederhana ini barang sitaan

        if (senderNumber !== pemilikLamaNumber && !isSitaanBank) {
            return await sock.sendMessage(chatId, { text: '⚠️ Hanya pemilik lama yang bisa mengetik !deal untuk menyetujui harga lelang.' }, { quoted: msg });
        }

        const pemenang = lelangTarget.pemenangSementara;
        const hargaAkhir = lelangTarget.bidTertinggi;

        // --- PINDAHTANGAN ASET ---
        // Distribusi Uang
        if (isSitaanBank) {
            // Uang masuk ke brankas Bank
            global.db.bank.brankas += hargaAkhir;
        } else {
            // Uang masuk ke dompet pemilik lama
            global.db.player[pemilikLamaNumber].saldo = parseInt(global.db.player[pemilikLamaNumber].saldo || 0) + hargaAkhir;
        }

        // Pindahkan toko ke pemenang
        global.db.market.tokoPemain[pemenang] = {
            nama: lelangTarget.nama,
            kategori: lelangTarget.kategori,
            etalase: lelangTarget.etalase,
            tokenWeb: lelangTarget.tokenWeb, // Token web lama diwariskan!
            pendapatan: 0,
            terakhirLaku: Date.now()
        };

        // Hapus dari lelang
        delete global.db.market.lelang[pemilikLamaNumber];

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        const teksDeal = 
`🤝 *AKUISISI TOKO BERHASIL!* 🤝

Toko 🏢 *${lelangTarget.nama}* resmi berpindah tangan ke @${pemenang} dengan harga akhir *${hargaAkhir.toLocaleString('id-ID')} 💠*.

Pemenang mewarisi seluruh etalase barang dan tautan Web Dashboard toko ini.
_Silakan ketik !mytoko untuk mengecek._`;

        await sock.sendMessage(chatId, { text: teksDeal, mentions: [`${pemenang}@s.whatsapp.net`] }, { quoted: msg });
    }
};