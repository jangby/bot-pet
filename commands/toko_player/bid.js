const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bid',
    description: 'Memberikan tawaran untuk toko di Balai Lelang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        let penawarNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // --- 🛡️ ANTI LID BUG (SINKRONISASI DOMPET ASLI) 🛡️ ---
        // Memastikan penawar menggunakan ID aslinya, bukan ID samaran dari grup
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => 
                    (p.id && p.id.includes(penawarNumber)) || 
                    (p.lid && p.lid.includes(penawarNumber))
                );
                if (participant) {
                    penawarNumber = participant.id.split('@')[0];
                }
            } catch (err) {}
        }
        
        // Pastikan dompet penawar terdaftar di sistem
        if (!global.db.player[penawarNumber]) {
            global.db.player[penawarNumber] = { saldo: 0, reputasi: 0 };
        }

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const argTeksLengkap = args.join(' ').toUpperCase();
        let pemilikLamaNumber = '';
        let nominalBid = 0;

        // PENDETEKSI FORMAT
        if (argTeksLengkap.includes('BANK_SENTRAL') || argTeksLengkap.includes('BANK SENTRAL') || argTeksLengkap.includes('BANK')) {
            pemilikLamaNumber = 'BANK_SENTRAL';
            const angkaDitemukan = argTeksLengkap.match(/\d+/g);
            if (angkaDitemukan) nominalBid = parseInt(angkaDitemukan[angkaDitemukan.length - 1]);
        } else if (mentioned.length > 0) {
            pemilikLamaNumber = mentioned[0].replace(/:\d+/, '').split('@')[0];
            const angkaDitemukan = argTeksLengkap.match(/\d+/g);
            if (angkaDitemukan) nominalBid = parseInt(angkaDitemukan[angkaDitemukan.length - 1]);
        } else {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nKetik: `!bid BANK_SENTRAL [nominal]`' }, { quoted: msg });
        }

        if (!nominalBid || nominalBid <= 0) return await sock.sendMessage(chatId, { text: '⚠️ Nominal uang tidak valid.' }, { quoted: msg });
        if (penawarNumber === pemilikLamaNumber) return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa menawar tokomu sendiri.' }, { quoted: msg });

        if (!global.db.market.lelang) global.db.market.lelang = {};
        const lelangTarget = global.db.market.lelang[pemilikLamaNumber];
        
        if (!lelangTarget) return await sock.sendMessage(chatId, { text: '⚠️ Toko tersebut sedang tidak ada di Balai Lelang saat ini.' }, { quoted: msg });

        if (nominalBid <= lelangTarget.bidTertinggi) {
            return await sock.sendMessage(chatId, { text: `⚠️ Tawaranmu terlalu rendah! Tawaran tertinggi saat ini: *${lelangTarget.bidTertinggi.toLocaleString('id-ID')} 💠*.` }, { quoted: msg });
        }

        const saldoPenawar = parseInt(global.db.player[penawarNumber].saldo) || 0;
        if (saldoPenawar < nominalBid) {
            return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup! Kamu hanya memiliki *${saldoPenawar.toLocaleString('id-ID')} 💠*.` }, { quoted: msg });
        }

        let teksRefund = '';
        let arrayMention = [`${penawarNumber}@s.whatsapp.net`];

        // --- 💸 SISTEM PENGEMBALIAN DANA (REFUND) TRANSPARAN 💸 ---
        if (lelangTarget.pemenangSementara) {
            const penawarLama = lelangTarget.pemenangSementara;
            
            // Pengaman database untuk penawar lama
            if (!global.db.player[penawarLama]) global.db.player[penawarLama] = { saldo: 0, reputasi: 0 };
            
            // Kembalikan uang 100% utuh
            global.db.player[penawarLama].saldo = (parseInt(global.db.player[penawarLama].saldo) || 0) + parseInt(lelangTarget.bidTertinggi);
            
            // Buat resi pengumuman agar pemain tahu uangnya kembali
            teksRefund = `\n\n💸 _Dana sebesar *${lelangTarget.bidTertinggi.toLocaleString('id-ID')} 💠* telah dikembalikan otomatis ke dompet @${penawarLama}._`;
            arrayMention.push(`${penawarLama}@s.whatsapp.net`);
        }

        // Potong saldo penawar baru & Update Database Lelang
        global.db.player[penawarNumber].saldo -= nominalBid;
        lelangTarget.bidTertinggi = nominalBid;
        lelangTarget.pemenangSementara = penawarNumber;

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        const teksBerhasil = `🔥 *TAWARAN DITERIMA!*\n\n@${penawarNumber} mengambil alih pimpinan lelang untuk *${lelangTarget.nama}* dengan tawaran *${nominalBid.toLocaleString('id-ID')} 💠*!${teksRefund}`;

        await sock.sendMessage(chatId, { text: teksBerhasil, mentions: arrayMention }, { quoted: msg });
    }
};