const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'boss',
    description: 'Melihat info Boss Raid atau memunculkan boss baru',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Inisialisasi database boss jika belum ada
        if (!global.db.boss) global.db.boss = { aktif: false };

        // --- COMMAND: !boss spawn ---
        if (args[0] === 'spawn') {
            if (global.db.boss.aktif) {
                return await sock.sendMessage(chatId, { text: '⚠️ Boss masih hidup dan sedang meneror grup!' }, { quoted: msg });
            }

            global.db.boss = {
                aktif: true,
                nama: "🐲 Leviathan Korupsi (Raja Iblis)",
                hp: 150000,
                maxHp: 150000,
                peserta: {},
                cooldown: {},
                waktuMulai: Date.now()
            };
            
            fs.writeFileSync(path.join(process.cwd(), 'data/boss.json'), JSON.stringify(global.db.boss, null, 2));
            
            const teksSpawn = 
`🚨 *WARNING! BOSS RAID MUNCUL!* 🚨

Mahluk legendaris *${global.db.boss.nama}* telah turun ke dunia dan mengancam grup ini!
🩸 HP: *${global.db.boss.hp.toLocaleString('id-ID')} / ${global.db.boss.maxHp.toLocaleString('id-ID')}*

Semua pemilik pet diharap bersatu! 
Ketik \`!serangboss\` untuk menyumbang damage! Hancurkan sebelum dia merusak ekonomi kita!`;

            return await sock.sendMessage(chatId, { text: teksSpawn }, { quoted: msg });
        }

        // --- COMMAND: !boss (Melihat Info) ---
        if (!global.db.boss.aktif) {
            return await sock.sendMessage(chatId, { text: `✅ Saat ini grup dalam keadaan damai. Tidak ada Boss yang menyerang.` }, { quoted: msg });
        }

        const b = global.db.boss;
        let teksInfo = `👹 *INFO BOSS RAID* 👹\n\n`;
        teksInfo += `• Nama: *${b.nama}*\n`;
        teksInfo += `• HP Tersisa: *${b.hp.toLocaleString('id-ID')} / ${b.maxHp.toLocaleString('id-ID')}* ❤️\n\n`;
        teksInfo += `🏆 *TOP 5 ATTACKER SEMENTARA:*\n`;
        
        // Urutkan peserta berdasarkan damage tertinggi
        const daftarPeserta = Object.entries(b.peserta).sort((a, b) => b[1].damage - a[1].damage).slice(0, 5);
        
        if (daftarPeserta.length === 0) {
            teksInfo += `_Belum ada pemain yang berani menyerang!_\n`;
        } else {
            daftarPeserta.forEach(([nomor, data], index) => {
                teksInfo += `${index + 1}. @${nomor} - ${data.damage.toLocaleString('id-ID')} DMG ⚔️\n`;
            });
        }

        teksInfo += `\nKetik \`!serangboss\` untuk ikut berpartisipasi!`;

        // Resolve LID ke nomor asli untuk tampilan dan mention
        let groupParticipants = [];
        if (chatId.endsWith('@g.us')) {
            try {
                const metaGrup = await sock.groupMetadata(chatId);
                groupParticipants = metaGrup.participants;
            } catch(e) {}
        }

        const resolveJid = (nomor) => {
            if (groupParticipants.length > 0) {
                const part = groupParticipants.find(p =>
                    (p.id && p.id.includes(nomor)) || (p.lid && p.lid.includes(nomor))
                );
                if (part && part.id.endsWith('@s.whatsapp.net')) return { jid: part.id, num: part.id.split('@')[0] };
            }
            return { jid: `${nomor}@s.whatsapp.net`, num: nomor };
        };

        // Ganti teks @nomor dengan nomor yang sudah di-resolve
        daftarPeserta.forEach(([nomor]) => {
            const r = resolveJid(nomor);
            teksInfo = teksInfo.replace(`@${nomor}`, `@${r.num}`);
        });

        const mentions = daftarPeserta.map(p => resolveJid(p[0]).jid);
        await sock.sendMessage(chatId, { text: teksInfo, mentions: mentions }, { quoted: msg });
    }
};
