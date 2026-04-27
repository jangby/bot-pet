const fs = require('fs');
const path = require('path');

// --- KATALOG GEAR (Untuk menerjemahkan ID menjadi Nama) ---
const katalogGear = {
    // Senjata
    "cakar_besi": { nama: "Cakar Besi" },
    "gigi_beracun": { nama: "Gigi Beracun" },
    "cakar_baja": { nama: "Cakar Baja Titanium" },
    "taring_naga": { nama: "Taring Naga Api" },
    "pedang_excalibur": { nama: "Pedang Excalibur" },
    "sabit_kematian": { nama: "Sabit Kematian" },
    // Armor
    "kalung_darah": { nama: "Kalung Darah" },
    "zirah_besi": { nama: "Zirah Besi" },
    "zirah_titanium": { nama: "Zirah Titanium" },
    "sisik_naga": { nama: "Sisik Naga Kebal" },
    "helm_spartan": { nama: "Helm Spartan" },
    "aura_dewa": { nama: "Aura Dewa Pelindung" }
};

module.exports = {
    name: 'mypet',
    description: 'Melihat daftar peliharaanmu beserta status dan perlengkapannya',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];
        
        // ✨ MENGAMBIL NAMA PROFIL WHATSAPP PEMAIN ✨
        const pushname = msg.pushName || 'Pemain';

        let punyaPeliharaan = false;
        
        // Menggunakan Pushname langsung, bukan tag nomor lagi
        let teksMyPet = `🐾 *KANDANG PELIHARAAN ${pushname.toUpperCase()}* 🐾\n\n`;
        let tagArray = []; // Array mention dikosongkan untuk menghindari error LID

        // 1. CEK PELIHARAAN UTAMA
        if (global.db.pet && global.db.pet[senderNumber] && global.db.pet[senderNumber].length > 0) {
            punyaPeliharaan = true;
            const peliharaanKu = global.db.pet[senderNumber];

            peliharaanKu.forEach((pet) => {
                const jamLalu = Math.floor((Date.now() - (pet.lastFeed || Date.now())) / (1000 * 60 * 60));
                let laparSekarang = Math.max(0, (pet.lapar || 100) - (jamLalu * 5));
                
                let namaSenjata = "Kosong (Tangan Kosong)";
                let namaArmor = "Kosong (Tanpa Zirah)";
                
                if (pet.gear) {
                    if (pet.gear.senjata && katalogGear[pet.gear.senjata]) {
                        namaSenjata = katalogGear[pet.gear.senjata].nama;
                    }
                    if (pet.gear.armor && katalogGear[pet.gear.armor]) {
                        namaArmor = katalogGear[pet.gear.armor].nama;
                    }
                }

                const targetXP = (pet.level || 1) * 100;
                const rarity = pet.rarity ? `[${pet.rarity}]` : '';

                teksMyPet += `========================\n`;
                teksMyPet += `🆔 *ID:* ${pet.id}\n`;
                teksMyPet += `📛 *Nama:* ${pet.nama}\n`;
                teksMyPet += `🧬 *Spesies:* ${pet.spesies} ${rarity}\n`;
                teksMyPet += `🍽️ *Diet:* ${pet.diet || 'Omnivora'}\n`;
                teksMyPet += `📊 *Level:* ${pet.level || 1} (XP: ${pet.xp || 0}/${targetXP})\n`;
                teksMyPet += `⚔️ *Power:* ${pet.power || 0}\n`;
                teksMyPet += `❤️ *Max HP:* ${pet.health || 100}\n`;
                teksMyPet += `🍗 *Tenaga:* ${laparSekarang}%\n`;
                teksMyPet += `🏥 *Kondisi:* ${pet.kondisi || 'Sehat'}\n`;
                teksMyPet += `🗡️ *Senjata:* ${namaSenjata}\n`;
                teksMyPet += `🛡️ *Armor:* ${namaArmor}\n`;
            });
        }

        // 2. CEK ANAK PELIHARAAN (HASIL KAWIN)
        if (global.db.petBersama && global.db.petBersama.length > 0) {
            const anakKu = global.db.petBersama.filter(p => p.ortu1 === senderNumber || p.ortu2 === senderNumber);
            
            if (anakKu.length > 0) {
                punyaPeliharaan = true;
                teksMyPet += `\n\n🍼 *PELIHARAAN BERSAMA (HASIL KAWIN)* 🍼\n\n`;
                
                anakKu.forEach((pet) => {
                    const jamLalu = Math.floor((Date.now() - (pet.lastFeed || Date.now())) / (1000 * 60 * 60));
                    let laparSekarang = Math.max(0, (pet.lapar || 100) - (jamLalu * 5));
                    
                    let namaSenjata = "Kosong";
                    let namaArmor = "Kosong";
                    
                    if (pet.gear) {
                        if (pet.gear.senjata && katalogGear[pet.gear.senjata]) namaSenjata = katalogGear[pet.gear.senjata].nama;
                        if (pet.gear.armor && katalogGear[pet.gear.armor]) namaArmor = katalogGear[pet.gear.armor].nama;
                    }

                    const targetXP = (pet.level || 1) * 100;

                    teksMyPet += `========================\n`;
                    teksMyPet += `🆔 *ID Bersama:* ${pet.id}\n`;
                    teksMyPet += `📛 *Nama:* ${pet.nama}\n`;
                    teksMyPet += `🧬 *Spesies:* ${pet.spesies}\n`;
                    // Hanya menampilkan nomor asli tanpa tag agar tidak kena bug LID
                    teksMyPet += `👨‍👩‍👦 *Ortu:* ${pet.ortu1} & ${pet.ortu2}\n`;
                    teksMyPet += `📊 *Level:* ${pet.level || 1} (XP: ${pet.xp || 0}/${targetXP})\n`;
                    teksMyPet += `⚔️ *Power:* ${pet.power || 0}\n`;
                    teksMyPet += `❤️ *Max HP:* ${pet.health || 100}\n`;
                    teksMyPet += `🍗 *Tenaga:* ${laparSekarang}%\n`;
                    teksMyPet += `🏥 *Kondisi:* ${pet.kondisi || 'Sehat'}\n`;
                    teksMyPet += `🗡️ *Senjata:* ${namaSenjata}\n`;
                    teksMyPet += `🛡️ *Armor:* ${namaArmor}\n`;
                });
            }
        }

        if (!punyaPeliharaan) {
            return await sock.sendMessage(chatId, { text: `🐾 Hai *${pushname}*, kamu belum memiliki peliharaan sama sekali. Kunjungi \`!tokohewan\` untuk mengadopsi!` }, { quoted: msg });
        }

        teksMyPet += `========================\n`;
        teksMyPet += `_💡 Ketik !feed [ID] [makanan] untuk memberi makan._`;

        // Mengirimkan pesan tanpa mention paksa
        await sock.sendMessage(chatId, { text: teksMyPet, mentions: tagArray }, { quoted: msg });
    }
};