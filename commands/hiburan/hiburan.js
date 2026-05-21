/**
 * COMMAND: !quotes / !kata
 * Menampilkan kata bijak atau quotes sadboy secara acak.
 * 
 * COMMAND: !pantun
 * Menampilkan pantun jenaka acak.
 * 
 * COMMAND: !fakta
 * Menampilkan fakta unik dunia secara acak.
 * 
 * COMMAND: !joke / !bapak2
 * Menampilkan jokes receh bapak-bapak.
 * 
 * COMMAND: !memeindo
 * Menampilkan meme lokal random (menggunakan gambar online atau API).
 * 
 * Tidak memerlukan library tambahan untuk sebagian besar fitur.
 * Untuk !memeindo butuh: npm install axios
 */

const axios = require('axios'); // npm install axios (hanya untuk !memeindo)

// ─── DATA KONTEN LOKAL ───────────────────────────────────────────

const DAFTAR_QUOTES = [
    '"Jika kamu tidak bisa terbang, berlari. Jika kamu tidak bisa berlari, berjalan. Jika kamu tidak bisa berjalan, merangkak. Yang penting, terus bergerak maju." — Martin Luther King Jr.',
    '"Orang sukses tidak selalu berbakat. Mereka hanya lebih rajin dari yang lain dan tidak pernah menyerah." — Unknown',
    '"Hidupmu tidak akan lebih baik jika kamu menunggu seseorang mengubahnya. Kamu sendiri yang harus melakukannya." — Unknown',
    '"Kesulitan terbesar adalah mengalahkan dirimu sendiri." — Unknown',
    '"Jangan takut gagal. Takutlah tidak pernah mencoba." — Unknown',
    '"Kamu tidak perlu menjadi sempurna untuk menjadi luar biasa." — Unknown',
    '"Kadang kamu menang, kadang kamu belajar. Tidak ada yang namanya kalah." — Unknown',
    '"Yang membuat malam terasa gelap bukan absennya cahaya, tapi absennya keberanian untuk menyalakan lampu." — Unknown',
    '"Rindu itu berat, tapi lebih berat kalau kamu bayar sendiri." — Sadboy Anonymous',
    '"Bukan masalah seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit." — Unknown'
];

const DAFTAR_PANTUN = [
    '🌿 Pergi ke pasar beli ketupat\nJangan lupa beli kuah soto\nKalau kamu ingin cepat kaya raya hebat\nMending kerja keras, bukan cuma ngoto\n— _Pantun Bijak_',
    '🌸 Ada pepaya di atas meja\nBuahnya manis seperti gulali\nHidup memang penuh dengan cerita\nYang penting jangan lupa bahagia\n— _Pantun Hidup_',
    '🎋 Hujan turun rintik-rintik\nGenangan air di depan teras\nWajahmu memang cantik-cantik\nSayang hatinya lebih keras dari beras\n— _Pantun Receh_',
    '🍃 Jalan-jalan ke kota Malang\nJangan lupa beli apel merah\nGalau boleh, tapi jangan kelamaan\nNanti dompetmu yang ikut meremah\n— _Pantun Galau_',
    '🌺 Beli bakso di pinggir jalan\nKuahnya panas dan gurih sekali\nKalau kamu lagi banyak pikiran\nMending makan dulu baru ngomong lagi\n— _Pantun Bijak Banget_'
];

const DAFTAR_FAKTA = [
    '🌍 Gurita memiliki 3 jantung, 9 otak, dan darah berwarna biru!',
    '🦈 Hiu adalah satu-satunya ikan yang bisa berkedip.',
    '🌙 Kalau kamu menangis di luar angkasa, air matamu akan mengapung di wajahmu!',
    '🐝 Seekor lebah madu menghasilkan hanya 1/12 sendok teh madu sepanjang hidupnya.',
    '🎵 Lagu "Happy Birthday" punya hak cipta hingga tahun 2030-an!',
    '🦋 Sayap kupu-kupu sebenarnya transparan. Warna yang kita lihat berasal dari sisik kecil di permukaannya.',
    '🌊 Ada lebih banyak bintang di alam semesta daripada butiran pasir di semua pantai di Bumi.',
    '🧠 Otak manusia menggunakan daya sekitar 20 watt — cukup untuk menyalakan sebuah bola lampu!',
    '🦁 Singa adalah satu-satunya kucing yang hidup dalam kelompok sosial (gerombolan).',
    '🍌 Pisang secara ilmiah adalah buah beri, sedangkan stroberi bukan!'
];

