const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tambang',
    description: 'Melakukan ekspedisi tambang untuk mencari mineral berharga',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Inisialisasi database jika belum ada
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.inventory) global.db.inventory = {};
        if (!global.db.inventory[senderNumber]) global.db.inventory[senderNumber] = {};
        if (!global.db.cooldownTambang) global.db.cooldownTambang = {};
        if (!global.db.tambangGrup) global.db.tambangGrup = {};

        // === 1. MODE INFO (DOKUMENTASI) ===
        if (args.length > 0 && args[0].toLowerCase() === 'info') {
            let teksInfo = `⛏️ *PANDUAN EKSPEDISI TAMBANG* ⛏️\n\n`;
            teksInfo += `Fitur ini memungkinkan peliharaanmu menggali area pertambangan untuk mendapatkan mineral mahal (Batu Bara, Bijih Besi, Emas, Berlian) yang bisa dijual ke Bank atau di Tokomu.\n\n`;
            teksInfo += `👤 *MODE INDIVIDU*\n`;
            teksInfo += `Ketik \`!tambang\`. Peliharaanmu akan menggali sendirian.\n`;
            teksInfo += `- Menguras 20% tenaga peliharaan.\n`;
            teksInfo += `- Cooldown: 5 Menit.\n`;
            teksInfo += `- Hadiah acak, ada kemungkinan gagal (zonk).\n\n`;
            teksInfo += `👥 *MODE GRUP (GOTONG ROYONG)*\n`;
            teksInfo += `Ketik \`!tambang grup\`. Ini akan membuka lobi ekspedisi grup.\n`;
            teksInfo += `- Minimal 2 orang lain di grup ini harus ikut membantu dengan mengetik \`!gali\`.\n`;
            teksInfo += `- Waktu kumpul: 60 Detik.\n`;
            teksInfo += `- Menguras 30% tenaga peliharaan setiap peserta.\n`;
            teksInfo += `- *KEUNTUNGAN:* Jika berhasil, semua peserta dijamin mendapat barang Tambang Super Langka (Emas Murni / Berlian)!\n`;
            teksInfo += `- Cooldown Grup: 30 Menit.\n\n`;
            teksInfo += `💡 _Persiapkan tenaga peliharaanmu sebelum masuk ke goa tambang!_`;

            return await sock.sendMessage(chatId, { text: teksInfo }, { quoted: msg });
        }

        // Validasi Peliharaan
        if (!global.db.pet[senderNumber] || global.db.pet[senderNumber].length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu harus punya minimal 1 peliharaan untuk disuruh menambang! Beli di `!tokohewan`.' }, { quoted: msg });
        }

        const petTarget = global.db.pet[senderNumber].reduce((prev, current) => (prev.level > current.level) ? prev : current);

        if (petTarget.kondisi !== 'Sehat') {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan andalanmu (*${petTarget.nama}*) sedang sakit! Obati dulu sebelum disuruh menambang.` }, { quoted: msg });
        }

        // Hitung lapar aktual
        const jamLalu = Math.floor((Date.now() - petTarget.lastFeed) / (1000 * 60 * 60));
        let laparSekarang = Math.max(0, petTarget.lapar - (jamLalu * 5));

        // === 2. MODE GRUP ===
        if (args.length > 0 && args[0].toLowerCase() === 'grup') {
            if (global.db.tambangGrup[chatId]) {
                return await sock.sendMessage(chatId, { text: `⚠️ Sedang ada lobi ekspedisi tambang yang aktif di grup ini! Ketik \`!gali\` untuk bergabung.` }, { quoted: msg });
            }

            // Cek Cooldown Grup
            const lastGrup = global.db.cooldownTambang[senderNumber + '_grup'] || 0;
            if (Date.now() - lastGrup < 30 * 60 * 1000) {
                const sisa = Math.ceil((30 * 60 * 1000 - (Date.now() - lastGrup)) / 60000);
                return await sock.sendMessage(chatId, { text: `⏳ *Peralatan Tambang Rusak!*\nKamu harus menunggu *${sisa} Menit* lagi sebelum bisa membuka lobi tambang grup.` }, { quoted: msg });
            }

            if (laparSekarang < 30) {
                return await sock.sendMessage(chatId, { text: `⚠️ Tenaga *${petTarget.nama}* tidak cukup untuk tambang grup (Sisa: ${laparSekarang}%).\nBeri makan dulu agar tenaganya di atas 30%!` }, { quoted: msg });
            }

            global.db.tambangGrup[chatId] = {
                host: senderNumber,
                peserta: [senderNumber],
                waktuBerakhir: Date.now() + 60000 // 60 detik
            };

            // Pasang timer 60 detik
            setTimeout(async () => {
                const lobi = global.db.tambangGrup[chatId];
                if (lobi && lobi.waktuBerakhir && Date.now() >= lobi.waktuBerakhir - 1000) {
                    if (lobi.peserta.length < 3) {
                        delete global.db.tambangGrup[chatId];
                        const tagHost = senderNumber.length > 14 ? `${senderNumber}@lid` : `${senderNumber}@s.whatsapp.net`;
                        await sock.sendMessage(chatId, { text: `🕰️ *WAKTU HABIS!*\n\nEkspedisi tambang yang dipimpin @${senderNumber} dibatalkan karena kurang peserta (hanya ${lobi.peserta.length}/3 orang).\n\n_Tenaga peliharaan @${senderNumber} terbuang sia-sia (-30%)._`, mentions: [tagHost] });
                        
                        // Potong stamina host
                        if (global.db.pet[senderNumber]) {
                            const petHost = global.db.pet[senderNumber].reduce((prev, current) => (prev.level > current.level) ? prev : current);
                            petHost.lapar = Math.max(0, petHost.lapar - 30);
                            petHost.lastFeed = Date.now();
                            fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
                        }
                    }
                }
            }, 60000);

            const tagHost = senderNumber.length > 14 ? `${senderNumber}@lid` : `${senderNumber}@s.whatsapp.net`;
            return await sock.sendMessage(chatId, { text: `📢 *EKSPEDISI TAMBANG BERSAMA DIBUKA!* 📢\n\n@${senderNumber} mengajak kalian untuk menggali Tambang Kristal Tua!\n\n⚠️ Butuh tambahan *2 orang* lagi untuk mulai menggali.\n\n⏳ *Waktu kumpul:* 60 Detik.\n👉 *Cara ikut:* Ketik \`!gali\` sekarang!`, mentions: [tagHost] });
        }

        // === 3. MODE INDIVIDU ===
        const lastIndividu = global.db.cooldownTambang[senderNumber] || 0;
        if (Date.now() - lastIndividu < 5 * 60 * 1000) {
            const sisaDetik = Math.ceil((5 * 60 * 1000 - (Date.now() - lastIndividu)) / 1000);
            return await sock.sendMessage(chatId, { text: `⏳ *${petTarget.nama}* masih kelelahan sehabis menambang.\nTunggu *${sisaDetik} detik* lagi.` }, { quoted: msg });
        }

        if (laparSekarang < 20) {
            return await sock.sendMessage(chatId, { text: `⚠️ Tenaga *${petTarget.nama}* sangat kritis (Sisa: ${laparSekarang}%).\nBeri makan dulu agar tenaganya di atas 20%!` }, { quoted: msg });
        }

        // Potong tenaga & set cooldown
        petTarget.lapar = laparSekarang - 20;
        petTarget.lastFeed = Date.now();
        global.db.cooldownTambang[senderNumber] = Date.now();
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));

        // GACHA HASIL (Individu)
        const rng = Math.random() * 100;
        let hasil = '';

        if (rng < 40) {
            hasil = `🍂 *ZONK!*\n\n*${petTarget.nama}* menggali sangat dalam, tetapi hanya menemukan batu kerikil dan cacing tanah. Tenaganya terbuang sia-sia (-20%).`;
        } else if (rng < 80) {
            global.db.inventory[senderNumber]['batu_bara'] = (global.db.inventory[senderNumber]['batu_bara'] || 0) + 1;
            hasil = `🪨 *LUMAYAN!*\n\n*${petTarget.nama}* menemukan **1x Batu Bara**. Lumayan untuk dijual ke pengepul.`;
        } else if (rng < 95) {
            global.db.inventory[senderNumber]['bijih_besi'] = (global.db.inventory[senderNumber]['bijih_besi'] || 0) + 1;
            hasil = `⛏️ *BERHASIL!*\n\nBagus! *${petTarget.nama}* menemukan pecahan logam mengkilap. Kamu mendapatkan **1x Bijih Besi**.`;
        } else {
            global.db.inventory[senderNumber]['emas'] = (global.db.inventory[senderNumber]['emas'] || 0) + 1;
            hasil = `🌟 *HARTA KARUN!*\n\nLuar biasa! *${petTarget.nama}* mencium bau harta dan menggali **1x Emas Murni**!! Jual di pasar untuk keuntungan besar!`;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        await sock.sendMessage(chatId, { text: hasil }, { quoted: msg });
    }
};
