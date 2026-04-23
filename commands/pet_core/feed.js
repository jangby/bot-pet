const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'feed',
    description: 'Memberi makan peliharaan',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!feed 1 daging ayam`\n_(Angka 1 adalah ID peliharaanmu)_' }, { quoted: msg });
        }

        const petId = parseInt(args[0]);
        const namaMakananDicari = args.slice(1).join(' ').toLowerCase();

        // 1. Validasi Kandang Peliharaan
        if (!global.db.pet || !global.db.pet[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum punya peliharaan! Beli telur dengan `!tetas`.' }, { quoted: msg });
        }

        const kandang = global.db.pet[senderNumber];
        const petTarget = kandang.find(p => p.id === petId);

        if (!petTarget) {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan di kandangmu.` }, { quoted: msg });
        }

        // 2. Validasi Inventory
        const tas = global.db.inventory[senderNumber];
        if (!tas) return await sock.sendMessage(chatId, { text: '🎒 Tas kamu kosong! Beli makanan dulu di toko.' });

        // Pemetaan kategori untuk mengecek Diet Peliharaan
        let semuaBarang = {};
        let kategoriBarangMap = {}; 
        for (const [kategori, items] of Object.entries(global.db.market.pasarInduk)) {
            for (const [idBarang, info] of Object.entries(items)) {
                semuaBarang[idBarang] = info;
                kategoriBarangMap[idBarang] = kategori; // Menyimpan info: "daging_ayam" itu "karnivora"
            }
        }

        // 3. Pencarian Makanan di Tas
        let idMakananDitemukan = null;
        let infoMakanan = null;

        for (const [idBarang, jumlah] of Object.entries(tas)) {
            if (jumlah > 0) {
                const info = semuaBarang[idBarang];
                if (info && info.nama.toLowerCase().includes(namaMakananDicari)) {
                    idMakananDitemukan = idBarang;
                    infoMakanan = info;
                    break;
                }
            }
        }

        if (!idMakananDitemukan) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki "${namaMakananDicari}" di dalam tas.` }, { quoted: msg });
        }

        if (infoMakanan.tipe !== 'makanan') {
            return await sock.sendMessage(chatId, { text: `⚠️ Hei! ${infoMakanan.nama} itu bukan makanan! Masa hewan peliharaan disuruh menelan ${infoMakanan.nama}?` }, { quoted: msg });
        }

        // --- ⚖️ SISTEM LOGIKA RPG ⚖️ ---

        // A. Cek Diet Spesifik
        const kategoriMakanan = kategoriBarangMap[idMakananDitemukan];
        if (petTarget.diet !== kategoriMakanan && kategoriMakanan !== 'mythical') { // Mythical (kristal) bisa dimakan semua jika terpaksa
            return await sock.sendMessage(chatId, { text: `🤢 *DITOLAK!*\n${petTarget.nama} si ${petTarget.spesies} adalah seekor *${petTarget.diet.toUpperCase()}*.\nDia menolak dan membuang muka saat disodori ${infoMakanan.nama}!` }, { quoted: msg });
        }

        // Hitung kelaparan aktual
        const jamLalu = Math.floor((Date.now() - petTarget.lastFeed) / (1000 * 60 * 60));
        let laparSekarang = Math.max(0, petTarget.lapar - (jamLalu * 5));

        // B. Mekanisme Overfeed (Sakit Pencernaan)
        if (laparSekarang >= 90) {
            petTarget.kondisi = 'Sakit (Pencernaan)';
            petTarget.lapar = 30; // Karena muntah, laparnya langsung anjlok
            petTarget.lastFeed = Date.now();
            tas[idMakananDitemukan] -= 1; // Makanan tetap hangus terbuang

            fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
            fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

            return await sock.sendMessage(chatId, { text: `🤮 *OVERFEED!*\nKamu memaksa ${petTarget.nama} makan saat dia masih kenyang!\nDia memuntahkan makanannya. Kondisinya sekarang: *Sakit (Pencernaan)*.\n\n_Segera beli obat atau bawa ke Dokter Hewan!_` }, { quoted: msg });
        }

        // C. Eksekusi Makan Normal
        // Mengambil angka efek dari string (misal: "+20 Kenyang" -> 20)
        const poinKenyang = parseInt(infoMakanan.efek.replace(/[^0-9]/g, '')) || 20;
        
        petTarget.lapar = Math.min(100, laparSekarang + poinKenyang);
        petTarget.lastFeed = Date.now();
        tas[idMakananDitemukan] -= 1;

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        // Silent Action / Interaksi tanpa spam panjang
        await sock.sendMessage(chatId, { react: { text: '🍖', key: msg.key } });
        await sock.sendMessage(chatId, { text: `😋 *NYAM!*\n${petTarget.nama} memakan ${infoMakanan.nama} dengan lahap.\nStatus Kenyang: *${petTarget.lapar}%*` }, { quoted: msg });
    }
};