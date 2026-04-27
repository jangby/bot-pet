const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'beligear',
    description: 'Membeli barang dari Nexus Mart',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!beligear [id_barang] [jumlah]`\nLebih mudah beli langsung dari link `!tokogear`!' }, { quoted: msg });
        }

        const idBarang = args[0].toLowerCase();
        let jumlahBeli = 1;
        
        if (args[1] && !isNaN(args[1])) {
            jumlahBeli = parseInt(args[1]);
        }
        if (jumlahBeli < 1) jumlahBeli = 1;

        // --- DATABASE BARANG RESMI (Auto-Sync) ---
        // Jika belum ada di pasarInduk, bot akan otomatis menyuntikkannya agar bisa dipakai!
        const daftarBarangResmi = {
            karnivora: {
                'daging_rendah': { nama: 'Daging Biasa', tipe: 'makanan', efek: '+20 Kenyang', harga: 50 },
                'daging_premium': { nama: 'Daging Premium', tipe: 'makanan', efek: '+50 Kenyang', harga: 120 },
                'ikan_salmon': { nama: 'Ikan Salmon', tipe: 'makanan', efek: '+60 Kenyang', harga: 150 }
            },
            herbivora: {
                'rumput_liar': { nama: 'Rumput Liar', tipe: 'makanan', efek: '+20 Kenyang', harga: 50 },
                'sayur_kol': { nama: 'Sayur Kol Segar', tipe: 'makanan', efek: '+40 Kenyang', harga: 100 },
                'apel_emas': { nama: 'Apel Merah', tipe: 'makanan', efek: '+80 Kenyang', harga: 200 }
            },
            omnivora: {
                'roti_gandum': { nama: 'Roti Gandum', tipe: 'makanan', efek: '+30 Kenyang', harga: 80 },
                'nasi_goreng': { nama: 'Nasi Goreng', tipe: 'makanan', efek: '+60 Kenyang', harga: 150 }
            },
            mythical: {
                'kristal_bintang': { nama: 'Kristal Bintang', tipe: 'makanan', efek: '+100 Kenyang', harga: 500 }
            },
            medis: {
                'perban': { nama: 'Perban Medis', tipe: 'obat', efek: 'Sembuh Luka Fisik', harga: 150 },
                'obat_pencernaan': { nama: 'Obat Sirup', tipe: 'obat', efek: 'Sembuh Sakit Perut', harga: 150 },
                'panacea': { nama: 'Ramuan Panacea', tipe: 'obat', efek: 'Sembuh Segala Penyakit', harga: 800 }
            }
        };

        // Otomatis masukkan ke pasarInduk jika belum ada
        if (!global.db.market.pasarInduk) global.db.market.pasarInduk = {};
        for (let kategori in daftarBarangResmi) {
            if (!global.db.market.pasarInduk[kategori]) global.db.market.pasarInduk[kategori] = {};
            for (let itemKey in daftarBarangResmi[kategori]) {
                global.db.market.pasarInduk[kategori][itemKey] = daftarBarangResmi[kategori][itemKey];
            }
        }

        // Cari barang yang mau dibeli
        let itemDitemukan = null;
        for (const kategori in global.db.market.pasarInduk) {
            if (global.db.market.pasarInduk[kategori][idBarang]) {
                itemDitemukan = global.db.market.pasarInduk[kategori][idBarang];
                break;
            }
        }

        if (!itemDitemukan) {
            return await sock.sendMessage(chatId, { text: `⚠️ Barang dengan kode "${idBarang}" tidak ditemukan.` }, { quoted: msg });
        }

        const totalHarga = itemDitemukan.harga * jumlahBeli;

        // Cek Saldo Pemain
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0 };
        const saldoPemain = parseInt(global.db.player[senderNumber].saldo) || 0;

        if (saldoPemain < totalHarga) {
             return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup! Kamu butuh *${totalHarga.toLocaleString('id-ID')} 💠* untuk membeli ${jumlahBeli}x ${itemDitemukan.nama}.` }, { quoted: msg });
        }

        // Transaksi
        global.db.player[senderNumber].saldo -= totalHarga;
        global.db.bank.brankas += totalHarga;

        if (!global.db.inventory) global.db.inventory = {};
        if (!global.db.inventory[senderNumber]) global.db.inventory[senderNumber] = {};
        if (!global.db.inventory[senderNumber][idBarang]) global.db.inventory[senderNumber][idBarang] = 0;

        global.db.inventory[senderNumber][idBarang] += jumlahBeli;

        // Simpan Data
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

        await sock.sendMessage(chatId, { text: `🛒 *PEMBELIAN BERHASIL!*\n\nKamu telah membeli *${jumlahBeli}x ${itemDitemukan.nama}* seharga ${totalHarga.toLocaleString('id-ID')} 💠.\n\n_Barang langsung masuk ke dalam tas, silakan cek dengan !inv_` }, { quoted: msg });
    }
};