const fs = require('fs');
const path = require('path');

// Patokan harga awal
const hargaDasar = {
    "Kelinci 🐇": 500, "Kucing 🐱": 800, "Ayam 🐓": 600,
    "Anjing 🐶": 1500, "Kuda 🐴": 2000, "Berang-berang 🦦": 1800,
    "Serigala 🐺": 4000, "Beruang Es 🐻‍❄️": 5000, "Singa 🦁": 6000,
    "Unicorn 🦄": 15000, "Phoenix 🦅": 20000, "Naga 🐲": 30000
};

module.exports = {
    name: 'jualpet',
    description: 'Menjual peliharaan ke Bank Sentral',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) return await sock.sendMessage(chatId, { text: '⚠️ Masukkan ID pet yang ingin dijual!\nContoh: `!jualpet 1`' });

        const petId = parseInt(args[0]);
        if (!global.db.pet[senderNumber]) return;

        const kandang = global.db.pet[senderNumber];
        const petIndex = kandang.findIndex(p => p.id === petId);

        if (petIndex === -1) return await sock.sendMessage(chatId, { text: `⚠️ Pet dengan ID ${petId} tidak ditemukan.` });

        const pet = kandang[petIndex];
        const modalAwal = hargaDasar[pet.spesies] || 1000;
        
        // Harga jual = 50% dari modal + (Level x 100)
        const hargaJual = Math.floor(modalAwal * 0.5) + (pet.level * 100);

        // Hapus pet dari array dan berikan uang
        kandang.splice(petIndex, 1);
        global.db.player[senderNumber].saldo += hargaJual;
        global.db.bank.brankas -= hargaJual;

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `🤝 *DEAL!*\n\nKamu telah menjual *${pet.nama}* (${pet.spesies} Lv.${pet.level}) ke Bank Sentral.\nUang sebesar *${hargaJual.toLocaleString('id-ID')} 💠* telah masuk ke dompetmu.` }, { quoted: msg });
    }
};