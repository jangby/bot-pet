const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'namapet',
    description: 'Mengganti nama peliharaan',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Memastikan format perintah benar
        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!namapet 1 Arthur`\n_(Angka 1 adalah ID peliharaanmu)_' }, { quoted: msg });
        }

        const petId = parseInt(args[0]);
        const namaBaru = args.slice(1).join(' '); // Menggabungkan sisa kata menjadi nama

        // Validasi Kepemilikan
        if (!global.db.pet || !global.db.pet[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum punya peliharaan! Beli telur dengan `!tetas` terlebih dahulu.' }, { quoted: msg });
        }

        const kandang = global.db.pet[senderNumber];
        const petTarget = kandang.find(p => p.id === petId);

        if (!petTarget) {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan di kandangmu.` }, { quoted: msg });
        }

        // Batasi panjang nama agar tampilan di !mypet tidak hancur
        if (namaBaru.length > 20) {
            return await sock.sendMessage(chatId, { text: '⚠️ Nama terlalu panjang! Maksimal 20 karakter.' }, { quoted: msg });
        }

        // Eksekusi Ganti Nama
        const namaLama = petTarget.nama;
        petTarget.nama = namaBaru;

        // Simpan Perubahan
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));

        await sock.sendMessage(chatId, { 
            text: `✨ *GANTI NAMA BERHASIL!* ✨\n\nIdentitas baru telah didaftarkan.\nPeliharaanmu yang dulunya dipanggil _${namaLama}_ sekarang resmi bernama *${namaBaru}*!` 
        }, { quoted: msg });
    }
};