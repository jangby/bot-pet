module.exports = {
    name: 'duelpet',
    description: 'Menantang peliharaan pemain lain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const penantangNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0 || args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!duelpet @lawan [ID Pet Kamu]`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];
        const idPetPenantang = parseInt(args[args.length - 1]);

        if (penantangNumber === targetNumber) return await sock.sendMessage(chatId, { text: '⚠️ Tidak bisa duel dengan diri sendiri!' }, { quoted: msg });

        // Validasi Pet Penantang
        if (!global.db.pet[penantangNumber]) return;
        const petPenantang = global.db.pet[penantangNumber].find(p => p.id === idPetPenantang);

        if (!petPenantang) return await sock.sendMessage(chatId, { text: `⚠️ Pet ID ${idPetPenantang} tidak ditemukan di kandangmu.` });
        if (petPenantang.kondisi !== 'Sehat') return await sock.sendMessage(chatId, { text: `⚠️ ${petPenantang.nama} sedang sakit! Obati dulu sebelum bertarung.` });
        if (petPenantang.lapar < 30) return await sock.sendMessage(chatId, { text: `⚠️ ${petPenantang.nama} terlalu lapar untuk bertarung! Beri makan dulu.` });

        // Cek apakah lawan punya pet sehat
        const petLawan = (global.db.pet[targetNumber] || []).find(p => p.kondisi === 'Sehat' && p.lapar >= 30);
        if (!petLawan) return await sock.sendMessage(chatId, { text: `⚠️ Lawanmu tidak memiliki peliharaan yang siap bertarung saat ini.` });

        // Simpan data tantangan ke memori global
        if (!global.db.tantanganDuel) global.db.tantanganDuel = {};
        
        // Simpan menggunakan ID pesan agar bot tahu pesan mana yang harus di-react
        global.db.tantanganDuel[msg.key.id] = {
            penantang: penantangNumber,
            idPetPenantang: petPenantang.id,
            target: targetNumber,
            idPetTarget: petLawan.id,
            chatId: chatId
        };

        const teksTantangan = 
`⚔️ *TANTANGAN DUEL!* ⚔️

@${penantangNumber} mengirimkan *${petPenantang.nama}* (Lv.${petPenantang.level}) untuk menantang peliharaan milik @${targetNumber}!

👉 *@${targetNumber}, balas (reply) pesan ini dengan mengetik "gas" untuk menerima tantangan!*`;

        await sock.sendMessage(chatId, { text: teksTantangan, mentions: [senderId, targetId] }, { quoted: msg });
    }
};