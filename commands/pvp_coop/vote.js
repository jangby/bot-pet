const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'vote',
    description: 'Memberikan suara eksekusi di game Serigala Malam',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const voterNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.minigame || !global.db.minigame[chatId] || global.db.minigame[chatId].status !== 'voting') {
            return await sock.sendMessage(chatId, { text: '⚠️ Sedang tidak ada sesi Voting yang berjalan saat ini.' }, { quoted: msg });
        }

        const gameSession = global.db.minigame[chatId];

        if (!gameSession.alive.includes(voterNumber)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Hanya pemain yang berpartisipasi yang boleh memberikan Vote!' }, { quoted: msg });
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah! Gunakan: `!vote @nama_pemain`' }, { quoted: msg });
        }

        const targetNumber = mentioned[0].replace(/:\d+/, '').split('@')[0];

        if (!gameSession.alive.includes(targetNumber)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Orang yang kamu vote tidak sedang ikut bermain.' }, { quoted: msg });
        }

        gameSession.votes[voterNumber] = targetNumber;
        
        await sock.sendMessage(chatId, { 
            text: `🗳️ @${voterNumber} telah mem-vote @${targetNumber}!`, 
            mentions: [`${voterNumber}@s.whatsapp.net`, `${targetNumber}@s.whatsapp.net`] 
        });

        const totalVoted = Object.keys(gameSession.votes).length;
        if (totalVoted >= gameSession.alive.length) {
            clearTimeout(gameSession.timer); 
            await this.kalkulasiHasil(sock, chatId);
        }
    },

    async kalkulasiHasil(sock, chatId) {
        const gameSession = global.db.minigame[chatId];
        if (gameSession.status !== 'voting') return;

        gameSession.status = 'idle'; 
        
        const votes = gameSession.votes;
        const tally = {};
        let terEksekusi = null;
        let maxVotes = 0;

        for (let voter in votes) {
            const target = votes[voter];
            tally[target] = (tally[target] || 0) + 1;
            
            if (tally[target] > maxVotes) {
                maxVotes = tally[target];
                terEksekusi = target;
            }
        }

        if (!terEksekusi) {
            terEksekusi = gameSession.alive[Math.floor(Math.random() * gameSession.alive.length)]; 
        }

        const roleTerbakar = gameSession.roles[terEksekusi];
        const jackpot = gameSession.taruhanTerkumpul;

        // --- KONVERSI LID UNTUK PENGUMUMAN AKHIR ---
        let groupParticipants = [];
        try {
            const metadata = await sock.groupMetadata(chatId);
            groupParticipants = metadata.participants;
        } catch(e) {}

        const getReal = (num) => {
            let res = { realNum: num, realJid: `${num}@s.whatsapp.net` };
            if (groupParticipants.length > 0) {
                const part = groupParticipants.find(x => (x.id && x.id.includes(num)) || (x.lid && x.lid.includes(num)));
                if (part) { res.realJid = part.id; res.realNum = part.id.split('@')[0]; }
            }
            return res;
        };

        const korban = getReal(terEksekusi);
        let arrayMention = [];

        let teksHasil = `🔥 *HASIL EKSEKUSI MATI* 🔥\n\n`;
        teksHasil += `Berdasarkan suara terbanyak, warga sepakat untuk mengeksekusi @${korban.realNum}!\n\n`;
        teksHasil += `Identitas aslinya adalah... *${roleTerbakar.toUpperCase()}*!\n\n`;
        arrayMention.push(korban.realJid);

        if (roleTerbakar === 'Serigala') {
            teksHasil += `🎉 *WARGA DESA MENANG!* 🎉\nSerigala telah mati. Kedamaian kembali ke grup ini.\n\n`;
            const timWarga = gameSession.pemain.filter(p => gameSession.roles[p] !== 'Serigala');
            const hadiahPerOrang = Math.floor(jackpot / timWarga.length);
            
            teksHasil += `💰 Jackpot sebesar *${jackpot.toLocaleString('id-ID')} 💠* dibagi rata:\n`;
            timWarga.forEach(warga => {
                global.db.player[warga].saldo += hadiahPerOrang;
                const pWarga = getReal(warga);
                teksHasil += `• @${pWarga.realNum} (+${hadiahPerOrang} 💠)\n`;
                arrayMention.push(pWarga.realJid);
            });
        } else {
            const serigalaPlayer = gameSession.pemain.find(p => gameSession.roles[p] === 'Serigala');
            const pSrigala = getReal(serigalaPlayer);
            
            teksHasil += `💀 *SERIGALA MENANG!* 💀\nKalian salah membunuh orang! Serigala yang asli adalah @${pSrigala.realNum}. Ia membantai sisa warga yang ada.\n\n`;
            
            global.db.player[serigalaPlayer].saldo += jackpot;
            teksHasil += `🐺 @${pSrigala.realNum} membawa kabur seluruh Jackpot *${jackpot.toLocaleString('id-ID')} 💠*!`;
            arrayMention.push(pSrigala.realJid);
        }

        global.db.minigame[chatId] = { status: 'idle', pemain: [], timer: null };
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: teksHasil, mentions: arrayMention });
    }
};