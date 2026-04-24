module.exports = {
    name: 'daftartoko',
    description: 'Membeli lisensi toko (Kini Ditutup)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        await sock.sendMessage(chatId, { text: '⛔ *PENDAFTARAN DITUTUP*\n\nLisensi toko kini bersifat sangat eksklusif (Toko Serba Ada). Lisensi baru hanya akan dirilis ke Balai Lelang oleh Bank Sentral secara otomatis setiap ada penambahan 10 pemain baru yang memiliki pet!\n\n_Pantau pengumuman grup dan gunakan `!lelang` untuk merebut lisensi._' }, { quoted: msg });
    }
};