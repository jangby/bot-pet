const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bansos',
    description: 'Program Bantuan Sosial dari Presiden (Admin Only)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        let senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // --- SISTEM PENDETEKSI LID ---
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => 
                    (p.id && p.id.includes(senderNumber)) || 
                    (p.lid && p.lid.includes(senderNumber))
                );
                
                if (participant) {
                    senderNumber = participant.id.split('@')[0]; 
                }
            } catch (err) {
                console.log("Gagal mengambil metadata grup untuk verifikasi KTP Presiden.");
            }
        }

        // --- IDENTITAS GANDA PRESIDEN (SOLUSI LID WHATSAPP) ---
        const daftarPresiden = ["6285188427706", "168032676651233"];

        if (!daftarPresiden.includes(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '🚨 *Akses Ditolak!* Hanya Presiden Republik Nexus yang berhak mengeluarkan anggaran Bansos.' }, { quoted: msg });
        }

        const uangDiBank = global.db.bank.brankas || 0;
        
        // Syarat Bansos: Kas negara harus minimal 200.000 Nexus
        if (uangDiBank < 200000) {
            return await sock.sendMessage(chatId, { text: `🏛️ *Kas Negara Belum Cukup!*\nBansos hanya bisa dibagikan jika Kas Bank Sentral minimal 200.000 Nexus.\nKas saat ini: ${uangDiBank.toLocaleString('id-ID')} Nexus.` }, { quoted: msg });
        }

        // Cari warga yang saldonya di bawah 3.000 Nexus (Rakyat Miskin)
        let penerimaBansos = [];
        for (const nomorPemain in global.db.player) {
            if (global.db.player[nomorPemain].saldo < 3000) {
                penerimaBansos.push(nomorPemain);
            }
        }

        if (penerimaBansos.length === 0) {
            return await sock.sendMessage(chatId, { text: '📈 *Ekonomi Makmur!* Saat ini tidak ada warga miskin (saldo di bawah 3.000 Nexus) yang membutuhkan Bansos.' }, { quoted: msg });
        }

        const nominalBansos = 10000;
        const totalAnggaran = nominalBansos * penerimaBansos.length;

        if (uangDiBank < totalAnggaran) {
            return await sock.sendMessage(chatId, { text: `🏛️ *Anggaran Defisit!* Butuh ${totalAnggaran.toLocaleString('id-ID')} Nexus untuk ${penerimaBansos.length} warga, tapi kas tidak cukup.` }, { quoted: msg });
        }

        // Eksekusi Pembagian Bansos
        global.db.bank.brankas -= totalAnggaran;
        let daftarPenerimaTeks = '';
        let tagWarga = [];

        penerimaBansos.forEach(nomor => {
            global.db.player[nomor].saldo += nominalBansos;
            
            // 1. Ambil nama dari database agar jelas siapa penerimanya
            const namaPemain = global.db.player[nomor].nama || "Warga Belum Daftar";
            
            // 2. Tampilkan Nama dan Nomornya di dalam teks
            daftarPenerimaTeks += `🔸 *${namaPemain}* (@${nomor})\n`;
            
            // 3. Perbaikan Format Tag (LID vs Nomor WA Biasa)
            // Jika digit lebih dari 14, kemungkinan besar itu adalah LID
            if (nomor.length > 14) {
                tagWarga.push(`${nomor}@lid`);
            } else {
                tagWarga.push(`${nomor}@s.whatsapp.net`);
            }
        });

        // Simpan Database
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        const teksPengumuman = `💌 *PENGUMUMAN BANTUAN SOSIAL (BANSOS)* 💌\n\nPresiden telah menyetujui pencairan dana Bantuan Sosial dari Kas Negara!\n\nSetiap warga yang sedang kesulitan finansial masing-masing menerima suntikan dana sebesar *${nominalBansos.toLocaleString('id-ID')} Nexus*.\n\n*Daftar Penerima Bansos:*\n${daftarPenerimaTeks}\n_Gunakan uang ini untuk membeli perlengkapan pet atau modal usaha!_`;

        await sock.sendMessage(chatId, { text: teksPengumuman, mentions: tagWarga }, { quoted: msg });
    }
};
