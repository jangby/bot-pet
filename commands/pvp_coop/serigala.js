const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'serigala',
    description: 'Mini-game tebak peran (Social Deduction) berhadiah besar',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const tiketMasuk = 1000; 
        const minimalPemain = 4;

        if (!global.db.minigame) global.db.minigame = {};
        if (!global.db.minigame[chatId]) global.db.minigame[chatId] = { status: 'idle', pemain: [], timer: null };

        const gameSession = global.db.minigame[chatId];
        const arg1 = args[0] ? args[0].toLowerCase() : '';

        // --- HELPER: KONVERSI LID KE NOMOR ASLI (ANTI-BUG) ---
        const getRealId = async (numbersArray) => {
            let groupParticipants = [];
            if (chatId.endsWith('@g.us')) {
                try {
                    const metadata = await sock.groupMetadata(chatId);
                    groupParticipants = metadata.participants;
                } catch(e) {}
            }
            let resolved = [];
            for (let num of numbersArray) {
                let realJid = `${num}@s.whatsapp.net`;
                let realNum = num;
                if (groupParticipants.length > 0) {
                    const part = groupParticipants.find(x => (x.id && x.id.includes(num)) || (x.lid && x.lid.includes(num)));
                    if (part) {
                        realJid = part.id;
                        realNum = realJid.split('@')[0];
                    }
                }
                resolved.push({ dbId: num, realNum, realJid });
            }
            return resolved;
        };

        // --- 1. MEMBUKA LOBI GAME ---
        if (arg1 === 'buka') {
            if (gameSession.status !== 'idle') {
                return await sock.sendMessage(chatId, { text: '⚠️ Sedang ada lobi atau game yang berjalan di grup ini!' }, { quoted: msg });
            }

            gameSession.status = 'lobi';
            gameSession.pemain = [];
            gameSession.taruhanTerkumpul = 0;

            let teksBuka = `🐺 *GAME SERIGALA MALAM DIBUKA!* 🐺\n\n`;
            teksBuka += `Ada penyusup di antara kita! Temukan Serigala yang menyamar menjadi Warga.\n\n`;
            teksBuka += `🎟️ Biaya Masuk: *${tiketMasuk.toLocaleString('id-ID')} 💠*\n`;
            teksBuka += `👥 Minimal: *${minimalPemain} Pemain*\n\n`;
            teksBuka += `👉 Ketik \`!join serigala\` untuk ikut bermain!\n`;
            teksBuka += `_Lobi akan ditutup dan game dimulai otomatis dalam 2 Menit._`;

            await sock.sendMessage(chatId, { text: teksBuka }, { quoted: msg });

            // Timer Lobi (2 Menit)
            gameSession.timer = setTimeout(async () => {
                if (gameSession.pemain.length >= minimalPemain) {
                    await sock.sendMessage(chatId, { text: `⏳ *Waktu lobi habis!* \nGame dimulai dengan ${gameSession.pemain.length} pemain. Total Jackpot: *${gameSession.taruhanTerkumpul.toLocaleString('id-ID')} 💠*.\n\n_Membagikan peran secara rahasia..._` });
                    
                    // FASE PEMBAGIAN PERAN
                    const pemainList = [...gameSession.pemain];
                    for (let i = pemainList.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pemainList[i], pemainList[j]] = [pemainList[j], pemainList[i]];
                    }

                    gameSession.roles = {};
                    gameSession.alive = [...gameSession.pemain];
                    gameSession.votes = {}; 

                    gameSession.roles[pemainList[0]] = 'Serigala';
                    gameSession.roles[pemainList[1]] = 'Penerawang';
                    for (let i = 2; i < pemainList.length; i++) {
                        gameSession.roles[pemainList[i]] = 'Warga';
                    }

                    // Kirim PM ke nomor asli pemain
                    const resolvedPlayers = await getRealId(gameSession.pemain);
                    for (let data of resolvedPlayers) {
                        const role = gameSession.roles[data.dbId];
                        let roleMsg = ``;
                        if(role === 'Serigala') roleMsg = `🐺 *PERANMU: SERIGALA*\n\nJangan sampai ketahuan! Berpura-puralah menjadi warga biasa di grup. Jika kamu selamat dari voting, kamu memenangkan seluruh uang Jackpot!`;
                        if(role === 'Penerawang') roleMsg = `👁️ *PERANMU: PENERAWANG*\n\nKamu adalah warga yang memiliki insting tajam. Analisa percakapan di grup dan arahkan warga lain untuk mem-vote Serigala!`;
                        if(role === 'Warga') roleMsg = `🐑 *PERANMU: WARGA DESA*\n\nAda 1 Serigala yang menyusup. Berdiskusilah di grup, cari siapa yang mencurigakan, dan vote dia agar dihukum mati!`;

                        await sock.sendMessage(data.realJid, { text: roleMsg });
                    }

                    await sock.sendMessage(chatId, { text: `🌙 *MALAM TIBA...*\n\nPeran telah dikirim ke PM masing-masing (Pastikan nomor bot tidak diblokir!).\n\n🗣️ *FASE DISKUSI DIMULAI*\nKalian punya waktu *3 Menit* untuk berdebat, saling tuduh, atau membela diri di grup ini!` });
                    
                    gameSession.status = 'diskusi';

                    // Timer Diskusi ke Voting
                    setTimeout(async () => {
                        if(global.db.minigame[chatId].status !== 'diskusi') return; 
                        global.db.minigame[chatId].status = 'voting';
                        
                        let teksVote = `☀️ *PAGI TIBA - FASE VOTING!* ☀️\n\nWaktu diskusi habis! Saatnya mengambil keputusan.\nSiapa yang akan kalian eksekusi mati?\n\n`;
                        teksVote += `👉 Ketik: \`!vote @nama_pemain\`\n`;
                        teksVote += `_Kalian hanya punya waktu 2 Menit untuk melakukan vote!_`;
                        
                        await sock.sendMessage(chatId, { text: teksVote });

                        gameSession.timer = setTimeout(async () => {
                            if(global.db.minigame[chatId].status === 'voting') {
                                const cmdVote = sock.commands.get('vote');
                                if(cmdVote) await cmdVote.kalkulasiHasil(sock, chatId);
                            }
                        }, 120000);

                    }, 180000);

                } else {
                    gameSession.pemain.forEach(p => { global.db.player[p].saldo += tiketMasuk; });
                    gameSession.status = 'idle';
                    gameSession.pemain = [];
                    await sock.sendMessage(chatId, { text: `⚠️ Game dibatalkan karena pemain tidak mencapai minimal ${minimalPemain} orang. Uang pendaftaran dikembalikan ke dompet.` });
                }
            }, 120000); 
            return;
        }

        // --- 2. PEMAIN JOIN LOBI ---
        if (arg1 === 'join' || msg.message.conversation.includes('!join serigala')) {
            if (gameSession.status !== 'lobi') return await sock.sendMessage(chatId, { text: '⚠️ Tidak ada lobi yang dibuka. Ketik `!serigala buka`.' }, { quoted: msg });
            if (gameSession.pemain.includes(senderNumber)) return await sock.sendMessage(chatId, { text: '⚠️ Kamu sudah masuk di lobi ini.' }, { quoted: msg });

            if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0 };
            const saldo = global.db.player[senderNumber].saldo || 0;
            
            if (saldo < tiketMasuk) return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup! Butuh ${tiketMasuk} 💠 untuk ikut.` }, { quoted: msg });

            global.db.player[senderNumber].saldo -= tiketMasuk;
            gameSession.pemain.push(senderNumber);
            gameSession.taruhanTerkumpul += tiketMasuk;

            // Resolve nomor asli untuk semua pemain demi tampilan yang rapi
            const resolvedPlayers = await getRealId(gameSession.pemain);
            const senderResolved = resolvedPlayers.find(x => x.dbId === senderNumber);
            
            let teksJoin = `✅ @${senderResolved.realNum} berhasil bergabung ke lobi!\n\n`;
            teksJoin += `👥 *DAFTAR PEMAIN SEMENTARA (${gameSession.pemain.length}/${minimalPemain}):*\n`;
            
            let tagPemainJid = [];
            resolvedPlayers.forEach((p, index) => {
                teksJoin += `${index + 1}. 👤 @${p.realNum}\n`;
                tagPemainJid.push(p.realJid);
            });

            teksJoin += `\n💰 Total Jackpot: *${gameSession.taruhanTerkumpul.toLocaleString('id-ID')} 💠*`;

            await sock.sendMessage(chatId, { text: teksJoin, mentions: tagPemainJid }, { quoted: msg });
            return;
        }
    }
};