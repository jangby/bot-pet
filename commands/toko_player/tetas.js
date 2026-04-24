const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tetas',
    description: 'Membeli dan menetaskan telur peliharaan misterius',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // --- 🛡️ PENGAMAN DATABASE 🛡️ ---
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.pet[senderNumber]) global.db.pet[senderNumber] = []; // Format Array untuk banyak pet

        const hargaTelur = 1000;
        const saldoPemain = parseInt(global.db.player[senderNumber].saldo) || 0;

        if (saldoPemain < hargaTelur) {
            return await sock.sendMessage(chatId, { text: `⚠️ Uangmu tidak cukup! Harga 1 telur misterius adalah *${hargaTelur.toLocaleString('id-ID')} 💠*.\nSilakan \`!pinjam\` ke Bank atau cari uang terlebih dahulu.` }, { quoted: msg });
        }

        // 1. Eksekusi Pembayaran
        global.db.player[senderNumber].saldo -= hargaTelur;
        global.db.bank.brankas = parseInt(global.db.bank.brankas || global.MAX_SUPPLY) + hargaTelur;

        // 2. Sistem Gacha (RNG)
        const gacha = Math.random() * 100;
        let petBaru = {};

        // Penentuan Spesies & Kebutuhan Diet
        if (gacha < 50) petBaru = { jenis: 'Kucing 🐱', diet: 'pescivora', rarity: 'Common', power: 10 };
        else if (gacha < 85) petBaru = { jenis: 'Anjing 🐶', diet: 'karnivora', rarity: 'Rare', power: 25 };
        else if (gacha < 97) petBaru = { jenis: 'Kuda 🐴', diet: 'herbivora', rarity: 'Epic', power: 60 };
        else petBaru = { jenis: 'Naga 🐲', diet: 'mythical', rarity: 'Legendary', power: 150 };

        const kandang = global.db.pet[senderNumber];
        const newId = kandang.length + 1; // ID urut berdasarkan jumlah pet

        // 3. Masukkan Pet ke Kandang
        kandang.push({
            id: newId,
            nama: petBaru.jenis, // Nama default mengikuti spesies
            spesies: petBaru.jenis,
            diet: petBaru.diet,
            rarity: petBaru.rarity,
            level: 1,
            xp: 0,
            health: 100,
            lapar: 100,
            kondisi: 'Sehat',
            power: petBaru.power,
            lastFeed: Date.now()
        });

        // 4. Simpan Database
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        // --- 📢 TRIGGER MILESTONE TOKO BARU 📢 ---
        if (!global.db.market.milestoneToko) global.db.market.milestoneToko = 0;
        const totalPemainPunyaPet = Object.keys(global.db.pet).length;

        if (totalPemainPunyaPet >= global.db.market.milestoneToko + 10) {
            global.db.market.milestoneToko += 10;
            global.db.market.lelang['BANK_SENTRAL'] = {
                nama: "Lisensi Toko Serba Ada",
                kategori: "serba_ada",
                etalase: {},
                tokenWeb: Math.random().toString(36).substring(2, 15),
                hargaBuka: 5000, // Harga buka lelang 5000 Nexus
                bidTertinggi: 5000,
                pemenangSementara: null,
                pemilikLama: "BANK_SENTRAL",
                waktuSita: Date.now()
            };
            fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
            
            await sock.sendMessage(chatId, { text: `📢 *PENGUMUMAN BANK SENTRAL* 📢\n\nPopulasi mencapai ${totalPemainPunyaPet} Pemilik Pet!\nBank Sentral resmi merilis 1 *Lisensi Toko Serba Ada* ke Balai Lelang!\n\nToko ini berhak memonopoli SEMUA jenis Makanan & Obat!\n\nKetik \`!lelang\` untuk melihat dan \`!bid BANK_SENTRAL [nominal]\` untuk menawar lisensi emas ini!` });
        }
        // -----------------------------------------
        
        const teksHasil = 
`🎉 *TELUR MENETAS!* 🎉

Kamu menghabiskan 1.000 💠 dan mendapatkan peliharaan ke-${newId}:
🐾 Spesies: *${petBaru.jenis}*
💠 Rarity: *${petBaru.rarity}*
🥩 Diet: *${petBaru.diet.toUpperCase()}*

_Ketik !mypet untuk melihat detail kandangmu._`;
        
        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};