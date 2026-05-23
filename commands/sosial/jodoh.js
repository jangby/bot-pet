/**
 * COMMAND: !jodoh [@tagA] | [@tagB]
 * Cek persentase kecocokan antara dua orang (random fun).
 * 
 * COMMAND FUN LAINNYA:
 * !ganteng → Cek persentase kegantengan
 * !cantik  → Cek persentase kecantikan
 * !imut    → Cek persentase keimutan
 * !buaya   → Cek persentase buaya darat
 * !wibu    → Cek persentase wibu
 * !stres   → Cek persentase tingkat stres
 * !sexy    → Cek aura keseksian
 * !hot     → Cek tingkat hot/pesona membara
 * !bucin   → Cek tingkat kebucinan
 * !jomblo  → Cek nasib/kadar kejombloan
 * 
 * Tidak memerlukan library tambahan (pure JavaScript random).
 */

// Bar progress untuk visualisasi persentase
function buatProgressBar(persen) {
    const total = 10;
    const isi = Math.round((persen / 100) * total);
    return '█'.repeat(isi) + '░'.repeat(total - isi);
}

// === KUMPULAN KOMENTAR === //

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

function komentarImut(persen) {
    if (persen >= 95) return '🥺 Aaaa gemes banget! Pengen karungin bawa pulang!';
    if (persen >= 80) return '🥰 Imutnya kelewatan! Pipi rasanya pengen dicubit!';
    if (persen >= 65) return '😽 Lumayan imut, bikin senyum-senyum sendiri melihatnya!';
    if (persen >= 45) return '😸 Manis lah, kayak teh hangat di pagi hari.';
    if (persen >= 25) return '🙃 Biasa aja sih, tapi kadang ada lucunya juga.';
    return '🗿 Imut dari mananya? Muka datar amat kayak tembok!';
}

function komentarBuaya(persen) {
    if (persen >= 95) return '🐊 RAJA BUAYA! Hati-hati semuanya, pawangnya datang!';
    if (persen >= 80) return '🦎 Bakat buayanya kelihatan banget nih. Suka gombal ya?';
    if (persen >= 65) return '😏 Diem-diem menghanyutkan, suka tebar pesona diam-diam.';
    if (persen >= 45) return '😌 Masih buaya darat level junior, butuh jam terbang.';
    if (persen >= 25) return '😇 Lumayan polos, masih setia pada satu hati (katanya).';
    return '👼 Sangat setia dan bucin akut! Bebas dari radar buaya!';
}

function komentarWibu(persen) {
    if (persen >= 95) return '🎌 OMAE WA MOU SHINDEIRU! Sepuh anime telah tiba!';
    if (persen >= 80) return '⛩️ Bau bawangnya kecium sampai sini bang...';
    if (persen >= 65) return '📺 Pasti suka maraton anime tiap weekend ya?';
    if (persen >= 45) return '🍿 Nontonnya cuma yang lagi viral-viral aja sih.';
    if (persen >= 25) return '🤔 Pernah dengar anime, tapi nggak terlalu ngikutin.';
    return '🚶 Normal alias wibu apaan tuh? Gak kenal sama sekali.';
}

function komentarStres(persen) {
    if (persen >= 95) return '🤯 STRES BERAT! Butuh healing atau liburan sebulan penuh!';
    if (persen >= 80) return '😵 Kepalanya udah ngebul, deadline numpuk ya?';
    if (persen >= 65) return '🥴 Agak pusing mikirin hidup, ayo tarik napas dulu!';
    if (persen >= 45) return '😬 Masih bisa senyum walau hati menjerit perlahan.';
    if (persen >= 25) return '😌 Santai banget, hidup mengalir seperti air sungai.';
    return '🧘‍♀️ Terlalu chill! Gak ada beban hidup sama sekali nih orang!';
}

// Tambahan Baru
function komentarSexy(persen) {
    if (persen >= 95) return '💃 DAMAGE PARAH! Pesonamu bikin iman goyah!';
    if (persen >= 80) return '💋 Sexy abis! Aura memikatnya terpancar kuat!';
    if (persen >= 65) return '😏 Boleh juga gayanya, ada daya tarik yang menggoda.';
    if (persen >= 45) return '👀 Standar sih, tapi postur tubuhmu lumayan oke!';
    if (persen >= 25) return '😅 Kurang aura sexy, lebih ke arah polos.';
    return '👶 Sexy dari mananya? Kamu mah masih kayak bocah!';
}

