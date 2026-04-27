const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'fixrarity',
    description: 'Perintah Admin: Memperbaiki status rarity/kelangkaan pet yang undefined',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        let totalDiperbaiki = 0;

        // Pemetaan sederhana untuk mengecek rarity berdasarkan nama spesies
        const rarityMap = {
            'Kucing Liar 🐱': 'Common', 'Anjing Kampung 🐶': 'Common', 'Ayam Jago 🐓': 'Common',
            'Bebek Petarung 🦆': 'Common', 'Kelinci Gesit 🐇': 'Common', 'Babi Hutan 🐗': 'Common',
            'Rakun Pencuri 🦝': 'Common', 'Kelelawar Malam 🦇': 'Common', 'Beruang Es 🐻‍❄️': 'Common',
            'Beruang Coklat 🐻': 'Common',
            'Merak 🦚': 'Rare', 'Serigala Salju 🐺': 'Rare', 'Macan Tutul 🐆': 'Rare',
            'Harimau Sumatera 🐅': 'Rare', 'Kingkong 🦍': 'Rare', 'Buaya Rawa 🐊': 'Rare',
            'Banteng Liar 🐃': 'Rare',
            'Kalajengking 🦂': 'Epic', 'Laba-laba 🕷️': 'Epic', 'Anaconda 🐍': 'Epic',
            'Gajah Perang 🐘': 'Epic', 'Badak Bercula 🦏': 'Epic', 'Hiu Putih 🦈': 'Epic',
            'Paus Orca 🐋': 'Epic',
            'Gurita Raksasa 🦑': 'Mythic', 'Kraken 🐙': 'Mythic', 'Burung Hantu 🦉': 'Mythic',
            'Kuda Pegasus 🐎': 'Mythic', 'Unicorn 🦄': 'Mythic',
            'Phoenix 🐦‍🔥': 'Legendary', 'Naga Merah 🐉': 'Legendary', 'Naga Es 🐲': 'Legendary',
            'Brontosaurus 🦕': 'SECRET', 'T-Rex 🦖': 'SECRET', 'Alien Misterius 👽': 'SECRET'
        };

        if (global.db.pet) {
            for (const nomorPemain in global.db.pet) {
                global.db.pet[nomorPemain].forEach(pet => {
                    // Jika rarity tidak ada, kosong, atau undefined
                    if (!pet.rarity || pet.rarity === 'undefined') {
                        pet.rarity = rarityMap[pet.spesies] || 'Unknown';
                        totalDiperbaiki++;
                    }
                });
            }
            
            fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        }

        await sock.sendMessage(chatId, { text: `✅ *PERBAIKAN SELESAI!*\n\nSebanyak *${totalDiperbaiki}* peliharaan yang statusnya "undefined" telah dikembalikan ke kelangkaan aslinya (Epic, Legendary, Secret, dll).` }, { quoted: msg });
    }
};