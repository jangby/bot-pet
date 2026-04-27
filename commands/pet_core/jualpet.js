const fs = require('fs');
const path = require('path');

// --- DATABASE HARGA BELI ASLI (UPDATE 35 PET) ---
const hargaDasar = {
    'Kucing Liar 🐱': 500,
    'Anjing Kampung 🐶': 600,
    'Ayam Jago 🐓': 700,
    'Bebek Petarung 🦆': 800,
    'Kelinci Gesit 🐇': 900,
    'Babi Hutan 🐗': 1200,
    'Rakun Pencuri 🦝': 1300,
    'Kelelawar Malam 🦇': 1400,
    'Beruang Es 🐻‍❄️': 1500,
    'Beruang Coklat 🐻': 1500,
    'Merak 🦚': 2000,
    'Serigala Salju 🐺': 2200,
    'Macan Tutul 🐆': 2500,
    'Harimau Sumatera 🐅': 2800,
    'Kingkong 🦍': 3000,
    'Buaya Rawa 🐊': 3200,
    'Banteng Liar 🐃': 3500,
    'Kalajengking 🦂': 4000,
    'Laba-laba 🕷️': 4200,
    'Anaconda 🐍': 4500,
    'Gajah Perang 🐘': 5000,
    'Badak Bercula 🦏': 5500,
    'Hiu Putih 🦈': 6000,
    'Paus Orca 🐋': 6500,
    'Gurita Raksasa 🦑': 8000,
    'Kraken 🐙': 9000,
    'Burung Hantu 🦉': 9500,
    'Kuda Pegasus 🐎': 10000,
    'Unicorn 🦄': 12000,
    'Phoenix 🐦‍🔥': 15000,
    'Naga Merah 🐉': 18000,
    'Naga Es 🐲': 20000,
    'Brontosaurus 🦕': 25000,
    'T-Rex 🦖': 28000,
    'Alien Misterius 👽': 30000
};

module.exports = {
    name: 'jualpet',
    description: 'Menjual peliharaan ke Bank Sentral dengan harga investasi',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan ID pet yang ingin dijual!\nContoh: `!jualpet 1`' });
        }

        const petId = args[0]; // Tetap string dulu untuk fleksibilitas perbandingan
        if (!global.db.pet[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum memiliki peliharaan sama sekali.' });
        }

        const kandang = global.db.pet[senderNumber];
        
        // Menggunakan == agar bisa mencocokkan baik itu angka (1) maupun string ('1')
        const petIndex = kandang.findIndex(p => p.id == petId);

        if (petIndex === -1) {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan di kandangmu.` });
        }

        const pet = kandang[petIndex];

        // --- 🛡️ ANTI-CHEAT: BATAS MINIMAL LEVEL 3 🛡️ ---
        if (pet.level < 3) {
            return await sock.sendMessage(chatId, { 
                text: `⚠️ *PENJUALAN DITOLAK!*\n\n*${pet.nama}* masih terlalu muda (Level ${pet.level}).\nKamu baru bisa menjual peliharaan ke Bank Sentral minimal pada *Level 3*.\n\n_Rajin-rajinlah memberi makan (!feed) dan berburu (!berburu) untuk menaikkan levelnya!_` 
            }, { quoted: msg });
        }

        const modalAwal = hargaDasar[pet.spesies] || 1000; // Harga default 1000 jika ada pet anomali
        
        // --- 💰 RUMUS PENJUALAN BARU (Investasi Menguntungkan) 💰 ---
        // Harga Jual = Harga Beli + (Level x 100)
        const hargaJual = modalAwal + (pet.level * 300);

        // Hapus pet dari array (diserahkan ke Bank)
        kandang.splice(petIndex, 1);
        
        // Tambahkan uang ke pemain dan tarik uang dari kas Bank Sentral
        global.db.player[senderNumber].saldo += hargaJual;
        global.db.bank.brankas -= hargaJual;

        // Simpan perubahan ke database
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        let teksBerhasil = `🤝 *TRANSAKSI DEAL!* 🤝\n\n`;
        teksBerhasil += `Kamu telah menjual *${pet.nama}* (${pet.spesies} Lv.${pet.level}) kembali ke Bank Sentral.\n\n`;
        teksBerhasil += `Uang tunai sebesar *${hargaJual.toLocaleString('id-ID')} 💠* telah masuk ke dompetmu!`;

        await sock.sendMessage(chatId, { text: teksBerhasil }, { quoted: msg });
    }
};