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

        const petId = parseInt(args[0]) || args[0]; // Mendukung ID angka maupun string
        const namaMakananDicari = args.slice(1).join(' ').toLowerCase();

        // 1. Validasi Kandang Peliharaan
        if (!global.db.pet || !global.db.pet[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum punya peliharaan! Beli di `!tokohewan`.' }, { quoted: msg });
        }

        const kandang = global.db.pet[senderNumber];
        const petTarget = kandang.find(p => p.id == petId); // Menggunakan == agar fleksibel

        if (!petTarget) {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan di kandangmu.` }, { quoted: msg });
        }

        // 2. Validasi Inventory
        const tas = global.db.inventory[senderNumber];
        if (!tas) return await sock.sendMessage(chatId, { text: '🎒 Tas kamu kosong! Beli makanan dulu di toko.' });

        let semuaBarang = {};
        let kategoriBarangMap = {}; 
        for (const [kategori, items] of Object.entries(global.db.market.pasarInduk)) {
            for (const [idBarang, info] of Object.entries(items)) {
                semuaBarang[idBarang] = info;
                kategoriBarangMap[idBarang] = kategori.toLowerCase(); // Paksa huruf kecil
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

        // A. Cek Diet Spesifik (SUDAH DIPERBAIKI)
        const dietPet = (petTarget.diet || '').toLowerCase();
        const kategoriMakanan = kategoriBarangMap[idMakananDitemukan];
        let bisaDimakan = false;

        if (kategoriMakanan === 'mythical') {
            bisaDimakan = true; // Makanan dewa bisa dimakan siapa saja
        } else if (dietPet === 'omnivora' && (kategoriMakanan === 'karnivora' || kategoriMakanan === 'herbivora')) {
            bisaDimakan = true; // Omnivora bebas makan daging atau tumbuhan
        } else if (dietPet === kategoriMakanan) {
            bisaDimakan = true; // Karnivora makan karnivora, Herbivora makan herbivora
        }

        if (!bisaDimakan) {
            return await sock.sendMessage(chatId, { text: `🤢 *DITOLAK!*\n${petTarget.nama} si ${petTarget.spesies} adalah seekor *${petTarget.diet.toUpperCase()}*.\nDia menolak dan membuang muka saat disodori ${infoMakanan.nama}!` }, { quoted: msg });
        }

        // Hitung kelaparan aktual
        const jamLalu = Math.floor((Date.now() - petTarget.lastFeed) / (1000 * 60 * 60));
        let laparSekarang = Math.max(0, petTarget.lapar - (jamLalu * 5));

        // B. Mekanisme Overfeed (Sakit Pencernaan)
        if (laparSekarang >= 90) {
            petTarget.kondisi = 'Sakit (Pencernaan)';
            petTarget.lapar = 30; 
            petTarget.lastFeed = Date.now();
            tas[idMakananDitemukan] -= 1; 

            fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
            fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

            return await sock.sendMessage(chatId, { text: `🤮 *OVERFEED!*\nKamu memaksa ${petTarget.nama} makan saat dia masih kenyang!\nDia memuntahkan makanannya. Kondisinya sekarang: *Sakit (Pencernaan)*.\n\n_Segera beli obat atau bawa ke Dokter Hewan!_` }, { quoted: msg });
        }

        // C. Eksekusi Makan Normal & Tambah XP
        const poinKenyang = parseInt(infoMakanan.efek.replace(/[^0-9]/g, '')) || 20;
        petTarget.lapar = Math.min(100, laparSekarang + poinKenyang);
        petTarget.lastFeed = Date.now();
        tas[idMakananDitemukan] -= 1;

        // Memberi makan menambah sedikit XP (5-10 XP)
        const xpMakan = Math.floor(Math.random() * 6) + 5;
        if (typeof petTarget.xp !== 'number') petTarget.xp = 0;
        petTarget.xp += xpMakan;

        let teksKenyang = `😋 *NYAM!*\n${petTarget.nama} memakan ${infoMakanan.nama} dengan lahap.\nStatus Kenyang: *${petTarget.lapar}%*\n✨ _Mendapat +${xpMakan} XP_`;

        // D. Sistem Auto Level-Up Dinamis
        let targetXP = petTarget.level * 100; 
        let naikLevel = false;
        let levelLama = petTarget.level;

        while (petTarget.xp >= targetXP) {
            petTarget.level += 1;
            petTarget.xp -= targetXP;     
            petTarget.power += 10;        
            
            targetXP = petTarget.level * 100; 
            naikLevel = true;
        }

        if (naikLevel) {
            teksKenyang += `\n\n🎉 *LEVEL UP!*\n${petTarget.nama} naik dari Level ${levelLama} ke Level ${petTarget.level}!\n💪 Power meningkat menjadi ${petTarget.power}!`;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        await sock.sendMessage(chatId, { react: { text: '🍖', key: msg.key } });
        await sock.sendMessage(chatId, { text: teksKenyang }, { quoted: msg });
    }
};