function komentarHot(persen) {
    if (persen >= 95) return '🔥 AWAS MELEPUH! Hot banget sampai bikin ruangan panas!';
    if (persen >= 80) return '🌶️ Pedas dan membara! Daya tarikmu level dewa!';
    if (persen >= 65) return '🌡️ Anget-anget kuku lah, bikin nyaman dilihatnya.';
    if (persen >= 45) return '😌 Lumayan, pesonamu perlahan menghangatkan suasana.';
    if (persen >= 25) return '🧊 Malah adem ayem, kurang memicu hawa panas.';
    return '🥶 KULKAS BERJALAN! Dingin dan kaku banget!';
}

function komentarBucin(persen) {
    if (persen >= 95) return '💞 BUDAK CINTA LEVEL MAX! Dunia cuma milik berdua, yang lain ngontrak!';
    if (persen >= 80) return '😍 Rela ngelakuin apa aja demi ayang nih yee~';
    if (persen >= 65) return '😘 Sedang dimabuk asmara, wajar dikit-dikit bucin.';
    if (persen >= 45) return '🙂 Bucin pada tempatnya, masih pakai logika.';
    if (persen >= 25) return '😎 Lebih mementingkan diri sendiri daripada ayang.';
    return '🗿 Hati batu! Gak kenal yang namanya cinta-cintaan.';
}

function komentarJomblo(persen) {
    if (persen >= 95) return '🕸️ JOMBLO NGENES! Udah berdebu saking lamanya sendiri.';
    if (persen >= 80) return '🥀 Kemana-mana sendiri, awas hati-hati jamuran bro/sist!';
    if (persen >= 65) return '🥲 Sedang dalam fase mencari tapi belum dapet-dapet.';
    if (persen >= 45) return '😏 Jomblo sih, tapi gebetannya di mana-mana.';
    if (persen >= 25) return '😉 Sebentar lagi kayaknya bakal sold out nih!';
    return '💖 Fix udah punya pawang! Bebas dari kutukan jomblo!';
}

// === EXPORT COMMANDS === //

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

            const seed = (nomorA + nomorB).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const persen = (seed * 7 + 13) % 101;

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
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `😎 *GANTENG METER* 😎\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarGanteng(persen)}_`,
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
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `✨ *CANTIK METER* ✨\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarCantik(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !imut ───
    {
        name: 'imut',
        description: 'Cek tingkat keimutan. Format: !imut @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🥺 *CUTE METER* 🥺\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarImut(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !buaya ───
    {
        name: 'buaya',
        description: 'Cek radar buaya. Format: !buaya @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🐊 *RADAR BUAYA* 🐊\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarBuaya(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !wibu ───
    {
        name: 'wibu',
        description: 'Cek seberapa wibu. Format: !wibu @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🎌 *WIBU DETECTOR* 🎌\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarWibu(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !stres ───
    {
        name: 'stres',
        description: 'Cek tingkat stres harian. Format: !stres @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🤯 *STRES METER* 🤯\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarStres(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !sexy ───
    {
        name: 'sexy',
        description: 'Cek aura keseksian. Format: !sexy @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `💃 *SEXY METER* 💃\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarSexy(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !hot ───
    {
        name: 'hot',
        description: 'Cek tingkat hot/pesona membara. Format: !hot @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🔥 *HOT METER* 🔥\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarHot(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !bucin ───
    {
        name: 'bucin',
        description: 'Cek tingkat kebucinan. Format: !bucin @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `💞 *BUCIN METER* 💞\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarBucin(persen)}_`,
                mentions: [targetJid]
            });
        }
    },

    // ─── COMMAND !jomblo ───
    {
        name: 'jomblo',
        description: 'Cek nasib kejombloan. Format: !jomblo @orang',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const targetJid = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0] || msg.key.participant || msg.key.remoteJid;
            const targetNumber = targetJid.replace(/:\d+/, '').split('@')[0];

            const persen = Math.floor(Math.random() * 101);
            await sock.sendMessage(chatId, {
                text: `🕸️ *JOMBLO METER* 🕸️\n─────────────────────\n\n@${targetNumber}\n\n${buatProgressBar(persen)} *${persen}%*\n\n_${komentarJomblo(persen)}_`,
                mentions: [targetJid]
            });
        }
    }
];