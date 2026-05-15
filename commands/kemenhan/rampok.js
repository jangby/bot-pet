const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'rampok',
    description: 'Mencoba merampok uang pemain lain (Risiko Penjara!)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Cek Status Penjara Si Perampok
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        const player = global.db.player[senderNumber];

        if (player.penjara && Date.now() < player.penjara) {
            const sisaMenit = Math.ceil((player.penjara - Date.now()) / 60000);
            return await sock.sendMessage(chatId, { text: `🚔 *KAMU MASIH DI PENJARA!*\n\nKamu sedang menjalani hukuman kurungan karena ketahuan merampok. Tunggu *${sisaMenit} menit* lagi sebelum kamu bebas.` }, { quoted: msg });
        }

        // 2. Cek Cooldown Rampok (Biar gak spam)
        const waktuTerakhir = player.lastRampok || 0;
        const cooldownSelesai = waktuTerakhir + (30 * 60 * 1000); // Cooldown 30 Menit

        if (Date.now() < cooldownSelesai) {
            const sisaMenit = Math.ceil((cooldownSelesai - Date.now()) / 60000);
            return await sock.sendMessage(chatId, { text: `🕵️‍♂️ *TETAP MERUNDUK!*\n\nPolisi masih berpatroli di sekitarmu setelah aksi terakhirmu. Bersembunyilah selama *${sisaMenit} menit* lagi sebelum beraksi.` }, { quoted: msg });
        }

        // 3. Validasi Target
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nKetik: `!rampok @tag_target`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];

        if (senderNumber === targetNumber) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masa kamu mau merampok dompetmu sendiri?' }, { quoted: msg });
        }

        if (!global.db.player[targetNumber] || (global.db.player[targetNumber].saldo || 0) < 1000) {
            return await sock.sendMessage(chatId, { text: '📉 *KASIAN!*\n\nTargetmu terlalu miskin (Saldo di bawah 1.000 Nexus). Carilah mangsa yang lebih kaya!' }, { quoted: msg });
        }

        // --- GANTI DENGAN NOMOR PRESIDEN ANDA ---
        const nomorPresiden = "6285188427706"; 
        if (targetNumber === nomorPresiden) {
            return await sock.sendMessage(chatId, { text: '☠️ *MENCARI MATI?*\n\nKamu mencoba merampok Presiden Republik Nexus! Pasukan Paspampres langsung menembakmu di tempat.' }, { quoted: msg });
        }

        const targetPlayer = global.db.player[targetNumber];
        player.lastRampok = Date.now(); // Set cooldown

        // --- SISTEM GACHA PERAMPOKAN ---
        const peluangBerhasil = Math.random() * 100;
        let teksHasil = '';
        let arrayMention = [senderId, targetId];

        if (peluangBerhasil <= 40) {
            // BERHASIL (40% Peluang)
            // Curi 10% - 25% uang korban
            const persentaseCuri = (Math.floor(Math.random() * 15) + 10) / 100;
            const hasilRampokan = Math.floor(targetPlayer.saldo * persentaseCuri);

            targetPlayer.saldo -= hasilRampokan;
            player.saldo += hasilRampokan;

            teksHasil = `🥷 *PERAMPOKAN SUKSES!* 🥷\n\nKamu berhasil menyelinap dan mencuri dompet @${targetNumber}!\n\n💰 Hasil Rampokan: *${hasilRampokan.toLocaleString('id-ID')} Nexus*\n\n_Segera kabur sebelum polisi datang!_`;
        } else {
            // GAGAL & TERTANGKAP (60% Peluang)
            // Denda 20% uang sendiri, reputasi turun 5, masuk penjara 15 Menit
            const denda = Math.floor((player.saldo || 0) * 0.2);
            
            player.saldo = Math.max(0, player.saldo - denda);
            global.db.bank.brankas = (global.db.bank.brankas || 0) + denda; // Denda masuk kas negara
            
            player.reputasi = (player.reputasi || 0) - 5;
            player.penjara = Date.now() + (15 * 60 * 1000); // 15 Menit penjara

            // Jika statusnya PNS, dipecat!
            let teksPecat = '';
            if (player.pekerjaan === 'PNS') {
                player.pekerjaan = 'Buruh Lepas';
                teksPecat = `\n🎖️ *SKANDAL!* Karena kamu seorang abdi negara yang tertangkap merampok, kamu resmi *DIPECAT* dari jabatan PNS!`;
            }

            teksHasil = `🚨 *TERTANGKAP POLISI!* 🚨\n\nKorbanmu @${targetNumber} berteriak, dan patroli polisi langsung menangkapmu!\n\n⚖️ *VONIS HUKUMAN:*\n💸 Denda: -${denda.toLocaleString('id-ID')} Nexus (Disita Negara)\n⭐ Reputasi: -5 Poin\n🚔 Kurungan: 15 Menit${teksPecat}`;
        }

        // Simpan Data
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        await sock.sendMessage(chatId, { text: teksHasil, mentions: arrayMention }, { quoted: msg });
    }
};
