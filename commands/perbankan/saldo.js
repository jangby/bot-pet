module.exports = {
    name: 'saldo',
    description: 'Cek dompet dan tagihan utang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];
        const pushName = msg.pushName || 'Player';

        // Ambil data pemain (sudah dipastikan ada oleh index.js)
        const uang = global.db.player[senderNumber].saldo || 0;
        
        let teksUtang = `_Kamu tidak memiliki tagihan kredit._`;
        let statusKredit = global.db.bank.kredit[senderNumber];

        // Jika punya utang, tampilkan rinciannya
        if (statusKredit && statusKredit.utang > 0) {
            const sisaHari = Math.ceil((statusKredit.jatuhTempo - Date.now()) / (1000 * 60 * 60 * 24));
            const peringatan = sisaHari < 0 ? '⚠️ *TELAT BAYAR!*' : `(Sisa waktu: ${sisaHari} Hari)`;
            
            teksUtang = 
`🏦 *KREDIT BANK SENTRAL:*
• Sisa Utang: -${statusKredit.utang.toLocaleString('id-ID')}
• Status: ${peringatan}`;
        }

        const teksHasil = 
`💳 *INFORMASI KEUANGAN* 💳
👤 Nama: ${pushName}

💰 Saldo Tunai: *${uang.toLocaleString('id-ID')} ${global.mataUang}*

${teksUtang}`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};