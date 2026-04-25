const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'adopsi',
    description: 'Mengadopsi peliharaan baru menggunakan ID',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah! Gunakan tombol Adopsi dari Web Toko Hewan.' }, { quoted: msg });
        }

        // --- DATABASE HEWAN SUPER LENGKAP ---
        const daftarPet = {
            '1': { nama: 'Kucing Liar', spesies: 'Kucing Liar 🐱', harga: 500, power: 5, diet: 'Karnivora' },
            '2': { nama: 'Anjing Kampung', spesies: 'Anjing Kampung 🐶', harga: 600, power: 6, diet: 'Omnivora' },
            '3': { nama: 'Ayam Jago', spesies: 'Ayam Jago 🐓', harga: 700, power: 7, diet: 'Omnivora' },
            '4': { nama: 'Bebek Petarung', spesies: 'Bebek Petarung 🦆', harga: 800, power: 8, diet: 'Herbivora' },
            '5': { nama: 'Kelinci Gesit', spesies: 'Kelinci Gesit 🐇', harga: 900, power: 9, diet: 'Herbivora' },
            '6': { nama: 'Babi Hutan', spesies: 'Babi Hutan 🐗', harga: 1200, power: 12, diet: 'Omnivora' },
            '7': { nama: 'Rakun Pencuri', spesies: 'Rakun Pencuri 🦝', harga: 1300, power: 13, diet: 'Omnivora' },
            '8': { nama: 'Kelelawar Malam', spesies: 'Kelelawar Malam 🦇', harga: 1400, power: 14, diet: 'Karnivora' },
            '9': { nama: 'Beruang Es', spesies: 'Beruang Es 🐻‍❄️', harga: 1500, power: 15, diet: 'Karnivora' },
            '10': { nama: 'Beruang Coklat', spesies: 'Beruang Coklat 🐻', harga: 1500, power: 15, diet: 'Omnivora' },
            '11': { nama: 'Merak Eksotis', spesies: 'Merak 🦚', harga: 2000, power: 18, diet: 'Omnivora' },
            '12': { nama: 'Serigala Salju', spesies: 'Serigala Salju 🐺', harga: 2200, power: 20, diet: 'Karnivora' },
            '13': { nama: 'Macan Tutul', spesies: 'Macan Tutul 🐆', harga: 2500, power: 22, diet: 'Karnivora' },
            '14': { nama: 'Harimau Sumatera', spesies: 'Harimau Sumatera 🐅', harga: 2800, power: 24, diet: 'Karnivora' },
            '15': { nama: 'Kingkong', spesies: 'Kingkong 🦍', harga: 3000, power: 25, diet: 'Omnivora' },
            '16': { nama: 'Buaya Rawa', spesies: 'Buaya Rawa 🐊', harga: 3200, power: 26, diet: 'Karnivora' },
            '17': { nama: 'Banteng Liar', spesies: 'Banteng Liar 🐃', harga: 3500, power: 28, diet: 'Herbivora' },
            '18': { nama: 'Kalajengking Gurun', spesies: 'Kalajengking 🦂', harga: 4000, power: 32, diet: 'Karnivora' },
            '19': { nama: 'Laba-laba Berbisa', spesies: 'Laba-laba 🕷️', harga: 4200, power: 34, diet: 'Karnivora' },
            '20': { nama: 'Anaconda', spesies: 'Anaconda 🐍', harga: 4500, power: 35, diet: 'Karnivora' },
            '21': { nama: 'Gajah Perang', spesies: 'Gajah Perang 🐘', harga: 5000, power: 40, diet: 'Herbivora' },
            '22': { nama: 'Badak Bercula', spesies: 'Badak Bercula 🦏', harga: 5500, power: 42, diet: 'Herbivora' },
            '23': { nama: 'Hiu Putih', spesies: 'Hiu Putih 🦈', harga: 6000, power: 45, diet: 'Karnivora' },
            '24': { nama: 'Paus Orca', spesies: 'Paus Orca 🐋', harga: 6500, power: 48, diet: 'Karnivora' },
            '25': { nama: 'Gurita Raksasa', spesies: 'Gurita Raksasa 🦑', harga: 8000, power: 60, diet: 'Karnivora' },
            '26': { nama: 'Kraken', spesies: 'Kraken 🐙', harga: 9000, power: 70, diet: 'Karnivora' },
            '27': { nama: 'Burung Hantu Mistis', spesies: 'Burung Hantu 🦉', harga: 9500, power: 75, diet: 'Karnivora' },
            '28': { nama: 'Kuda Pegasus', spesies: 'Kuda Pegasus 🐎', harga: 10000, power: 80, diet: 'Herbivora' },
            '29': { nama: 'Unicorn', spesies: 'Unicorn 🦄', harga: 12000, power: 90, diet: 'Herbivora' },
            '30': { nama: 'Phoenix', spesies: 'Phoenix 🐦‍🔥', harga: 15000, power: 110, diet: 'Omnivora' },
            '31': { nama: 'Naga Merah', spesies: 'Naga Merah 🐉', harga: 18000, power: 125, diet: 'Karnivora' },
            '32': { nama: 'Naga Es', spesies: 'Naga Es 🐲', harga: 20000, power: 140, diet: 'Karnivora' },
            '33': { nama: 'Brontosaurus', spesies: 'Brontosaurus 🦕', harga: 25000, power: 180, diet: 'Herbivora' },
            '34': { nama: 'T-Rex', spesies: 'T-Rex 🦖', harga: 28000, power: 200, diet: 'Karnivora' },
            '35': { nama: 'Alien Misterius', spesies: 'Alien Misterius 👽', harga: 30000, power: 220, diet: 'Omnivora' }
        };

        const idPilihan = args[0];
        const petPilihan = daftarPet[idPilihan];

        if (!petPilihan) {
            return await sock.sendMessage(chatId, { text: '⚠️ ID Peliharaan tidak ditemukan di katalog.' }, { quoted: msg });
        }

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        const saldoPemain = parseInt(global.db.player[senderNumber].saldo) || 0;

        if (saldoPemain < petPilihan.harga) {
            return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup! Kamu butuh ${petPilihan.harga.toLocaleString('id-ID')} 💠 untuk mengadopsi ${petPilihan.nama}.` }, { quoted: msg });
        }

        if (!global.db.pet) global.db.pet = {};
        if (!global.db.pet[senderNumber]) global.db.pet[senderNumber] = [];

        // Potong Saldo & Masukkan ke Bank Sentral
        global.db.player[senderNumber].saldo -= petPilihan.harga;
        global.db.bank.brankas += petPilihan.harga;

        // --- SISTEM ID BERURUTAN (1, 2, 3, dst) ---
        let idUnik = 1;
        if (global.db.pet[senderNumber].length > 0) {
            // Cek ID paling besar yang ada saat ini, lalu tambahkan 1
            const daftarId = global.db.pet[senderNumber].map(p => parseInt(p.id) || 0);
            idUnik = Math.max(...daftarId) + 1;
        }

        const petBaru = {
            id: idUnik, // Sekarang menggunakan nomor urut
            nama: args[1] ? args.slice(1).join(' ') : petPilihan.nama, 
            spesies: petPilihan.spesies,
            diet: petPilihan.diet,
            level: 1,
            xp: 0,
            health: 100,
            lapar: 100,
            kondisi: 'Sehat',
            power: petPilihan.power,
            lastFeed: Date.now()
        };

        global.db.pet[senderNumber].push(petBaru);

        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        let teksSukses = `🎉 *ADOPSI BERHASIL!* 🎉\n\nSelamat! Kamu telah resmi mengadopsi *${petBaru.spesies}* seharga ${petPilihan.harga.toLocaleString('id-ID')} 💠.\n\n`;
        teksSukses += `ID Peliharaan: *${idUnik}*\n`;
        teksSukses += `_Jangan lupa beri makan tepat waktu agar tenaganya kembali!_`;

        await sock.sendMessage(chatId, { text: teksSukses }, { quoted: msg });
    }
};