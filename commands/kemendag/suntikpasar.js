const fs = require('fs');
const path = require('path');
const { isPrivate, isMenteri } = require('../../utils/middleware.js');

module.exports = {
    name: 'suntikpasar',
    description: 'Menyuntikkan item ke pasar dengan dana Kas Negara (Khusus Kemendag)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Menteri hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        if (!isMenteri(senderNumber, 'perdagangan')) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Menteri Perdagangan!' }, { quoted: msg });
        }

        if (args.length < 2 || isNaN(args[1])) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!suntikpasar [nama_item] [jumlah]`\nContoh: `!suntikpasar gandum 50`' });
        }

        const itemInput = args[0].toLowerCase();
        const jumlahSuntik = parseInt(args[1]);

        if (jumlahSuntik <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Jumlah suntikan harus lebih dari 0!' });
        }

        const listHargaItem = {
            'gandum': 20,
            'daging': 50,
            'besi': 100,
            'emas': 500,
            'berlian': 2000,
            'kopi': 30
        };

        if (!listHargaItem[itemInput]) {
            return await sock.sendMessage(chatId, { text: `❌ Item tidak dikenali! Item yang bisa disuntikkan:\n${Object.keys(listHargaItem).join(', ')}` });
        }

        const hargaBeliPemerintah = listHargaItem[itemInput] * jumlahSuntik;

        if (global.db.kabinet.kas_negara < hargaBeliPemerintah) {
            return await sock.sendMessage(chatId, { text: `❌ Kas Negara tidak mencukupi untuk impor barang ini!\nDibutuhkan: ${hargaBeliPemerintah.toLocaleString('id-ID')} Nexus\nSisa Kas: ${global.db.kabinet.kas_negara.toLocaleString('id-ID')} Nexus` });
        }

        // Potong kas negara
        global.db.kabinet.kas_negara -= hargaBeliPemerintah;

        // Tambahkan ke market (bank_sentral)
        if (!global.db.market.bank_sentral) {
            global.db.market.bank_sentral = {};
        }
        
        global.db.market.bank_sentral[itemInput] = (global.db.market.bank_sentral[itemInput] || 0) + jumlahSuntik;

        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

        await sock.sendMessage(chatId, { text: `📦 *OPERASI PASAR BERHASIL*\n\nPemerintah telah membeli *${jumlahSuntik} ${itemInput}* seharga *${hargaBeliPemerintah.toLocaleString('id-ID')} Nexus* dan menyuntikkannya ke Pasar Bank Sentral untuk menstabilkan harga.` });
    }
};
