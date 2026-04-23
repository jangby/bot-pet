module.exports = {
    name: 'kawin',
    description: 'Mengawinkan peliharaan dengan milik pasangan (Minimal Lv. 10)',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const penawarNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0 || args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!kawin @pasangan [ID Pet Kamu]`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];
        const idPetPenawar = parseInt(args[args.length - 1]);

        if (penawarNumber === targetNumber) return await sock.sendMessage(chatId, { text: '⚠️ Tidak bisa mengawinkan dengan diri sendiri!' }, { quoted: msg });

        // Validasi Pet Penawar
        if (!global.db.pet[penawarNumber]) return;
        const petPenawar = global.db.pet[penawarNumber].find(p => p.id === idPetPenawar);

        if (!petPenawar) return await sock.sendMessage(chatId, { text: `⚠️ Pet ID ${idPetPenawar} tidak ditemukan di kandangmu.` });
        if (petPenawar.level < 10) return await sock.sendMessage(chatId, { text: `⚠️ ${petPenawar.nama} masih di bawah umur! Harus minimal Level 10.` });
        if (petPenawar.kondisi !== 'Sehat') return await sock.sendMessage(chatId, { text: `⚠️ ${petPenawar.nama} sedang sakit!` });

        // Cari jodoh otomatis di kandang pasangan (Spesies sama, Lv >= 10, Sehat)
        const petPasangan = (global.db.pet[targetNumber] || []).find(p => 
            p.spesies === petPenawar.spesies && 
            p.level >= 10 && 
            p.kondisi === 'Sehat'
        );

        if (!petPasangan) {
            return await sock.sendMessage(chatId, { text: `⚠️ @${targetNumber} tidak memiliki *${petPenawar.spesies}* yang Sehat dan mencapai Level 10 untuk dikawinkan.`, mentions: [targetId] });
        }

        // Simpan data lamaran ke memori global
        if (!global.db.proposalKawin) global.db.proposalKawin = {};
        
        global.db.proposalKawin[msg.key.id] = {
            penawar: penawarNumber,
            idPetPenawar: petPenawar.id,
            target: targetNumber,
            idPetTarget: petPasangan.id,
            spesies: petPenawar.spesies,
            diet: petPenawar.diet,
            chatId: chatId
        };

        const teksLamaran = 
`💖 *PROPOSAL PERNIKAHAN PET!* 💖

@${penawarNumber} ingin mengawinkan *${petPenawar.nama}* (Lv.${petPenawar.level}) miliknya dengan *${petPasangan.nama}* (Lv.${petPasangan.level}) milik @${targetNumber}!

👉 *@${targetNumber}, balas (reply) pesan ini dengan mengetik "gas" untuk merestui pernikahan ini!*
_Biaya persalinan ke Bank Sentral: Gratis_`;

        await sock.sendMessage(chatId, { text: teksLamaran, mentions: [senderId, targetId] }, { quoted: msg });
    }
};