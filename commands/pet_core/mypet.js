const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'mypet',
    description: 'Melihat semua peliharaan di kandang (Pribadi & Bersama)',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];
        const pushName = msg.pushName || 'Player';

        // --- 🛡️ PENGAMAN DATABASE 🛡️ ---
        if (!global.db.pet) global.db.pet = {};
        if (!global.db.petBersama) global.db.petBersama = [];

        let kandang = global.db.pet[senderNumber] || [];
        let teksPet = `🏰 *KANDANG MILIK ${pushName.toUpperCase()}* 🏰\n\n`;

        // --- 1. TAMPILKAN KANDANG PRIBADI ---
        if (kandang.length === 0) {
            teksPet += `_Kandang utamamu kosong. Ketik !tokohewan untuk membelinya._\n\n`;
        } else {
            kandang.forEach((dataPet) => {
                const jamLalu = Math.floor((Date.now() - dataPet.lastFeed) / (1000 * 60 * 60));
                let laparSekarang = Math.max(0, dataPet.lapar - (jamLalu * 5));
                const statusLapar = laparSekarang <= 20 ? '⚠️ KELAPARAN' : '✅ Kenyang';
                const iconKondisi = dataPet.kondisi === 'Sehat' ? '💚' : '💔';

                // Deteksi Gear
                let namaSenjata = "Tangan Kosong";
                let namaArmor = "Tanpa Zirah";
                
                if (dataPet.gear) {
                    if (dataPet.gear.senjata === 'cakar_besi') namaSenjata = "Cakar Besi";
                    if (dataPet.gear.senjata === 'taring_naga') namaSenjata = "Taring Naga";
                    if (dataPet.gear.armor === 'kalung_darah') namaArmor = "Kalung Darah";
                    if (dataPet.gear.armor === 'zirah_titanium') namaArmor = "Zirah Titanium";
                }

                teksPet += `*ID [${dataPet.id}]* - ✨ *${dataPet.nama}*\n`;
                teksPet += `🐾 ${dataPet.spesies} (${dataPet.rarity}) | 🆙 Lv.${dataPet.level}\n`;
                teksPet += `🗡️ Senjata: ${namaSenjata}\n`;
                teksPet += `🛡️ Armor: ${namaArmor}\n`;
                teksPet += `🥩 Diet: ${dataPet.diet.toUpperCase()}\n`;
                teksPet += `🍖 Lapar: ${laparSekarang}% ${statusLapar}\n`;
                teksPet += `🏥 Kondisi: ${iconKondisi} ${dataPet.kondisi}\n`;
                teksPet += `━━━━━━━━━━━━━━━━━━━━\n`;
            });
        }

        // --- 2. TAMPILKAN HEWAN BERSAMA (COUPLE) ---
        const petAnak = global.db.petBersama.filter(p => p.ortu1 === senderNumber || p.ortu2 === senderNumber);
        
        if (petAnak.length > 0) {
            teksPet += `\n💞 *HEWAN MILIK BERSAMA (COUPLE)* 💞\n\n`;
            
            petAnak.forEach((anak) => {
                const pasanganNumber = anak.ortu1 === senderNumber ? anak.ortu2 : anak.ortu1;
                const jamLalu = Math.floor((Date.now() - anak.lastFeed) / (1000 * 60 * 60));
                let laparSekarang = Math.max(0, anak.lapar - (jamLalu * 5));
                const iconKondisi = anak.kondisi === 'Sehat' ? '💚' : '💔';
                
                // Deteksi Gear untuk Pet Bersama
                let namaSenjata = "Tangan Kosong";
                let namaArmor = "Tanpa Zirah";
                
                if (anak.gear) {
                    if (anak.gear.senjata === 'cakar_besi') namaSenjata = "Cakar Besi";
                    if (anak.gear.senjata === 'taring_naga') namaSenjata = "Taring Naga";
                    if (anak.gear.armor === 'kalung_darah') namaArmor = "Kalung Darah";
                    if (anak.gear.armor === 'zirah_titanium') namaArmor = "Zirah Titanium";
                }

                teksPet += `*ID [${anak.id}]* - ✨ *${anak.nama}*\n`;
                teksPet += `👥 Bersama: @${pasanganNumber}\n`;
                teksPet += `🐾 ${anak.spesies} | 🆙 Lv.${anak.level}\n`;
                teksPet += `🗡️ Senjata: ${namaSenjata}\n`;
                teksPet += `🛡️ Armor: ${namaArmor}\n`;
                teksPet += `🥩 Diet: ${anak.diet.toUpperCase()}\n`;
                teksPet += `🍖 Lapar: ${laparSekarang}%\n`;
                teksPet += `🏥 Kondisi: ${iconKondisi} ${anak.kondisi}\n`;
                teksPet += `━━━━━━━━━━━━━━━━━━━━\n`;
            });
        }

        teksPet += `💡 _Tip: Ketik !feed [ID Pet] [nama makanan] untuk memberi makan._`;

        // Rakit daftar tag/mention untuk pasangan agar warnanya biru
        const daftarMention = petAnak.map(p => (p.ortu1 === senderNumber ? p.ortu2 : p.ortu1) + '@s.whatsapp.net');

        await sock.sendMessage(chatId, { text: teksPet, mentions: daftarMention }, { quoted: msg });
    }
};