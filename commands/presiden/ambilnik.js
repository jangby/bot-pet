const fs = require('fs');
const path = require('path');
const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'ambilnik',
    description: 'Memulai sesi pengumpulan NIK anggota grup (Khusus Presiden)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Validasi Grup
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!' }, { quoted: msg });
        }

        // 2. Validasi Presiden
        if (!isPresiden(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Presiden Republik Nexus!' }, { quoted: msg });
        }

        try {
            const metadataGrup = await sock.groupMetadata(chatId);
            
            // Resolve JID anggota (mengatasi Linked ID / LID WhatsApp)
            const anggotaResolved = metadataGrup.participants.map(p => {
                let realJid = p.id;
                if (p.id.endsWith('@lid')) {
                    const match = metadataGrup.participants.find(q =>
                        q.id && q.id.endsWith('@s.whatsapp.net') && q.lid && q.lid === p.id
                    );
                    if (match) realJid = match.id;
                }
                return realJid;
            });

            // Cari JID bot sendiri agar tidak dikirimi PM
            const botJid = sock.user && sock.user.id ? (sock.user.id.replace(/:.*/, '') + '@s.whatsapp.net') : '';
            
            // Cek apakah sesi pengumpulan NIK sudah aktif sebelumnya
            const isSessionActive = global.db.nik && global.db.nik.session && global.db.nik.session.active;
            
            if (isSessionActive) {
                // Sesi aktif di grup lain, tambahkan nama grup baru ke session jika belum ada
                const oldGroupName = global.db.nik.session.groupName || "";
                if (!oldGroupName.includes(metadataGrup.subject)) {
                    global.db.nik.session.groupName = oldGroupName ? `${oldGroupName}, ${metadataGrup.subject}` : metadataGrup.subject;
                }
            } else {
                // Mulai sesi baru
                global.db.nik.session = {
                    active: true,
                    groupId: chatId,
                    groupName: metadataGrup.subject,
                    startedAt: Date.now(),
                    lastReminderAt: Date.now()
                };
                global.db.nik.pending = [];
            }

            // Cari JID anggota yang baru (belum terdaftar NIK-nya dan belum ada di antrean pending)
            const newPendingJids = [];
            for (const jid of anggotaResolved) {
                if (!jid || jid === botJid) continue;
                const parsedNum = jid.split('@')[0];

                const sudahTerdaftar = global.db.nik.records && global.db.nik.records[parsedNum];
                const sudahPending = global.db.nik.pending.includes(jid);

                if (!sudahTerdaftar && !sudahPending) {
                    newPendingJids.push(jid);
                    global.db.nik.pending.push(jid);
                }
            }

            // Simpan database
            fs.writeFileSync(path.join(process.cwd(), 'data/nik.json'), JSON.stringify(global.db.nik, null, 2));

            if (newPendingJids.length === 0) {
                return await sock.sendMessage(chatId, { 
                    text: `✅ *INFORMASI PENGUMPULAN NIK*\n\nSesi pengumpulan NIK sedang aktif.\n\nSemua anggota di grup *${metadataGrup.subject}* saat ini sudah menyerahkan NIK atau sudah berada dalam daftar antrean PM sebelumnya.` 
                }, { quoted: msg });
            }

            // Kirim pesan sukses di grup terlebih dahulu
            await sock.sendMessage(chatId, { 
                text: `🏛️ *SESI PENGUMPULAN NIK DIMULAI* 🏛️\n\nPresiden/Wapres telah mengaktifkan pengambilan NIK untuk grup *${metadataGrup.subject}*.\n\nBot mengirimkan instruksi via PM ke *${newPendingJids.length}* anggota baru.\nMohon segera periksa chat pribadi Anda dengan bot!` 
            }, { quoted: msg });

            // Kirim PM ke masing-masing anggota baru secara asinkron dengan sedikit jeda
            for (const userJid of newPendingJids) {
                try {
                    const templateTeks = `🔔 *PENGUMPULAN NIK REPUBLIK NEXUS* 🔔\n\nHalo! Presiden/Wapres meminta pengumpulan NIK untuk anggota grup *${metadataGrup.subject}* guna melengkapi *data MBG Santri*.\n\nSilakan kirim NIK Anda dengan format:\n*!nik |Nama Lengkap Sesuai KK| Nomor NIK*\n\nContoh:\n*!nik |Budi Santoso| 1234567890123456*\n\n_Pesan pengingat akan terus dikirim setiap 1 jam jika Anda belum menginputkan NIK._`;
                    await sock.sendMessage(userJid, { text: templateTeks });
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Jeda 1.5 detik per PM agar aman dari ban
                } catch (err) {
                    console.error(`[AMBILNIK PM ERROR] Gagal mengirim PM ke ${userJid}:`, err);
                }
            }

        } catch (error) {
            console.error('[ERROR] !ambilnik:', error);
            await sock.sendMessage(chatId, { text: '❌ Gagal memulai sesi ambil NIK. Pastikan bot adalah Admin Grup!' }, { quoted: msg });
        }
    }
};
