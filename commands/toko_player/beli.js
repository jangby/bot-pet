const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'beli',
    description: 'Membeli barang dari toko pemain lain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const buyerNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Tag pemilik toko yang ingin kamu beli barangnya!\nContoh: `!beli @nomor 2 pil ringan`' }, { quoted: msg });
        }

        const sellerId = mentioned[0];
        const sellerNumber = sellerId.replace(/:\d+/, '').split('@')[0];

        if (buyerNumber === sellerNumber) return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa membeli dari tokomu sendiri.' }, { quoted: msg });

        const argsTanpaTag = args.filter(a => !a.includes('@'));
        let jumlahBeli = 1; 
        let namaBarangDicari = '';

        if (argsTanpaTag.length > 0 && !isNaN(parseInt(argsTanpaTag[0]))) {
            jumlahBeli = parseInt(argsTanpaTag[0]);
            namaBarangDicari = argsTanpaTag.slice(1).join(' ').toLowerCase();
        } else {
            namaBarangDicari = argsTanpaTag.join(' ').toLowerCase();
        }

        if (jumlahBeli <= 0) return await sock.sendMessage(chatId, { text: '⚠️ Jumlah beli harus lebih dari 0!' });
        if (!namaBarangDicari) return await sock.sendMessage(chatId, { text: '⚠️ Sebutkan nama barang yang ingin dibeli!' });

        const dataToko = global.db.market.tokoPemain[sellerNumber];
        if (!dataToko) return await sock.sendMessage(chatId, { text: '⚠️ Pemain tersebut tidak memiliki lisensi toko aktif.' });

        const kategoriBarang = global.db.market.pasarInduk[dataToko.kategori];
        let idBarangDitemukan = null;
        let infoBarangInduk = null;

        for (const [idBarang, dataEtalase] of Object.entries(dataToko.etalase)) {
            if (dataEtalase.stok > 0) {
                const infoAsli = kategoriBarang[idBarang];
                if (infoAsli && infoAsli.nama.toLowerCase().includes(namaBarangDicari)) {
                    idBarangDitemukan = idBarang;
                    infoBarangInduk = infoAsli;
                    break;
                }
            }
        }

        if (!idBarangDitemukan) return await sock.sendMessage(chatId, { text: `⚠️ Barang "${namaBarangDicari}" tidak ditemukan atau stok habis.` });

        const itemEtalase = dataToko.etalase[idBarangDitemukan];
        if (itemEtalase.stok < jumlahBeli) return await sock.sendMessage(chatId, { text: `⚠️ Stok tidak cukup! Sisa stok hanya ${itemEtalase.stok}.` });

        const totalHarga = itemEtalase.harga * jumlahBeli;
        
        if (!global.db.player[buyerNumber]) global.db.player[buyerNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.inventory) global.db.inventory = {};
        if (!global.db.inventory[buyerNumber]) global.db.inventory[buyerNumber] = {};

        const uangPembeli = parseInt(global.db.player[buyerNumber].saldo) || 0;
        if (uangPembeli < totalHarga) return await sock.sendMessage(chatId, { text: `⚠️ Uangmu tidak cukup! Tagihan: *${totalHarga.toLocaleString('id-ID')} 💠*.` });

        // --- 6. EKSEKUSI TRANSAKSI P2P ---
        global.db.player[buyerNumber].saldo -= totalHarga;
        global.db.player[sellerNumber].saldo = parseInt(global.db.player[sellerNumber].saldo || 0) + totalHarga;

        itemEtalase.stok -= jumlahBeli;
        dataToko.pendapatan = (dataToko.pendapatan || 0) + totalHarga; 
        
        // ⏱️ RESET TIMER KEBANGKRUTAN KARENA ADA PENJUALAN!
        dataToko.terakhirLaku = Date.now();

        if (!global.db.inventory[buyerNumber][idBarangDitemukan]) global.db.inventory[buyerNumber][idBarangDitemukan] = 0;
        global.db.inventory[buyerNumber][idBarangDitemukan] += jumlahBeli;

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        const teksPembeli = `🛒 *TRANSAKSI BERHASIL*\nPembelian di *${dataToko.nama}* sukses.\n📦 ${jumlahBeli}x ${infoBarangInduk.nama}\n💸 Total: *${totalHarga.toLocaleString('id-ID')} 💠*`;
        await sock.sendMessage(chatId, { text: teksPembeli }, { quoted: msg });
    }
};