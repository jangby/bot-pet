module.exports = {
    name: 'nyaleg',
    description: 'Mendaftar sebagai Calon Menteri Ekonomi',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const p = global.db.pemilu;

        if (!p || p.status !== 'pendaftaran') {
            return await sock.sendMessage(chatId, { text: '⚠️ Pendaftaran Calon Menteri belum dibuka atau sudah ditutup!' }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Tuliskan Visi Misimu!\nContoh: `!nyaleg Akan menurunkan PPN menjadi 5%!`' }, { quoted: msg });
        }

        // Cek apakah sudah daftar
        const sudahDaftar = p.kandidat.find(c => c.id === senderNumber);
        if (sudahDaftar) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu sudah mendaftar sebagai Calon Menteri!' }, { quoted: msg });
        }

        // Tarik Biaya Administrasi
        const player = global.db.player[senderNumber] || { saldo: 0 };
        if ((player.saldo || 0) < p.fee) {
            return await sock.sendMessage(chatId, { text: `💰 Saldomu tidak cukup! Biaya pendaftaran (Kampanye) adalah *${p.fee.toLocaleString('id-ID')} Nexus*.` }, { quoted: msg });
        }

        player.saldo -= p.fee;
        global.db.bank.brankas = (global.db.bank.brankas || 0) + p.fee;

        const namaCaleg = player.nama || senderNumber;
        const visiMisi = args.join(' ');

        // Masukkan ke daftar calon
        p.kandidat.push({
            id: senderNumber,
            nama: namaCaleg,
            visi: visiMisi,
            votes: 0
        });

        await sock.sendMessage(chatId, { text: `✅ *PENDAFTARAN DITERIMA!*\n\nSelamat berjuang, *${namaCaleg}*!\nKamu mendapat *Nomor Urut ${p.kandidat.length}*.\n\n_Biaya pendaftaran sebesar ${p.fee} Nexus telah ditarik masuk ke Kas Negara._` }, { quoted: msg });
    }
};
