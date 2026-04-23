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

        // Butuh minimal 40% tenaga untuk berburu
        if (laparSekarang < 40) {
            return await sock.sendMessage(chatId, { text: `⚠️ ${petTarget.nama} terlalu lemas dan lapar (Sisa Tenaga: ${laparSekarang}%).\n\nBeri makan dulu agar tenaganya kembali di atas 40%!` }, { quoted: msg });
        }

        // --- 2. EKSEKUSI BERBURU (TANPA LIMIT COOLDOWN) ---
        // Sedot tenaga pet secara instan
        petTarget.lapar = laparSekarang - 40;
        petTarget.lastFeed = Date.now();

        // 3. Sistem Gacha Hasil Berburu (RNG)
        const rng = Math.random() * 100;
        let teksHasil = '';

        if (rng < 15) { 
            // 15% Peluang Apes: Pet terluka diserang monster
            petTarget.kondisi = 'Sakit (Luka Fisik)';
            teksHasil = `🩸 *BERBURU GAGAL!*\n\n${petTarget.nama} diserang monster liar di pedalaman hutan! Dia pulang dengan keadaan terluka parah dan ketakutan.\n_Segera beli Perban dari toko Apotek!_`;
        
        } else if (rng < 40) { 
            // 25% Peluang Kosong: Tidak dapat apa-apa
            teksHasil = `🍂 *PULANG TANGAN KOSONG*\n\n${petTarget.nama} sudah mengelilingi seluruh area, tapi tidak menemukan apa-apa selain rasa lelah.`;
        
        } else if (rng < 70) { 
            // 30% Peluang Item: Dapat bahan mentah acak dari Pasar Induk
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

            teksHasil = `🎒 *MENDAPATKAN BARANG!*\n\n${petTarget.nama} mengendus sesuatu di semak-semak dan membawanya pulang!\nKamu mendapatkan: 1x *${infoItem.nama}*.\n\n_Cek tasmu dengan !inv. Kamu bisa menjual barang ini atau memberikannya ke peliharaan lain._`;
        
        } else { 
            // 30% Peluang Uang: Dapat uang Nexus
            const nexusDapat = Math.floor(Math.random() * 200) + 50; // Random antara 50 - 250 Nexus
            global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + nexusDapat;
            
            // Uang didapat dari Bank (agar supply maksimal tetap aman 100.000)
            if (global.db.bank.brankas >= nexusDapat) {
                 global.db.bank.brankas -= nexusDapat;
            }
            
            fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
            teksHasil = `💰 *HARTA KARUN!*\n\n${petTarget.nama} menggali tanah dan menemukan pundi-pundi uang peninggalan petualang lama!\n\nKamu mendapatkan *${nexusDapat} 💠 Nexus*.`;
        }

        // 4. Simpan Perubahan Kondisi Pet & Player
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        // Tambahkan info sisa tenaga agar pemain tahu kapan harus menyuapi makan
        teksHasil += `\n━━━━━━━━━━━━━━━━━━━━\n🍖 Sisa Tenaga ${petTarget.nama}: *${petTarget.lapar}%*`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};