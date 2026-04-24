const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'duelpet',
    description: 'Menantang pet pemain lain untuk berduel',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Mendapatkan tag pemain lawan
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0 || args.length < 3) {
            return await sock.sendMessage(chatId, { text: '⚠️ *Format salah!*\nCara pakai: `!duelpet @tag_lawan [ID_Pet_Kamu] [ID_Pet_Lawan]`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];
        
        if (senderNumber === targetNumber) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa berduel dengan diri sendiri!' }, { quoted: msg });
        }

        // Mengambil ID pet dari argumen
        const idPetSendiri = parseInt(args[1]);
        const idPetLawan = parseInt(args[2]);

        const petSendiriList = global.db.pet[senderNumber] || [];
        const petLawanList = global.db.pet[targetNumber] || [];

        const petPenantang = petSendiriList.find(p => p.id === idPetSendiri);
        const petTarget = petLawanList.find(p => p.id === idPetLawan);

        // Validasi keberadaan pet
        if (!petPenantang) return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak memiliki pet dengan ID ${idPetSendiri}.` }, { quoted: msg });
        if (!petTarget) return await sock.sendMessage(chatId, { text: `⚠️ Lawan tidak memiliki pet dengan ID ${idPetLawan}.` }, { quoted: msg });

        // Validasi HP (Misal syarat minimal HP 20 untuk duel)
        if (petPenantang.hp < 20) return await sock.sendMessage(chatId, { text: `⚠️ HP pet kamu terlalu rendah (${petPenantang.hp}). Obati dulu sebelum duel!` }, { quoted: msg });
        if (petTarget.hp < 20) return await sock.sendMessage(chatId, { text: `⚠️ HP pet lawan terlalu rendah untuk diajak berduel.` }, { quoted: msg });

        // Inisialisasi object tantangan jika belum ada di memori
        if (!global.db.tantanganDuel) global.db.tantanganDuel = {};

        const teksTantangan = `⚔️ *TANTANGAN DUEL!* ⚔️\n\n@${senderNumber} mengirimkan *${petPenantang.nama}* (Lv.${petPenantang.level}) untuk menantang *${petTarget.nama}* (Lv.${petTarget.level}) milik @${targetNumber}!\n\n👉 *@${targetNumber}, balas (reply) pesan ini dengan mengetik "gas" untuk menerima tantangan!*`;

        // 1. Kirim pesan tantangan & simpan ke variabel botMsg
        const botMsg = await sock.sendMessage(chatId, { 
            text: teksTantangan, 
            mentions: [senderId, targetId] 
        }, { quoted: msg });

        // 2. Simpan sesi duel menggunakan ID PESAN BOT
        global.db.tantanganDuel[botMsg.key.id] = {
            penantang: senderNumber,
            idPetPenantang: petPenantang.id,
            target: targetNumber,
            idPetTarget: petTarget.id,
            chatId: chatId,
            waktu: Date.now()
        };

        // (Opsional) Jika tantanganDuel disimpan ke file json, uncomment baris di bawah ini
        // fs.writeFileSync(path.join(process.cwd(), 'data/tantangan.json'), JSON.stringify(global.db.tantanganDuel, null, 2));
    }
};