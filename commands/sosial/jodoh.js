/**
 * COMMAND: !jodoh [@tagA] | [@tagB]
 * Cek persentase kecocokan antara dua orang (random fun).
 * 
 * !ganteng → Cek persentase kegantengan (random fun)
 * !cantik  → Cek persentase kecantikan (random fun)
 * 
 * Tidak memerlukan library tambahan (pure JavaScript random).
 * 
 * Contoh:
 *   !jodoh @Budi | @Siti
 *   !ganteng @Budi
 *   !cantik @Siti
 */

// Bar progress untuk visualisasi persentase
function buatProgressBar(persen) {
    const total = 10;
    const isi = Math.round((persen / 100) * total);
    return '█'.repeat(isi) + '░'.repeat(total - isi);
}

// Komentar berdasarkan range persentase
function komentarJodoh(persen) {
    if (persen >= 90) return '💍 Segera menikah! Jodoh sudah di depan mata!';
    if (persen >= 75) return '💕 Cocok banget! Tinggal selangkah lagi!';
    if (persen >= 60) return '😊 Lumayan cocok, perlu lebih banyak usaha!';
    if (persen >= 40) return '🤔 Bisa saja, tapi butuh banyak perjuangan.';
    if (persen >= 20) return '😬 Hmm... kayaknya perlu berpikir ulang deh.';
    return '💔 Kayaknya kurang cocok nih... cari yang lain!';
}

function komentarGanteng(persen) {
    if (persen >= 95) return '😎 Gantengnya kebangetan! Model profesional!';
    if (persen >= 80) return '🔥 Wah, ganteng banget! Banyak yang naksir!';
    if (persen >= 65) return '😊 Lumayan ganteng, tampan di mata yang tepat!';
    if (persen >= 45) return '🙂 Standar, tapi ada daya tarik tersendiri!';
    if (persen >= 25) return '😅 Hmm... kepribadian lebih penting dari wajah!';
    return '😂 Wkwk... inner beauty yang lebih kamu andalkan!';
}

function komentarCantik(persen) {
    if (persen >= 95) return '👸 MasyaAllah! Cantiknya melebihi bidadari!';
    if (persen >= 80) return '✨ Cantik banget! Senyummu menerangi hari!';
    if (persen >= 65) return '🌸 Cantik dan menawan, bikin orang betah!';
    if (persen >= 45) return '🌷 Cantik dengan caramu sendiri yang unik!';
    if (persen >= 25) return '😅 Kecantikan sejati ada di dalam hati!';
    return '😂 Haha! Tapi inner beauty kamu pasti bersinar!';
}

module.exports = [
    // ─── COMMAND !jodoh ───
    {
        name: 'jodoh',
        description: 'Cek persentase kecocokan dua orang. Format: !jodoh @A | @B',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const daftarMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (daftarMention.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ *Cara Pakai:*\n`!jodoh @orangA | @orangB`\n\nTag dua orang untuk dicek kecocokannya!'
                }, { quoted: msg });
            }

            const jidA = daftarMention[0];
            const jidB = daftarMention[1];
            const nomorA = jidA.replace(/:\d+/, '').split('@')[0];
            const nomorB = jidB.replace(/:\d+/, '').split('@')[0];

            // Persentase random (seed berdasarkan kombinasi nomor agar konsisten per pasangan)
            // Menggunakan hash sederhana agar nilai selalu sama untuk pasangan yang sama
            const seed = (nomorA + nomorB).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const persen = (seed * 7 + 13) % 101; // 0 - 100

            const progressBar = buatProgressBar(persen);
            const komentar = komentarJodoh(persen);

            await sock.sendMessage(chatId, {
                text: `💑 *LOVE METER* 💑\n─────────────────────\n\n@${nomorA} 💕 @${nomorB}\n\n${progressBar} *${persen}%*\n\n_${komentar}_`,
                mentions: [jidA, jidB]
            });
        }
    },

    // ─── COMMAND !ganteng ───
    {
        name: 'ganteng',
        description: 'Cek persentase kegantengan. Format: !ganteng @orang',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const daftarMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // Jika tidak ada mention, cek si pengirim sendiri
            const targetJid = daftarMention[0] || senderJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101); // 0 - 100 (fully random)
            const progressBar = buatProgressBar(persen);
            const komentar = komentarGanteng(persen);

            await sock.sendMessage(chatId, {
                text: `😎 *GANTENG METER* 😎\n─────────────────────\n\n@${targetNumber}\n\n${progressBar} *${persen}%*\n\n_${komentar}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !cantik ───
    {
        name: 'cantik',
        description: 'Cek persentase kecantikan. Format: !cantik @orang',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const daftarMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            const targetJid = daftarMention[0] || senderJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            const progressBar = buatProgressBar(persen);
            const komentar = komentarCantik(persen);

            await sock.sendMessage(chatId, {
                text: `✨ *CANTIK METER* ✨\n─────────────────────\n\n@${targetNumber}\n\n${progressBar} *${persen}%*\n\n_${komentar}_`,
                mentions: [targetJid]
            });
        }
    }
];