const DAFTAR_JOKES = [
    '👨 Kenapa bapak-bapak suka nonton film horror?\nKarena film drama bikin mereka tidur 😂',
    '🧑 Anak: "Pak, aku pengen jadi astronot!"\nBapak: "Nak, gaji astronot itu jarang naik." 😂',
    '👨 Kenapa matematika itu pelajaran paling jujur?\nKarena selalu bilang "x" walau sudah tahu jawabannya! 😂',
    '🧑 Bapak: "Nak, kamu harus belajar banyak bahasa!"\nAnak: "Kenapa pak?"\nBapak: "Biar nanti bisa nolak tawaran dari banyak negara." 😂',
    '👨 Kenapa bapak-bapak suka pakai sandal jepit?\nKarena flip-flop itu konsisten — gak pernah bohong soal posisinya 😂',
    '🧑 Dokter: "Bapak harus banyak minum air putih."\nBapak: "Dari kolam renang boleh gak dok?" 😂',
    '👨 Kenapa komputer cepat panas?\nKarena processornya *overloaded* kayak pikiran bapak pas akhir bulan 😂',
    '🧑 Anak: "Pak, apa beda WiFi sama filosofi?"\nBapak: "Kalau WiFi, sinyal nyata. Kalau filosofi, sinyalnya suka ghosting." 😂'
];

module.exports = [
    // ─── COMMAND !quotes / !kata ───
    {
        name: 'quotes',
        aliases: ['kata'],
        description: 'Tampilkan kata bijak/quotes acak',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const quoteAcak = DAFTAR_QUOTES[Math.floor(Math.random() * DAFTAR_QUOTES.length)];
            await sock.sendMessage(chatId, {
                text: `💬 *QUOTES OF THE DAY*\n\n_${quoteAcak}_`
            });
        }
    },

    // ─── COMMAND !pantun ───
    {
        name: 'pantun',
        description: 'Tampilkan pantun jenaka acak',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const pantunAcak = DAFTAR_PANTUN[Math.floor(Math.random() * DAFTAR_PANTUN.length)];
            await sock.sendMessage(chatId, {
                text: `📜 *PANTUN HARI INI*\n\n${pantunAcak}`
            });
        }
    },

    // ─── COMMAND !fakta ───
    {
        name: 'fakta',
        description: 'Tampilkan fakta unik dunia acak',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const faktaAcak = DAFTAR_FAKTA[Math.floor(Math.random() * DAFTAR_FAKTA.length)];
            await sock.sendMessage(chatId, {
                text: `🔬 *FAKTA UNIK DUNIA*\n\n${faktaAcak}\n\n_Mau fakta lain? Ketik \`!fakta\` lagi!_`
            });
        }
    },

    // ─── COMMAND !joke / !bapak2 ───
    {
        name: 'joke',
        aliases: ['bapak2'],
        description: 'Tampilkan jokes receh bapak-bapak acak',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const jokeAcak = DAFTAR_JOKES[Math.floor(Math.random() * DAFTAR_JOKES.length)];
            await sock.sendMessage(chatId, {
                text: `😂 *JOKES RECEH BAPAK-BAPAK*\n\n${jokeAcak}`
            });
        }
    },

    // ─── COMMAND !memeindo ───
    {
        name: 'memeindo',
        description: 'Tampilkan meme lokal random',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;

            try {
                // ==========================================
                // Menggunakan API meme publik (Reddit Indonesia via Meme API)
                // API: meme-api.com — gratis, tanpa API key
                // Subreddit: memes, dankmemes, indonesia (sesuaikan)
                // ==========================================
                const SUBREDDITS = ['dankmemes', 'memes', 'me_irl'];
                const subredditAcak = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];

                const responAPI = await axios.get(`https://meme-api.com/gimme/${subredditAcak}`, {
                    timeout: 10000
                });

                const dataMeme = responAPI.data;
                const urlGambar = dataMeme?.url;
                const judulMeme = dataMeme?.title || 'Meme Random';

                if (!urlGambar) throw new Error('Tidak ada meme tersedia');

                // Download gambar meme
                const responGambar = await axios.get(urlGambar, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });

                const bufferMeme = Buffer.from(responGambar.data);

                await sock.sendMessage(chatId, {
                    image: bufferMeme,
                    caption: `😂 *${judulMeme}*\n_r/${subredditAcak}_`
                });

            } catch (error) {
                console.error('[ERROR] !memeindo:', error);
                // Fallback: kirim teks lucu jika API gagal
                await sock.sendMessage(chatId, {
                    text: '😂 *Meme Gagal Load...*\n\n_Tapi tau nggak? Kamu itu meme terbaik yang pernah ada di grup ini!_\n\n_(API meme sedang bermasalah, coba lagi nanti)_'
                }, { quoted: msg });
            }
        }
    }
];
