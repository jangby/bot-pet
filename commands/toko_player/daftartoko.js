const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'daftartoko',
    description: 'Membeli lisensi untuk membuka toko ritel',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];
        const isGroup = chatId.endsWith('@g.us');

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.market) global.db.market = { pasarInduk: {}, tokoPemain: {}, lelang: {} }; 
        if (!global.db.market.tokoPemain) global.db.market.tokoPemain = {};

        if (global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu sudah memiliki lisensi toko yang aktif!' }, { quoted: msg });
        }

        const kategoriTersedia = ['karnivora', 'herbivora', 'pescivora', 'mythical', 'apotek'];
        
        if (args.length < 2) {
            let infoKategori = `*Kuota Lisensi Tersedia (Maks 2/Kategori):*\n`;
            kategoriTersedia.forEach(k => {
                const jumlahPesaing = Object.values(global.db.market.tokoPemain).filter(t => t.kategori === k).length;
                const sisaKuota = 2 - jumlahPesaing;
                const status = sisaKuota > 0 ? `Tersisa ${sisaKuota} Lisensi` : `❌ PENUH`;
                infoKategori += `• ${k.toUpperCase()} [${status}]\n`;
            });

            return await sock.sendMessage(chatId, { 
                text: `🏪 *PENDAFTARAN LISENSI TOKO* 🏪\n\nBiaya Lisensi: *2.000 Nexus*\n\n${infoKategori}\n*Cara Daftar:*\n\`!daftartoko [kategori] [Nama Toko Kamu]\`` 
            });
        }

        const kategoriPilihan = args[0].toLowerCase();
        const namaToko = args.slice(1).join(' ');

        if (!kategoriTersedia.includes(kategoriPilihan)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kategori tidak valid.' });
        }

        // --- 🚧 SISTEM LIMITASI KUOTA TOKO 🚧 ---
        const tokoSejenis = Object.values(global.db.market.tokoPemain).filter(t => t.kategori === kategoriPilihan).length;
        if (tokoSejenis >= 2) {
            return await sock.sendMessage(chatId, { text: `⛔ *LISENSI HABIS!*\nBank Sentral sudah tidak mengeluarkan lisensi untuk kategori *${kategoriPilihan.toUpperCase()}* karena sudah ada 2 toko yang beroperasi.\n\n_Silakan tunggu toko lain bangkrut (masuk pelelangan) atau beli dari pemain lain._` }, { quoted: msg });
        }
        // -----------------------------------------

        const hargaLisensi = 2000;
        const saldoPemain = parseInt(global.db.player[senderNumber].saldo) || 0;

        if (saldoPemain < hargaLisensi) {
            return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup!\nBiaya lisensi: *${hargaLisensi.toLocaleString('id-ID')} Nexus*.` });
        }

        global.db.player[senderNumber].saldo = saldoPemain - hargaLisensi;
        global.db.bank.brankas = parseInt(global.db.bank.brankas || global.MAX_SUPPLY) + hargaLisensi;

        const randomToken = Math.random().toString(36).substring(2, 15);

        global.db.market.tokoPemain[senderNumber] = {
            nama: namaToko,
            kategori: kategoriPilihan,
            etalase: {}, 
            pendapatan: 0,
            tokenWeb: randomToken,
            terakhirLaku: Date.now() // ⏱️ Sensor Auto-Lelang
        };

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        // --- 🌐 LINK DASHBOARD SUDAH MENGGUNAKAN DOMAIN HTTPS 🌐 ---
        const pesanRahasia = `🎉 *SELAMAT! TOKO DIBUKA*\n\nKelola stok dan harga barangmu melalui tautan rahasia ini (Jangan bagikan ke siapapun):\n\n🔐 https://pet.jagokas.online/dashboard?token=${randomToken}`;

        if (isGroup) {
            await sock.sendMessage(chatId, { text: `🏪 *${namaToko}* resmi dibuka oleh @${senderNumber}!\nLisensi kategori *${kategoriPilihan.toUpperCase()}* telah diamankan.`, mentions: [senderId] });
            await sock.sendMessage(senderId, { text: pesanRahasia }); // Kirim link ke Japri
        } else {
            await sock.sendMessage(chatId, { text: pesanRahasia });
        }
    }
};