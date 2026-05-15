module.exports = {
    name: 'coblos',
    description: 'Memberikan suara pada Pemilu (Via PM/Japri)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // WAJIB DI PM / JAPRI!
        if (chatId.endsWith('@g.us')) {
            // Hapus pesan jika memungkinkan (agar rahasia terjaga), tapi tidak didukung semua device, jadi beri tahu saja.
            return await sock.sendMessage(chatId, { text: '🚨 *AWAS RAHASIA BOCOR!*\n\nHey! Jangan nyoblos di grup! Hak suaramu rahasia!\nKirim `!coblos [nomor_urut]` ke *Chat Pribadi (Japri)* bot ini sekarang juga!' }, { quoted: msg });
        }

        const p = global.db.pemilu;
        if (!p || p.status !== 'voting') {
            return await sock.sendMessage(chatId, { text: '⚠️ Masa pencoblosan sedang tidak aktif.' });
        }

        if (p.pemilih.includes(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu sudah menggunakan hak suaramu! Satu warga hanya boleh mencoblos satu kali.' });
        }

        if (args.length === 0 || isNaN(parseInt(args[0]))) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan Nomor Urut kandidat!\nContoh: `!coblos 1`' });
        }

        const pilihan = parseInt(args[0]) - 1; // Array index mulai dari 0

        if (pilihan < 0 || pilihan >= p.kandidat.length) {
            return await sock.sendMessage(chatId, { text: `⚠️ Nomor urut tidak valid! Hanya ada Nomor 1 sampai ${p.kandidat.length}.` });
        }

        // Masukkan suara!
        p.kandidat[pilihan].votes += 1;
        p.pemilih.push(senderNumber); // Tandai sudah nyoblos

        await sock.sendMessage(chatId, { text: `🗳️ *SUARA MASUK!*\n\nKamu telah mencoblos Kandidat Nomor Urut ${args[0]} (*${p.kandidat[pilihan].nama}*).\nTerima kasih telah berpartisipasi menjaga demokrasi Republik Nexus!` });
    }
};
