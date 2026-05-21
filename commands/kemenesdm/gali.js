const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gali',
    description: 'Bergabung dengan ekspedisi tambang grup',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Validasi lobi
        if (!global.db.tambangGrup || !global.db.tambangGrup[chatId]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Tidak ada lobi ekspedisi tambang yang sedang terbuka di grup ini.\nKetik `!tambang grup` untuk membuatnya.' }, { quoted: msg });
        }

        const lobi = global.db.tambangGrup[chatId];

        // Cek jika sudah ikut
        if (lobi.peserta.includes(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu sudah ada di dalam lobi ekspedisi ini!' }, { quoted: msg });
        }

        // Cek syarat pet
        if (!global.db.pet[senderNumber] || global.db.pet[senderNumber].length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu harus punya minimal 1 peliharaan untuk ikut ekspedisi!' }, { quoted: msg });
        }

        const petTarget = global.db.pet[senderNumber].reduce((prev, current) => (prev.level > current.level) ? prev : current);

        if (petTarget.kondisi !== 'Sehat') {
            return await sock.sendMessage(chatId, { text: `⚠️ Peliharaanmu (*${petTarget.nama}*) sedang sakit! Tidak bisa ikut ekspedisi.` }, { quoted: msg });
        }

        const jamLalu = Math.floor((Date.now() - petTarget.lastFeed) / (1000 * 60 * 60));
        let laparSekarang = Math.max(0, petTarget.lapar - (jamLalu * 5));

        if (laparSekarang < 30) {
            return await sock.sendMessage(chatId, { text: `⚠️ Tenaga *${petTarget.nama}* tidak cukup (Sisa: ${laparSekarang}%).\nBeri makan dulu agar tenaganya di atas 30%!` }, { quoted: msg });
        }

        // Gabung lobi
        lobi.peserta.push(senderNumber);

        // Potong stamina pet yang ikut
        petTarget.lapar = laparSekarang - 30;
        petTarget.lastFeed = Date.now();
        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));

        // --- Helper resolve LID ke JID asli ---
        const resolveJid = async () => {
            let participants = [];
            if (chatId.endsWith('@g.us')) {
                try {
                    const meta = await sock.groupMetadata(chatId);
                    participants = meta.participants;
                } catch(e) {}
            }
            return (nomor) => {
                if (participants.length > 0) {
                    const part = participants.find(p =>
                        (p.id && p.id.includes(nomor)) || (p.lid && p.lid.includes(nomor))
                    );
                    if (part && part.id.endsWith('@s.whatsapp.net')) return { jid: part.id, num: part.id.split('@')[0] };
                }
                return { jid: `${nomor}@s.whatsapp.net`, num: nomor };
            };
        };

        if (lobi.peserta.length < 3) {
            // Belum penuh — konfirmasi bergabung
            const getJid = await resolveJid();
            const rs = getJid(senderNumber);
            return await sock.sendMessage(chatId, {
                text: `✅ @${rs.num} bergabung ke ekspedisi!\n\n⚠️ Butuh *${3 - lobi.peserta.length} orang* lagi untuk mulai menggali.`,
                mentions: [rs.jid]
            });
        } else {
            // LOBI PENUH! EKSEKUSI GACHA GRUP
            const peserta = [...lobi.peserta];
            delete global.db.tambangGrup[chatId];

            const getJid = await resolveJid();

            let teksHasil = `🎉 *EKSPEDISI BERHASIL!* 🎉\n\nTim yang beranggotakan 3 orang telah bekerja sama menggali terowongan kristal!\nSetiap orang mendapatkan harta karun langka:\n\n`;
            let mentions = [];

            peserta.forEach(nomor => {
                const rng = Math.random() * 100;
                let barangDapat = 'emas';
                let namaBarang = 'Emas Murni';

                if (rng < 20) { // 20% Berlian, 80% Emas
                    barangDapat = 'berlian';
                    namaBarang = 'Berlian';
                }

                if (!global.db.inventory[nomor]) global.db.inventory[nomor] = {};
                global.db.inventory[nomor][barangDapat] = (global.db.inventory[nomor][barangDapat] || 0) + 1;
                
                // Set cooldown grup
                if (!global.db.cooldownTambang) global.db.cooldownTambang = {};
                global.db.cooldownTambang[nomor + '_grup'] = Date.now();

                const rp = getJid(nomor);
                teksHasil += `🔸 @${rp.num} mendapatkan 1x ${namaBarang}\n`;
                mentions.push(rp.jid);
            });

            fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
            teksHasil += `\n_Harta telah dimasukkan ke dalam tas (!inv) masing-masing._`;

            return await sock.sendMessage(chatId, { text: teksHasil, mentions: mentions });
        }
    }
};
