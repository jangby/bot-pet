const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gacha',
    description: 'Membuka kotak gacha harian (1x Sehari) berisi uang, item, atau pet!',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Persiapan Database
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0 };
        if (!global.db.inventory) global.db.inventory = {};
        if (!global.db.inventory[senderNumber]) global.db.inventory[senderNumber] = {};
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.pet[senderNumber]) global.db.pet[senderNumber] = [];

        // 2. Cek Cooldown Harian (24 Jam)
        const waktuTerakhir = global.db.player[senderNumber].lastGacha || 0;
        const cooldownSelesai = waktuTerakhir + (24 * 60 * 60 * 1000); // 24 Jam dalam milidetik

        if (Date.now() < cooldownSelesai) {
            // Menghitung sisa waktu (Jam dan Menit)
            const sisaTotalMenit = Math.ceil((cooldownSelesai - Date.now()) / 60000);
            const sisaJam = Math.floor(sisaTotalMenit / 60);
            const sisaMenit = sisaTotalMenit % 60;
            
            return await sock.sendMessage(chatId, { 
                text: `⏳ *GACHA SEDANG COOLDOWN!*\n\nKamu sudah membuka kotak gacha hari ini.\nKembalilah dalam *${sisaJam} Jam ${sisaMenit} Menit* untuk memutar gacha lagi!` 
            }, { quoted: msg });
        }

        // Catat waktu gacha sekarang
        global.db.player[senderNumber].lastGacha = Date.now();

        // --- 3. MESIN RNG (DROP RATE GACHA) ---
        const roll = Math.random() * 100;
        let teksHasil = `🎁 *DAILY GACHA OPENED!* 🎁\n\nMemutar mesin gacha...\nKamu mendapatkan:\n\n`;

        if (roll < 60) {
            // 💰 60% Dapet Uang Nexus (100 - 2000 Nexus)
            const dapatUang = Math.floor(Math.random() * 1900) + 100;
            global.db.player[senderNumber].saldo += dapatUang;
            if (global.db.bank.brankas >= dapatUang) global.db.bank.brankas -= dapatUang;
            
            teksHasil += `💵 *${dapatUang.toLocaleString('id-ID')} 💠 Nexus!*\n\n_Uang tunai langsung masuk ke dalam dompetmu._`;

        } else if (roll < 85) {
            // 🍖 25% Dapet Makanan (Dari Pasar Induk)
            const makananTersedia = ['daging_rendah', 'sayur_kol', 'roti_gandum', 'ikan_salmon', 'apel_emas'];
            const itemDapat = makananTersedia[Math.floor(Math.random() * makananTersedia.length)];
            
            global.db.inventory[senderNumber][itemDapat] = (global.db.inventory[senderNumber][itemDapat] || 0) + 1;
            
            teksHasil += `🎒 *1x Item Makanan (${itemDapat.replace('_', ' ').toUpperCase()})*\n\n_Barang langsung masuk ke dalam tas (!inv)._`;

        } else if (roll < 95) {
            // ⚔️ 10% Dapet Gear / Obat
            const gearTersedia = ['cakar_besi', 'kalung_darah', 'perban', 'obat_pencernaan', 'zirah_besi'];
            const gearDapat = gearTersedia[Math.floor(Math.random() * gearTersedia.length)];
            
            global.db.inventory[senderNumber][gearDapat] = (global.db.inventory[senderNumber][gearDapat] || 0) + 1;
            
            teksHasil += `🛡️ *1x Perlengkapan Langka (${gearDapat.replace('_', ' ').toUpperCase()})!*\n\n_Perlengkapan telah disimpan di dalam tas (!inv)._`;

        } else {
            // 🐉 5% JACKPOT: DAPET PET BARU!
            const petJackpot = [
                { nama: 'Kucing Hoki', spesies: 'Kucing Liar 🐱', power: 5, diet: 'Karnivora', rarity: 'Common' },
                { nama: 'Serigala Malam', spesies: 'Serigala Salju 🐺', power: 20, diet: 'Karnivora', rarity: 'Rare' },
                { nama: 'Banteng Gacha', spesies: 'Banteng Liar 🐃', power: 28, diet: 'Herbivora', rarity: 'Rare' },
                { nama: 'Burung Suci', spesies: 'Phoenix 🐦‍🔥', power: 110, diet: 'Omnivora', rarity: 'Legendary' } // Super Jackpot!
            ];
            
            const petDapat = petJackpot[Math.floor(Math.random() * petJackpot.length)];
            
            // Buat ID urut baru untuk pet
            let idUnik = 1;
            if (global.db.pet[senderNumber].length > 0) {
                const daftarId = global.db.pet[senderNumber].map(p => parseInt(p.id) || 0);
                idUnik = Math.max(...daftarId) + 1;
            }

            const petBaru = {
                id: idUnik, 
                nama: petDapat.nama, 
                spesies: petDapat.spesies,
                diet: petDapat.diet,
                rarity: petDapat.rarity,
                level: 1,
                xp: 0,
                health: 100,
                lapar: 100,
                kondisi: 'Sehat',
                power: petDapat.power,
                lastFeed: Date.now()
            };

            global.db.pet[senderNumber].push(petBaru);
            
            teksHasil += `🎉🎊 *JACKPOT!!!* 🎊🎉\n\nSeekor *${petDapat.spesies}* [${petDapat.rarity}] melompat keluar dari kotak gacha!\n\nPeliharaan ini langsung masuk ke kandangmu (!mypet) dengan ID: *${idUnik}*.`;
        }

        // 4. Simpan Seluruh Perubahan ke Database
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));

        // Animasi reaksi dan kirim pesan
        await sock.sendMessage(chatId, { react: { text: '🎰', key: msg.key } });
        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};