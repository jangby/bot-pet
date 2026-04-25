const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'infolelang',
    description: 'Pengumuman status pelelangan Lisensi Toko dan daftar pemain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        // --- 🛡️ PENGAMAN DATABASE (DIPERBAIKI) 🛡️ ---
        if (!global.db.pet) global.db.pet = {};
        
        // Cek dan buat objek satu per satu agar tidak ada yang undefined
        if (!global.db.market) global.db.market = {};
        if (!global.db.market.lelang) global.db.market.lelang = {};
        if (!global.db.market.tokoPemain) global.db.market.tokoPemain = {};
        if (!global.db.market.milestoneToko) global.db.market.milestoneToko = 0;

        const pemainPet = Object.keys(global.db.pet).filter(n => n && n !== 'undefined' && n.trim() !== '');
        const totalPemain = pemainPet.length;
        
        const milestoneSekarang = global.db.market.milestoneToko;
        const targetMilestone = milestoneSekarang + 10;
        const sisaDibutuhkan = targetMilestone - totalPemain;

        // --- SISTEM KONVERSI LID KE NOMOR ASLI ---
        let groupParticipants = [];
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                groupParticipants = metadata.participants;
            } catch (err) {
                console.log("Gagal mengambil metadata grup");
            }
        }

        let tagPemainJid = [];
        let daftarNomorTeks = [];

        for (let jid of pemainPet) {
            let cleanStoredId = jid.trim().replace(/:\d+/, '').split('@')[0];
            let realNumber = cleanStoredId; 
            let realJid = `${cleanStoredId}@s.whatsapp.net`;

            if (groupParticipants.length > 0) {
                const participant = groupParticipants.find(p => 
                    (p.id && p.id.includes(cleanStoredId)) || 
                    (p.lid && p.lid.includes(cleanStoredId))
                );

                if (participant) {
                    realJid = participant.id; 
                    realNumber = realJid.split('@')[0];
                }
            }
            
            tagPemainJid.push(realJid);
            daftarNomorTeks.push(realNumber);
        }

        // --- 1. JIKA ADMIN INGIN MEMBUKA PAKSA LELANG ---
        const argStr = args.join(' ').toLowerCase();
        
        if (argStr.includes('buka')) {
            // Sekarang kode ini dijamin 100% aman karena global.db.market.lelang pasti ada
            global.db.market.lelang['BANK_SENTRAL'] = {
                nama: "Lisensi Toko Serba Ada",
                kategori: "serba_ada",
                etalase: {},
                tokenWeb: Math.random().toString(36).substring(2, 15),
                hargaBuka: 5000, 
                bidTertinggi: 5000,
                pemenangSementara: null,
                pemilikLama: "BANK_SENTRAL",
                waktuSita: Date.now(), 
                lastAnnounce: Date.now(), 
                chatId: chatId 
            };
            fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

            let teksBuka = `📢 *PENGUMUMAN RESMI BANK SENTRAL* 📢\n\n`;
            teksBuka += `Bank Sentral telah **MEMBUKA PELELANGAN** Lisensi Toko Serba Ada!\n\n`;
            teksBuka += `⚠️ *ATURAN LELANG:*\n`;
            teksBuka += `• Waktu Lelang: *Tepat 1 Jam* dari sekarang.\n`;
            teksBuka += `• Bot akan memberi update tiap 5 Menit.\n\n`;
            teksBuka += `👉 Ketik \`!bid BANK_SENTRAL [nominal]\` untuk menawar!\n\n`;
            
            teksBuka += `📜 *DAFTAR CALON PELANGGAN:*\n`;
            daftarNomorTeks.forEach((nomor, index) => {
                teksBuka += `${index + 1}. 👤 @${nomor}\n`;
            });
            teksBuka += `\n_Siapa yang akan menjadi sultan penguasa ekonomi di grup ini?_`;

            return await sock.sendMessage(chatId, { text: teksBuka, mentions: tagPemainJid }, { quoted: msg });
        }

        // --- 2. JIKA HANYA MENGECEK STATUS ---
        let teksInfo = `📢 *INFO JADWAL LELANG TOKO* 📢\n\n`;
        teksInfo += `📊 *PROGRES SAAT INI:*\n`;
        teksInfo += `• Total Pemilik Pet: *${totalPemain} Orang*\n`;
        
        if (sisaDibutuhkan > 0) {
            teksInfo += `• Kurang *${sisaDibutuhkan} orang* lagi untuk merilis lisensi toko berikutnya!\n\n`;
        } else {
            teksInfo += `• *Lisensi siap dirilis!* Atau sedang berlangsung di \`!lelang\`.\n\n`;
        }

        teksInfo += `👥 *DAFTAR PEMILIK PET SAAT INI:*\n\n`;
        
        if (totalPemain === 0) {
            teksInfo += `_Belum ada yang memiliki pet._\n`;
        } else {
            pemainPet.forEach((jidDB, index) => {
                const daftarPet = global.db.pet[jidDB];
                let infoPet = "Punya Pet";
                
                if (daftarPet && daftarPet.length > 0) {
                    const petAndalan = daftarPet.reduce((prev, current) => (prev.level > current.level) ? prev : current);
                    infoPet = `${petAndalan.nama} (${petAndalan.spesies} Lv.${petAndalan.level})`;
                }

                let nomorBersih = daftarNomorTeks[index];
                teksInfo += `${index + 1}. 👤 Pemilik: @${nomorBersih}\n`;
                teksInfo += `   🐾 Pet: ${infoPet}\n\n`;
            });
        }

        teksInfo += `━━━━━━━━━━━━━━━━━━━━━\n`;
        teksInfo += `💡 _Ajak member grup lain untuk !tokohewan agar lelang lisensi cepat dibuka!_`;

        await sock.sendMessage(chatId, { text: teksInfo, mentions: tagPemainJid }, { quoted: msg });
    }
};