const fs = require('fs');
const path = require('path');

// Menyimpan data master katalog agar mudah dibaca oleh logika
const daftarHewan = {
    "1": { jenis: "Kelinci 🐇", diet: "herbivora", rarity: "Common", power: 5, harga: 500 },
    "2": { jenis: "Kucing 🐱", diet: "pescivora", rarity: "Common", power: 10, harga: 800 },
    "3": { jenis: "Ayam 🐓", diet: "herbivora", rarity: "Common", power: 8, harga: 600 },
    "4": { jenis: "Anjing 🐶", diet: "karnivora", rarity: "Rare", power: 20, harga: 1500 },
    "5": { jenis: "Kuda 🐴", diet: "herbivora", rarity: "Rare", power: 25, harga: 2000 },
    "6": { jenis: "Berang-berang 🦦", diet: "pescivora", rarity: "Rare", power: 22, harga: 1800 },
    "7": { jenis: "Serigala 🐺", diet: "karnivora", rarity: "Epic", power: 45, harga: 4000 },
    "8": { jenis: "Beruang Es 🐻‍❄️", diet: "pescivora", rarity: "Epic", power: 50, harga: 5000 },
    "9": { jenis: "Singa 🦁", diet: "karnivora", rarity: "Epic", power: 60, harga: 6000 },
    "10": { jenis: "Unicorn 🦄", diet: "mythical", rarity: "Legendary", power: 100, harga: 15000 },
    "11": { jenis: "Phoenix 🦅", diet: "mythical", rarity: "Legendary", power: 120, harga: 20000 },
    "12": { jenis: "Naga 🐲", diet: "mythical", rarity: "Legendary", power: 150, harga: 30000 }
};

module.exports = {
    name: 'adopsi',
    description: 'Mengadopsi peliharaan dari Toko Hewan',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan ID hewan yang ingin diadopsi!\nContoh: `!adopsi 12` untuk membeli Naga.' }, { quoted: msg });
        }

        const idPilihan = args[0];
        const petPilihan = daftarHewan[idPilihan];

        if (!petPilihan) {
            return await sock.sendMessage(chatId, { text: '⚠️ ID Hewan tidak ditemukan. Cek daftar lengkapnya dengan ketik `!tokohewan`.' }, { quoted: msg });
        }

        // --- 🛡️ PENGAMAN DATABASE 🛡️ ---
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.pet[senderNumber]) global.db.pet[senderNumber] = [];

        const uangPemain = parseInt(global.db.player[senderNumber].saldo) || 0;

        if (uangPemain < petPilihan.harga) {
            return await sock.sendMessage(chatId, { 
                text: `⚠️ Uangmu tidak cukup untuk mengadopsi *${petPilihan.jenis}*!\nHarga: *${petPilihan.harga.toLocaleString('id-ID')} 💠*\nSaldomu: *${uangPemain.toLocaleString('id-ID')} 💠*` 
            }, { quoted: msg });
        }

        // --- PROSES TRANSAKSI ---
        // Potong uang, kembalikan ke Bank Sentral
        global.db.player[senderNumber].saldo -= petPilihan.harga;
        global.db.bank.brankas += petPilihan.harga;

        const kandang = global.db.pet[senderNumber];
        const newId = kandang.length > 0 ? Math.max(...kandang.map(p => p.id)) + 1 : 1;

        // Masukkan hewan ke kandang
        kandang.push({
            id: newId,
            nama: petPilihan.jenis.split(' ')[0], // Ambil teksnya saja tanpa emoji sebagai nama default
            spesies: petPilihan.jenis,
            diet: petPilihan.diet,
            rarity: petPilihan.rarity,
            level: 1,
            xp: 0,
            health: 100,
            lapar: 100,
            kondisi: 'Sehat',
            power: petPilihan.power,
            lastFeed: Date.now()
        });

        // Simpan Database
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
        
        const teksBerhasil = 
`🎉 *ADOPSI BERHASIL!* 🎉

Kamu telah menghabiskan *${petPilihan.harga.toLocaleString('id-ID')} 💠* untuk membawa pulang peliharaan baru:
🐾 Spesies: *${petPilihan.jenis}*
💠 Rarity: *${petPilihan.rarity}*
🥩 Diet: *${petPilihan.diet.toUpperCase()}*

_Ketik !mypet untuk melihatnya di kandang, atau !namapet ${newId} [NamaBaru] untuk memberinya nama!_`;
        
        await sock.sendMessage(chatId, { text: teksBerhasil }, { quoted: msg });
    }
};