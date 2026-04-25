module.exports = {
    name: 'join',
    description: 'Bergabung ke lobi mini-game yang sedang dibuka',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Jika pemain hanya mengetik "!join" tanpa menyebutkan nama game
        if (args.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Mau join game apa?\nContoh ketik: `!join serigala`' }, { quoted: msg });
        }

        const namaGame = args[0].toLowerCase();

        // --- ROUTING (MENGARAHKAN KE GAME YANG TEPAT) ---
        if (namaGame === 'serigala') {
            // Memanggil file serigala.js secara diam-diam dan menyisipkan kata "join"
            const gameCmd = sock.commands.get('serigala');
            if (gameCmd) {
                return await gameCmd.execute(sock, msg, ['join']);
            }
        } 
        // Tambahkan game lain di sini nanti, misalnya:
        // else if (namaGame === 'balapan') { ... }
        
        else {
            return await sock.sendMessage(chatId, { text: `⚠️ Game bernama '${namaGame}' tidak ditemukan atau belum tersedia.` }, { quoted: msg });
        }
    }
};