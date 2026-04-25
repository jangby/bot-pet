const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'berburu',
    description: 'Mengirim peliharaan ke hutan untuk mencari Nexus atau barang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!berburu [ID Pet]`\nContoh: `!berburu 1`' }, { quoted: msg });
        }

        const petId = parseInt(args[0]);

        // 1. Validasi Kepemilikan & Kondisi Pet
        if (!global.db.pet || !global.db.pet[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum punya peliharaan! Adopsi dulu di `!tokohewan`.' }, { quoted: msg });
        }

        const petTarget = global.db.pet[senderNumber].find(p => p.id === petId);

        if (!petTarget) return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan.` });
        if (petTarget.kondisi !== 'Sehat') return await sock.sendMessage(chatId, { text: `⚠️ ${petTarget.nama} sedang sakit! Obati dulu sebelum disuruh bekerja keras.` });

        // Hitung lapar aktual (berkurang 5% tiap jam secara alami)
        const jamLalu = Math.floor((Date.now() - petTarget.lastFeed) / (1000 * 60 * 60));
        let laparSekarang = Math.max(0, petTarget.lapar - (jamLalu * 5));

        // Syarat Murni: Butuh minimal 40% tenaga untuk berani masuk hutan
        if (laparSekarang < 40) {
            return await sock.sendMessage(chatId, { text: `⚠️ ${petTarget.nama} terlalu lemas dan lapar (Sisa Tenaga: ${laparSekarang}%).\n\nBeri makan dulu agar tenaganya kembali di atas 40%!` }, { quoted: msg });
        }

        petTarget.lastFeed = Date.now();

        // 2. Sistem Gacha Hasil Berburu (RNG) - ✨ SUDAH DI-BUFF ✨
        const rng = Math.random() * 100;
        let teksHasil = '';
        let tenagaTerkuras = 40; // Default tenaga yang dipakai jika bertarung/bawa barang

        if (rng < 10) { 
            // 10% Peluang Apes (Turun dari 15%)
            petTarget.kondisi = 'Sakit (Luka Fisik)';
            teksHasil = `🩸 *BERBURU GAGAL!*\n\n${petTarget.nama} diserang monster liar di pedalaman hutan! Dia pulang dengan keadaan terluka parah dan ketakutan.\n_Segera beli Perban dari toko Apotek!_`;
        
        } else if (rng < 25) { 
            // 15% Peluang Kosong (Turun drastis dari 25%)
            tenagaTerkuras = 15; // DISKON TENAGA! Karena tangan kosong, cuma capek jalan.
            teksHasil = `🍂 *PULANG TANGAN KOSONG*\n\n${petTarget.nama} sudah mengelilingi seluruh area, tapi tidak menemukan apa-apa hari ini.\n_Syukurlah, karena tidak banyak bertarung, tenaganya hanya terkuras sedikit (-15%)._`;
        
        } else if (rng < 60) { 
            // 35% Peluang Item (Naik dari 30%)
            const kategoriKunci = Object.keys(global.db.market.pasarInduk);
            const randomKategori = kategoriKunci[Math.floor(Math.random() * kategoriKunci.length)];
            const itemKunci = Object.keys(global.db.market.pasarInduk[randomKategori]);
            const randomItem = itemKunci[Math.floor(Math.random() * itemKunci.length)];
            const infoItem = global.db.market.pasarInduk[randomKategori][randomItem];

            if (!global.db.inventory) global.db.inventory = {};
            if (!global.db.inventory[senderNumber]) global.db.inventory[senderNumber] = {};
            if (!global.db.inventory[senderNumber][randomItem]) global.db.inventory[senderNumber][randomItem] = 0;
            
            global.db.inventory[senderNumber][randomItem] += 1;
            fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

            teksHasil = `🎒 *MENDAPATKAN BARANG!*\n\n${petTarget.nama} mengendus sesuatu di semak-semak dan membawanya pulang dengan susah payah!\nKamu mendapatkan: 1x *${infoItem.nama}*.\n\n_Cek tasmu dengan !inv. Kamu bisa menjual barang ini atau memberikannya ke peliharaan lain._`;
        
        } else { 
            // 40% Peluang Uang (Naik dari 30%)
            const nexusDapat = Math.floor(Math.random() * 200) + 50; 
            global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + nexusDapat;
            
            if (global.db.bank.brankas >= nexusDapat) {
                 global.db.bank.brankas -= nexusDapat;
            }
            
            fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
            teksHasil = `💰 *HARTA KARUN!*\n\n${petTarget.nama} menggali tanah dan menemukan pundi-pundi uang peninggalan petualang lama!\n\nKamu mendapatkan *${nexusDapat} 💠 Nexus*.`;
        }

        // 3. Potong tenaga peliharaan sesuai keputusan sistem
        petTarget.lapar = laparSekarang - tenagaTerkuras;

        // 4. TAMBAH XP DARI BERBURU
        const xpDapat = Math.floor(Math.random() * 21) + 15;
        if (typeof petTarget.xp !== 'number') petTarget.xp = 0; 
        petTarget.xp += xpDapat;
        
        teksHasil += `\n\n✨ _${petTarget.nama} mendapatkan +${xpDapat} XP karena telah berpetualang!_`;

        // 5. SISTEM AUTO LEVEL-UP DINAMIS
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
            teksHasil += `\n\n🎉 *LEVEL UP!*\n${petTarget.nama} naik dari Level ${levelLama} ke Level ${petTarget.level}!\n💪 Power meningkat menjadi ${petTarget.power}!`;
        }

        // 6. Simpan Perubahan Kondisi Pet
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));

        teksHasil += `\n━━━━━━━━━━━━━━━━━━━━\n🍖 Sisa Tenaga ${petTarget.nama}: *${petTarget.lapar}%*`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};