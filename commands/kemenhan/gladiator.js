module.exports = {
    name: 'gladiator',
    description: 'Melihat Papan Peringkat PVP Ranked (Arena Gladiator)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const playerDb = global.db.player || {};
        
        let leaderboard = [];

        // Kumpulkan pemain yang punya poin MMR (Pernah menang duel)
        for (const nomorPemain in playerDb) {
            const playerData = playerDb[nomorPemain];
            const mmr = playerData.mmr || 0;
            
            if (mmr > 0) {
                leaderboard.push({
                    nomor: nomorPemain,
                    nama: playerData.nama || nomorPemain,
                    mmr: mmr
                });
            }
        }

        // Jika belum ada yang pernah duel
        if (leaderboard.length === 0) {
            return await sock.sendMessage(chatId, { text: '🏟️ *ARENA GLADIATOR KOSONG*\n\nBelum ada satupun pemain yang memiliki Ranked Poin (MMR). Gunakan command `!duelpet` untuk memulai pertumpahan darah!' }, { quoted: msg });
        }

        // Urutkan dari MMR tertinggi ke terendah
        leaderboard.sort((a, b) => b.mmr - a.mmr);
        const top10 = leaderboard.slice(0, 10); // Ambil Top 10 saja

        // Fungsi Penentu Gelar/Pangkat Ranked
        const getRankTitle = (mmr) => {
            if (mmr >= 1000) return '👑 Panglima Gladiator (Mythic)';
            if (mmr >= 600) return '💎 Jenderal (Diamond)';
            if (mmr >= 300) return '🥇 Elite (Gold)';
            if (mmr >= 100) return '🥈 Kesatria (Silver)';
            return '🥉 Petarung Pemula (Bronze)';
        };

        let teksRank = `🏟️ *PAPAN PERINGKAT GLADIATOR (TOP 10)* 🏟️\n\n`;
        let tagPemain = [];

        top10.forEach((player, index) => {
            const rankTitle = getRankTitle(player.mmr);
            let medali = '🔸';
            if (index === 0) medali = '🏆';
            if (index === 1) medali = '🥈';
            if (index === 2) medali = '🥉';

            teksRank += `${medali} *#${index + 1} - ${player.nama}*\n`;
            teksRank += `   Pangkat: ${rankTitle}\n`;
            teksRank += `   Ranked Poin: *${player.mmr} MMR*\n\n`;
            
            // Format LID vs WA Normal untuk tag
            if (player.nomor.length > 14) {
                tagPemain.push(`${player.nomor}@lid`);
            } else {
                tagPemain.push(`${player.nomor}@s.whatsapp.net`);
            }
        });

        teksRank += `_Terus gunakan !duelpet untuk memanjat papan peringkat!_`;

        await sock.sendMessage(chatId, { text: teksRank }, { quoted: msg });
    }
};
