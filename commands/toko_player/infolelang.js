const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'infolelang',
    description: 'Pengumuman status pelelangan Lisensi Toko dan daftar pemain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.market) global.db.market = { lelang: {}, tokoPemain: {}, milestoneToko: 0 };

        const pemainPet = Object.keys(global.db.pet);
        const totalPemain = pemainPet.length;
        
        const milestoneSekarang = global.db.market.milestoneToko || 0;
        const targetMilestone = milestoneSekarang + 10;
        const sisaDibutuhkan = targetMilestone - totalPemain;

        // --- SISTEM TAGGING YANG BENAR ---
        // Kita siapkan array JID lengkap untuk parameter mentions
        let tagPemainJid = [];
        // Kita siapkan daftar nomor bersih untuk tampilan teks
        let daftarNomorTeks = [];

        for (let jid of pemainPet) {
            // Bersihkan JID dari karakter aneh (seperti :1 @ dsb)
            let cleanJid = jid.replace(/:\d+/, '');
            if (!cleanJid.includes('@')) cleanJid += '@s.whatsapp.net';
            
            tagPemainJid.push(cleanJid);
            daftarNomorTeks.push(cleanJid.split('@')[0]);
        }

        // --- 1. JIKA ADMIN INGIN MEMBUKA PAKSA LELANG ---
        if (args.length > 0 && args[0] === 'buka') {
            global.db.market.lelang['BANK_SENTRAL'] = {
                nama: "Lisensi Toko Serba Ada",
                kategori: "serba_ada",
                etalase: {},
                tokenWeb: Math.random().toString(36).substring(2, 15),
                hargaBuka: 5000, 
                bidTertinggi: 5000,
                pemenangSementara: null,
                pemilikLama: "BANK_SENTRAL",
                waktuSita: Date.now()
            };
            fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

            let teksBuka = `📢 *PENGUMUMAN RESMI BANK SENTRAL* 📢\n\n`;
            teksBuka += `Bank Sentral telah **MEMBUKA PELELANGAN** Lisensi Toko Serba Ada!\n\n`;
            teksBuka += `📜 *DAFTAR CALON PELANGGAN:*\n`;
            
            daftarNomorTeks.forEach((nomor, index) => {
                teksBuka += `${index + 1}. 👤 @${nomor}\n`;
            });
            teksBuka += `\n_Siapa yang akan menjadi sultan penguasa ekonomi di grup ini?_`;

            return await sock.sendMessage(chatId, { 
                text: teksBuka, 
                mentions: tagPemainJid 
            }, { quoted: msg });
        }

        // --- 2. JIKA HANYA MENGECEK STATUS ---
        let teksInfo = `📢 *INFO JADWAL LELANG TOKO* 📢\n\n`;
        teksInfo += `📊 *PROGRES SAAT INI:*\n`;
        teksInfo += `• Total Pemilik Pet: *${totalPemain} Orang*\n`;
        
        if (sisaDibutuhkan > 0) {
            teksInfo += `• Kurang *${sisaDibutuhkan} orang* lagi untuk merilis lisensi toko berikutnya!\n\n`;
        }

        teksInfo += `👥 *DAFTAR PEMILIK PET SAAT INI:*\n`;
        
        if (totalPemain === 0) {
            teksInfo += `_Belum ada yang memiliki pet._\n`;
        } else {
            pemainPet.forEach((jid, index) => {
                const daftarPet = global.db.pet[jid];
                let infoPet = "Punya Pet";
                
                if (daftarPet && daftarPet.length > 0) {
                    const petAndalan = daftarPet.reduce((prev, current) => (prev.level > current.level) ? prev : current);
                    infoPet = `${petAndalan.nama} (${petAndalan.spesies} Lv.${petAndalan.level})`;
                }

                // Ambil nomor bersih dari index yang sama
                let nomorBersih = daftarNomorTeks[index];
                teksInfo += `${index + 1}. 👤 @${nomorBersih} - ${infoPet}\n`;
            });
        }

        teksInfo += `\n💡 _Ajak member grup lain untuk !tokohewan agar lelang lisensi cepat dibuka!_`;

        await sock.sendMessage(chatId, { 
            text: teksInfo, 
            mentions: tagPemainJid 
        }, { quoted: msg });
    }
};