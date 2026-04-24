const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'serangboss',
    description: 'Mengirim pet untuk menyerang Boss Raid',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.boss || !global.db.boss.aktif) {
            return await sock.sendMessage(chatId, { text: `⚠️ Simpan senjatamu. Tidak ada Boss yang sedang menyerang saat ini.` }, { quoted: msg });
        }

        const petList = global.db.pet[senderNumber] || [];
        if (petList.length === 0) {
            return await sock.sendMessage(chatId, { text: `⚠️ Kamu tidak punya peliharaan untuk dikirim menyerang Boss! Adopsi pet terlebih dahulu.` }, { quoted: msg });
        }

        // Otomatis memilih pet terkuat pemain (level tertinggi) untuk menyerang bos
        const petAndalan = petList.reduce((prev, current) => (prev.level > current.level) ? prev : current);

        // --- SISTEM COOLDOWN (3 Menit) ---
        const lastAttack = global.db.boss.cooldown[senderNumber] || 0;
        const cooldownTime = 3 * 60 * 1000; // 3 menit dalam milidetik
        
        if (Date.now() - lastAttack < cooldownTime) {
            const sisaDetik = Math.ceil((cooldownTime - (Date.now() - lastAttack)) / 1000);
            return await sock.sendMessage(chatId, { text: `⏳ *${petAndalan.nama}* sedang memulihkan stamina!\nTunggu *${sisaDetik} detik* lagi untuk melancarkan serangan kembali.` }, { quoted: msg });
        }

        // --- KALKULASI DAMAGE ---
        // Base damage = Acak(50~150) + (Level * 30) + Bonus Spesies + BONUS SENJATA
        let bonusSpesies = 0;
        if (["Singa 🦁", "Beruang Es 🐻‍❄️"].includes(petAndalan.spesies)) bonusSpesies = 200;
        if (["Unicorn 🦄", "Phoenix 🦅", "Naga 🐲"].includes(petAndalan.spesies)) bonusSpesies = 500;

        let bonusSenjata = 0;
        let namaSenjata = "";
        if (petAndalan.gear && petAndalan.gear.senjata) {
            // Jika dia pakai Cakar Besi (+50) atau Taring Naga (+200)
            if (petAndalan.gear.senjata === 'cakar_besi') { bonusSenjata = 50; namaSenjata = " [Cakar Besi]"; }
            if (petAndalan.gear.senjata === 'taring_naga') { bonusSenjata = 200; namaSenjata = " [Taring Naga]"; }
        }

        const baseRNG = Math.floor(Math.random() * 100) + 50;
        const damage = baseRNG + (petAndalan.level * 30) + bonusSpesies + bonusSenjata;
        
        // Kurangi HP Boss & Set Cooldown
        global.db.boss.hp -= damage;
        global.db.boss.cooldown[senderNumber] = Date.now();

        // Catat damage ke database peserta
        if (!global.db.boss.peserta[senderNumber]) {
            global.db.boss.peserta[senderNumber] = { damage: 0 };
        }
        global.db.boss.peserta[senderNumber].damage += damage;

        // --- JIKA BOSS MATI PADA SERANGAN INI ---
        if (global.db.boss.hp <= 0) {
            global.db.boss.hp = 0;
            global.db.boss.aktif = false; // Nonaktifkan boss

            let teksKemenangan = `🎉 *BOSS DEFEATED!* 🎉\n\n*${global.db.boss.nama}* telah berhasil ditumbangkan oleh pukulan terakhir dari *${petAndalan.nama}* milik @${senderNumber}!\n\n🎁 *REWARD PARTISIPASI:*\n`;

            // --- DISTRIBUSI REWARD ---
            // Total Pool Hadiah = 15% dari Max HP boss (Misal: 150k HP -> 22.500 Nexus Pool)
            const totalRewardPool = Math.floor(global.db.boss.maxHp * 0.15); 

            const daftarMentions = [];

            for (const [nomorPemain, dataPeserta] of Object.entries(global.db.boss.peserta)) {
                // Dibagikan proporsional sesuai rasio damage yang diberikan
                const porsiDamage = dataPeserta.damage / global.db.boss.maxHp;
                let uangDidapat = Math.floor(totalRewardPool * porsiDamage);
                
                // Bonus UMR: Minimal dapet 1000 Nexus kalau ikut mukul
                uangDidapat += 1000; 

                if (!global.db.player[nomorPemain]) global.db.player[nomorPemain] = { saldo: 0, reputasi: 0 };
                
                // Tambah Uang & Tambah 2 Bintang Reputasi (Penting untuk Limit Pinjam Bank!)
                global.db.player[nomorPemain].saldo = (parseInt(global.db.player[nomorPemain].saldo) || 0) + uangDidapat;
                global.db.player[nomorPemain].reputasi = (global.db.player[nomorPemain].reputasi || 0) + 2; 

                teksKemenangan += `• @${nomorPemain}: *+${uangDidapat.toLocaleString('id-ID')} 💠* & +2 ⭐\n`;
                daftarMentions.push(`${nomorPemain}@s.whatsapp.net`);
            }

            // Simpan perubahan dan kosongkan data boss
            global.db.boss.peserta = {}; 
            global.db.boss.cooldown = {};
            
            fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
            fs.writeFileSync(path.join(process.cwd(), 'data/boss.json'), JSON.stringify(global.db.boss, null, 2));

            return await sock.sendMessage(chatId, { text: teksKemenangan, mentions: daftarMentions }, { quoted: msg });
        }

        // Jika boss belum mati, cukup simpan statenya
        fs.writeFileSync(path.join(process.cwd(), 'data/boss.json'), JSON.stringify(global.db.boss, null, 2));

        await sock.sendMessage(chatId, { text: `⚔️ *SERANGAN BERHASIL!*\n\n*${petAndalan.nama}* (${petAndalan.spesies} Lv.${petAndalan.level}) melancarkan serangan brutal!\n💥 Damage: *${damage.toLocaleString('id-ID')}*\n\n🩸 HP Boss Tersisa: *${global.db.boss.hp.toLocaleString('id-ID')}*` }, { quoted: msg });
    }
};