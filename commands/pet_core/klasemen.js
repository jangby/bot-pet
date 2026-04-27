const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'klasemen',
    description: 'Menampilkan papan peringkat pemain terkaya dan terkuat via Web',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const playerDb = global.db.player || {};
        const petDb = global.db.pet || {};
        let leaderboard = [];

        const rarityBonus = {
            'Common': 500, 'Rare': 2000, 'Epic': 5000,
            'Mythic': 12000, 'Legendary': 25000, 'SECRET': 50000, 'Unknown': 0
        };

        // Konversi LID (Agar tidak error @+1...)
        let groupParticipants = [];
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                groupParticipants = metadata.participants;
            } catch (err) {}
        }

        for (const nomorPemain in playerDb) {
            if (nomorPemain === 'BANK_SENTRAL') continue;

            const playerData = playerDb[nomorPemain];
            let saldo = parseInt(playerData.saldo) || 0;
            let petScore = 0;
            let petCount = 0;

            if (petDb[nomorPemain]) {
                petDb[nomorPemain].forEach(pet => {
                    petCount++;
                    let bonus = rarityBonus[pet.rarity] || 0;
                    petScore += bonus + ((pet.level || 1) * 500) + ((pet.power || 0) * 20) + ((pet.health || 100) * 2);
                });
            }

            const totalScore = saldo + petScore;
            
            if (totalScore > 0) {
                let realNumber = nomorPemain;
                if (groupParticipants.length > 0) {
                    const participant = groupParticipants.find(p => 
                        (p.id && p.id.includes(nomorPemain)) || (p.lid && p.lid.includes(nomorPemain))
                    );
                    if (participant) realNumber = participant.id.split('@')[0];
                }

                // ✨ Jika belum daftar, namanya jadi "Belum Daftar" ✨
                const namaPemain = playerData.nama || `[Belum Daftar] - ${realNumber}`;

                leaderboard.push({
                    nomor: realNumber,
                    nama: namaPemain,
                    saldo: saldo,
                    petScore: petScore,
                    totalScore: totalScore,
                    petCount: petCount
                });
            }
        }

        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
        const top50 = leaderboard.slice(0, 50);

        const publicPath = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath);
        fs.writeFileSync(path.join(publicPath, 'data_klasemen.json'), JSON.stringify(top50, null, 2));

        const linkWeb = "https://d687-180-241-241-59.ngrok-free.app/klasemen.html";

        let teks = `🏆 *NEXUS LEADERBOARD DIUPDATE!* 🏆\n\n`;
        teks += `Sistem telah menghitung ulang total kekayaan dan kualitas peliharaan seluruh pemain.\n\n`;
        teks += `👉 *CEK KLASEMEN TERBARU:*\n`;
        teks += `🌐 ${linkWeb}\n\n`;
        teks += `_Catatan: Jika namamu tertulis [Belum Daftar], segera ketik !nama [Namamu]._`;

        await sock.sendMessage(chatId, { text: teks }, { quoted: msg });
    }
};