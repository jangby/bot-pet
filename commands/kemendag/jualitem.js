const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'jualitem',
    description: 'Menjual item/makanan dari tas ke Bank (setengah harga)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!jualitem 5 gandum`' }, { quoted: msg });
        }

        let jumlahJual = parseInt(args[0]);
        if (isNaN(jumlahJual) || jumlahJual < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Jumlah barang yang ingin dijual harus berupa angka dan lebih dari 0!' }, { quoted: msg });
        }

        const namaBarangDicari = args.slice(1).join(' ').toLowerCase();
        const tas = global.db.inventory[senderNumber];

        if (!tas) {
            return await sock.sendMessage(chatId, { text: '🎒 Tas kamu masih kosong!' }, { quoted: msg });
        }

        // Gabungkan semua barang di pasar induk untuk referensi
        let semuaBarang = {};
        if (global.db.market && global.db.market.pasarInduk) {
            for (const kategori in global.db.market.pasarInduk) {
                Object.assign(semuaBarang, global.db.market.pasarInduk[kategori]);
            }
        }

        // Cari barang di tas pemain
        let idBarangDitemukan = null;
        let infoBarang = null;

        for (const [idBarang, jumlah] of Object.entries(tas)) {
            if (jumlah > 0) {
                const info = semuaBarang[idBarang];
                if (info && info.nama.toLowerCase().includes(namaBarangDicari)) {
                    idBarangDitemukan = idBarang;
                    infoBarang = info;
                    break;
                }
            }
        }

        if (!idBarangDitemukan) {
            return await sock.sendMessage(chatId, { text: `🔍 Kamu tidak memiliki "${namaBarangDicari}" di dalam tas.` }, { quoted: msg });
        }

        if (tas[idBarangDitemukan] < jumlahJual) {
            return await sock.sendMessage(chatId, { text: `📦 Stok di tasmu tidak cukup! Kamu hanya punya ${tas[idBarangDitemukan]}x ${infoBarang.nama}.` }, { quoted: msg });
        }

        // Hitung harga jual (50% dari harga modal)
        const modalAsli = infoBarang.modal || infoBarang.harga || 50; // Jaga-jaga jika pakai atribut "harga"
        const hargaJualSatuan = Math.floor(modalAsli / 2);
        const totalPendapatan = hargaJualSatuan * jumlahJual;

        // Eksekusi transaksi
        tas[idBarangDitemukan] -= jumlahJual;
        global.db.player[senderNumber].saldo += totalPendapatan;
        global.db.bank.brankas -= totalPendapatan; // Uang ditarik dari bank

        // Simpan database
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        const teksBerhasil = `✅ *BARANG TERJUAL!*\n\nKamu menjual *${jumlahJual}x ${infoBarang.nama}* ke loak Bank Sentral.\n\n💰 Uang sebesar *${totalPendapatan.toLocaleString('id-ID')} Nexus* telah masuk ke dompetmu!`;
        
        await sock.sendMessage(chatId, { text: teksBerhasil }, { quoted: msg });
    }
};
