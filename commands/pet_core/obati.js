const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'obati',
    description: 'Mengobati peliharaan yang sakit menggunakan item dari tas',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!obati 1 pil ringan`' }, { quoted: msg });
        }

        const petId = parseInt(args[0]);
        const namaObatDicari = args.slice(1).join(' ').toLowerCase();

        // 1. Validasi Peliharaan
        if (!global.db.pet[senderNumber]) return;
        const petTarget = global.db.pet[senderNumber].find(p => p.id === petId);

        if (!petTarget) return await sock.sendMessage(chatId, { text: `⚠️ Peliharaan dengan ID [${petId}] tidak ditemukan.` }, { quoted: msg });
        if (petTarget.kondisi === 'Sehat') return await sock.sendMessage(chatId, { text: `✅ Peliharaanmu sedang sehat bugar, tidak perlu diberi obat.` }, { quoted: msg });

        // 2. Validasi Tas & Cari Obat
        const tas = global.db.inventory[senderNumber];
        if (!tas) return await sock.sendMessage(chatId, { text: '🎒 Tas kamu kosong!' });

        let idObatDitemukan = null;
        let infoObat = null;
        for (const [idBarang, jumlah] of Object.entries(tas)) {
            if (jumlah > 0) {
                const info = global.db.market.pasarInduk.apotek[idBarang];
                if (info && info.nama.toLowerCase().includes(namaObatDicari)) {
                    idObatDitemukan = idBarang;
                    infoObat = info;
                    break;
                }
            }
        }

        if (!idObatDitemukan) return await sock.sendMessage(chatId, { text: `⚠️ Obat "${namaObatDicari}" tidak ditemukan di dalam tasmu.` }, { quoted: msg });

        // 3. Logika Kecocokan Obat
        let obatCocok = false;
        if (petTarget.kondisi.includes('Pencernaan') && (idObatDitemukan === 'pil_ringan' || idObatDitemukan === 'antibiotik')) obatCocok = true;
        if (petTarget.kondisi.includes('Luka Fisik') && (idObatDitemukan === 'perban' || idObatDitemukan === 'salep_luka')) obatCocok = true;

        tas[idObatDitemukan] -= 1; // Obat tetap hangus dipakai

        if (!obatCocok) {
            fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));
            return await sock.sendMessage(chatId, { text: `❌ *SALAH OBAT!*\nKamu memberikan ${infoObat.nama} untuk penyakit ${petTarget.kondisi}.\nObat terbuang sia-sia dan kondisi ${petTarget.nama} belum membaik.` }, { quoted: msg });
        }

        // 4. Sistem Gacha Kesembuhan (RNG)
        const gachaSembuh = Math.random() * 100;
        let peluang = idObatDitemukan === 'antibiotik' || idObatDitemukan === 'salep_luka' ? 95 : 60; // Obat mahal peluang sembuhnya lebih tinggi

        let teksHasil = '';
        if (gachaSembuh <= peluang) {
            petTarget.kondisi = 'Sehat';
            petTarget.lapar = Math.min(100, petTarget.lapar + 20); // Bonus kenyang dikit
            teksHasil = `🏥 *PENGOBATAN BERHASIL!*\nBerkat ${infoObat.nama}, si ${petTarget.nama} kini telah kembali *SEHAT* dan siap beraktivitas!`;
        } else {
            teksHasil = `🥀 *PENGOBATAN GAGAL!*\nObat ${infoObat.nama} sudah diberikan, namun sayangnya kondisi ${petTarget.nama} masih terlalu lemah. Coba berikan obat lagi.`;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/inventory.json'), JSON.stringify(global.db.inventory, null, 2));

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};