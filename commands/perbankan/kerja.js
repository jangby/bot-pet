const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kerja',
    description: 'Bekerja sebagai buruh untuk mendapatkan modal awal',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.sesiKerja) global.db.sesiKerja = {}; 

        // 1. JIKA PEMAIN SEDANG MENGERJAKAN TUGAS
        if (global.db.sesiKerja[senderNumber]) {
            const sesi = global.db.sesiKerja[senderNumber];

            if (args.length > 0) {
                const jawabanUser = args.join(' ').toLowerCase();

                global.db.player[senderNumber].lastKerja = Date.now();

                if (jawabanUser === sesi.jawaban) {
                    let gaji = Math.floor(Math.random() * 200) + 270; 
                    let teksBonus = '';
                    
                    if (global.db.player[senderNumber].pasangan) {
                        gaji += 50;
                        teksBonus = '\n💕 _(Bonus Semangat dari Pasangan: +50 💠)_';
                    }

                    global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + gaji;

                    if (global.db.bank.brankas >= gaji) {
                        global.db.bank.brankas -= gaji;
                    }

                    delete global.db.sesiKerja[senderNumber];

                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

                    return await sock.sendMessage(chatId, { text: `✅ *KERJA KERAS TERBAYAR!*\n\nJawabanmu benar! Mandor memberimu upah sebesar *${gaji} 💠*.${teksBonus}\n\n_Kamu bisa melamar kerja lagi setelah istirahat 1 menit._` }, { quoted: msg });
                } else {
                    delete global.db.sesiKerja[senderNumber];
                    
                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    return await sock.sendMessage(chatId, { text: `❌ *SALAH!*\n\nMandor marah karena pekerjaanmu berantakan. Jawaban yang benar adalah: *${sesi.jawaban}*.\n\nKamu diusir dan tidak dibayar!\n_Tunggu 3 menit sebelum bisa melamar kerja lagi._` }, { quoted: msg });
                }
            } else {
                return await sock.sendMessage(chatId, { text: `⚠️ Selesaikan dulu pekerjaanmu yang tertunda!\n\n📝 *Tugas:* ${sesi.soal}\n💡 _Jawab dengan: \`!kerja [jawabanmu]\`_` }, { quoted: msg });
            }
        }

        // 2. CEK COOLDOWN
        const waktuTerakhir = global.db.player[senderNumber].lastKerja || 0;
        const cooldownSelesai = waktuTerakhir + (1 * 60 * 1000); 

        if (Date.now() < cooldownSelesai) {
            const sisaWaktu = Math.ceil((cooldownSelesai - Date.now()) / 60000); 
            return await sock.sendMessage(chatId, { 
                text: `⏳ *MANDOR SEDANG ISTIRAHAT*\n\nKamu sudah bekerja dengan giat, tapi kita tidak ingin melakukan *spam* di grup ini!\nTunggu sekitar *${sisaWaktu} menit* lagi sebelum melamar pekerjaan baru.` 
            }, { quoted: msg });
        }

        if (args.length > 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum melamar pekerjaan. Ketik `!kerja` saja terlebih dahulu.' }, { quoted: msg });
        }

        // --- 3. SISTEM SOAL ACAK YANG LEBIH SUSAH & BERVARIASI ---
        const tipeSoal = Math.floor(Math.random() * 8); // Diperluas menjadi 8 Variasi Soal
        let soal = '';
        let jawaban = '';

        switch(tipeSoal) {
            case 0:
                // Matematika: Perkalian Agak Susah
                const kali1 = Math.floor(Math.random() * 40) + 10;
                const kali2 = Math.floor(Math.random() * 15) + 3;
                soal = `Berapa hasil dari ${kali1} x ${kali2}?`;
                jawaban = (kali1 * kali2).toString();
                break;
                
            case 1:
                // Matematika: Pembagian Tepat (Tanpa Koma)
                const bagiHasil = Math.floor(Math.random() * 25) + 5;
                const pembagi = Math.floor(Math.random() * 12) + 2;
                const angkaAwal = bagiHasil * pembagi;
                soal = `Berapa hasil dari ${angkaAwal} : ${pembagi}?`;
                jawaban = bagiHasil.toString();
                break;
                
            case 2:
                // Matematika: Campuran (Kurung Dulu)
                const a = Math.floor(Math.random() * 20) + 5;
                const b = Math.floor(Math.random() * 10) + 2;
                const c = Math.floor(Math.random() * 10) + 1;
                soal = `Berapa hasil dari (${a} + ${b}) x ${c}?`;
                jawaban = ((a + b) * c).toString();
                break;
                
            case 3:
                // Susun Huruf (Kata Susah - Diperbanyak)
                const kataSusah = [
                    // Kumpulan 1-50
                    'kriptocurrency', 'transparansi', 'monopoli', 'identifikasi', 'infrastruktur', 
                    'metabolisme', 'karnivora', 'peliharaan', 'ekosistem', 'kemerdekaan', 
                    'khatulistiwa', 'astronot', 'bioteknologi', 'ensiklopedia', 'fotografi', 
                    'globalisasi', 'halusinasi', 'imajinasi', 'jurnalistik', 'kaligrafi', 
                    'laboratorium', 'manajemen', 'navigasi', 'observasi', 'psikologi', 
                    'kualifikasi', 'revolusi', 'sertifikat', 'telekomunikasi', 'universitas',
                    'parlemen', 'diplomasi', 'reboisasi', 'urbanisasi', 'konstitusi',
                    'kewarganegaraan', 'demokratisasi', 'industrialisasi', 'perpustakaan', 'kesejahteraan',
                    'kebudayaan', 'pertambangan', 'pertanian', 'perindustrian', 'perdagangan',
                    'transportasi', 'komunikasi', 'teknologi', 'informasi', 'pendidikan',

                    // Kumpulan 51-100
                    'kesehatan', 'pariwisata', 'lingkungan', 'masyarakat', 'pemerintahan',
                    'kementerian', 'kepolisian', 'pengadilan', 'kejaksaan', 'kehakiman',
                    'legislatif', 'eksekutif', 'yudikatif', 'proklamasi', 'reformasi',
                    'demonstrasi', 'negosiasi', 'administrasi', 'birokrasi', 'organisasi',
                    'institusi', 'asimilasi', 'akulturasi', 'diskriminasi', 'toleransi',
                    'solidaritas', 'integritas', 'akuntabilitas', 'kapabilitas', 'fleksibilitas',
                    'kreativitas', 'produktivitas', 'efektivitas', 'efisiensi', 'inovasi',
                    'renovasi', 'ekskavasi', 'restorasi', 'konstruksi', 'rekonstruksi',
                    'arsitektur', 'literatur', 'nomenklatur', 'temperatur', 'literasi',
                    'numerasi', 'artikulasi', 'manipulasi', 'spekulasi', 'kalkulasi',

                    // Kumpulan 101-150
                    'simulasi', 'stimulasi', 'regulasi', 'deregulasi', 'klarifikasi',
                    'modifikasi', 'spesifikasi', 'klasifikasi', 'verifikasi', 'falsifikasi',
                    'sertifikasi', 'dokumentasi', 'argumentasi', 'implementasi', 'instrumentasi',
                    'eksperimen', 'departemen', 'apartemen', 'kompartemen', 'fundamental',
                    'monumental', 'instrumental', 'sentimental', 'tradisional', 'proporsional',
                    'profesional', 'operasional', 'rasional', 'emosional', 'fungsional',
                    'institusional', 'konstitusional', 'fenomenal', 'spektakuler', 'sirkulasi',
                    'ventilasi', 'isolasi', 'instalasi', 'konstelasi', 'akumulasi',
                    'formulasi', 'rekonsiliasi', 'afiliasi', 'apresiasi', 'depresiasi',
                    'asosiasi', 'variasi', 'radiasi', 'mediasi', 'intervensi',

                    // Kumpulan 151-200
                    'prevensi', 'konvensi', 'dimensi', 'suspensi', 'kompensasi',
                    'dispensasi', 'kondensasi', 'sensasi', 'transaksi', 'interaksi',
                    'kontraksi', 'ekstraksi', 'atraksi', 'abstraksi', 'instruksi',
                    'destruksi', 'obstruksi', 'reproduksi', 'introduksi', 'deduksi',
                    'induksi', 'konduksi', 'reduksi', 'produksi', 'konsumsi',
                    'asumsi', 'presumsi', 'deskripsi', 'transkripsi', 'inskripsi',
                    'proskripsi', 'preskripsi', 'substitusi', 'restitusi', 'distribusi',
                    'kontribusi', 'atribusi', 'retribusi', 'resolusi', 'evolusi',
                    'involusi', 'konvolusi', 'polusi', 'kolusi', 'konklusi',
                    'eksklusi', 'inklusi', 'intrusi', 'ekstrusi', 'vibrasi'
                ];
                const kataTerpilih = kataSusah[Math.floor(Math.random() * kataSusah.length)];
                const kataAcak = kataTerpilih.split('').sort(() => 0.5 - Math.random()).join('');
                soal = `Susun huruf acak berikut menjadi kata yang benar: *${kataAcak.toUpperCase()}*`;
                jawaban = kataTerpilih;
                break;
                
            case 4:
                // Pola Deret Angka (Varian ditambah)
                const pola = Math.floor(Math.random() * 5); // 5 jenis pola sekarang
                let start = Math.floor(Math.random() * 10) + 1;
                if (pola === 0) {
                    // Loncat tambah
                    const loncat = Math.floor(Math.random() * 5) + 2;
                    soal = `Berapa angka selanjutnya dari deret ini: ${start}, ${start + loncat}, ${start + (loncat*2)}, ${start + (loncat*3)}, ...?`;
                    jawaban = (start + (loncat*4)).toString();
                } else if (pola === 1) {
                    // Loncat kali 2
                    soal = `Berapa angka selanjutnya dari deret ini: ${start}, ${start * 2}, ${start * 4}, ${start * 8}, ...?`;
                    jawaban = (start * 16).toString();
                } else if (pola === 2) {
                    // Loncat ganjil bertingkat (+1, +3, +5)
                    soal = `Berapa angka selanjutnya dari deret ini: ${start}, ${start+1}, ${start+4}, ${start+9}, ...?`;
                    jawaban = (start+16).toString();
                } else if (pola === 3) {
                    // Pola Kuadrat
                    const sqStart = Math.floor(Math.random() * 5) + 2;
                    soal = `Berapa angka selanjutnya dari deret ini: ${sqStart*sqStart}, ${(sqStart+1)*(sqStart+1)}, ${(sqStart+2)*(sqStart+2)}, ...?`;
                    jawaban = ((sqStart+3)*(sqStart+3)).toString();
                } else {
                    // Pola Fibonacci simple
                    const f1 = Math.floor(Math.random() * 5) + 1;
                    const f2 = Math.floor(Math.random() * 5) + 1;
                    soal = `Berapa angka selanjutnya dari deret ini: ${f1}, ${f2}, ${f1+f2}, ${f1+(2*f2)}, ${2*f1+(3*f2)}, ...?`;
                    jawaban = (3*f1+(5*f2)).toString();
                }
                break;
                
            case 5:
                // Trivia / Pengetahuan Umum (Diperbanyak drastis)
                const trivia = [
    // --- 23 Soal Bawaan ---
    { t: "Hewan apa yang dikenal sebagai 'Raja Hutan'?", j: "singa" },
    { t: "Apa makanan utama dari hewan Herbivora?", j: "tumbuhan" },
    { t: "Ibukota negara Indonesia adalah?", j: "jakarta" },
    { t: "Planet apa yang dijuluki planet merah?", j: "mars" },
    { t: "Apa mata uang yang digunakan di dalam game grup ini?", j: "nexus" },
    { t: "Hewan peliharaan rahasia (Secret) yang berbentuk dinosaurus leher panjang?", j: "brontosaurus" },
    { t: "Gunung tertinggi di dunia adalah Gunung...", j: "everest" },
    { t: "Negara terluas di dunia adalah...", j: "rusia" },
    { t: "Benua terkecil di dunia adalah benua...", j: "australia" },
    { t: "Unsur kimia dengan simbol O adalah...", j: "oksigen" },
    { t: "Provinsi paling timur di Indonesia adalah...", j: "papua" },
    { t: "Mata uang negara Jepang adalah...", j: "yen" },
    { t: "Binatang yang bisa merubah warna kulitnya untuk kamuflase?", j: "bunglon" },
    { t: "Candi Buddha terbesar di Indonesia yang terletak di Magelang?", j: "borobudur" },
    { t: "Senjata tradisional khas Jawa Barat adalah...", j: "kujang" },
    { t: "Alat bernapas pada ikan adalah...", j: "insang" },
    { t: "Pusat tata surya kita adalah...", j: "matahari" },
    { t: "Siapa penemu lampu pijar? (Nama belakangnya saja)", j: "edison" },
    { t: "Bahan bakar kereta api uap zaman dulu adalah...", j: "batu bara" },
    { t: "Rumah adat provinsi Sumatera Barat adalah Rumah...", j: "gadang" },
    { t: "Phobia atau rasa takut berlebihan terhadap ruang sempit disebut...", j: "klaustrofobia" },
    { t: "Game kotak-kotak di mana kita bisa menambang dan membangun adalah...", j: "minecraft" },
    { t: "Julukan untuk negara Thailand adalah negeri Gajah...", j: "putih" },

    // --- 77 Soal Baru ---
    { t: "Benua terbesar di dunia adalah benua...", j: "asia" },
    { t: "Mamalia laut terbesar di dunia adalah paus...", j: "biru" },
    { t: "Satu-satunya hewan mamalia yang bisa terbang adalah...", j: "kelelawar" },
    { t: "Cairan manis yang dihasilkan oleh lebah dari nektar bunga adalah...", j: "madu" },
    { t: "Logam yang berwujud cair pada suhu ruang adalah...", j: "raksa" },
    { t: "Ibukota negara Malaysia adalah...", j: "kuala lumpur" },
    { t: "Negara yang mendapat julukan 'Negeri Kincir Angin' adalah...", j: "belanda" },
    { t: "Benua di kutub selatan yang tertutup es dan tidak berpenghuni tetap adalah...", j: "antartika" },
    { t: "Samudra terluas di dunia adalah Samudra...", j: "pasifik" },
    { t: "Siapakah nama presiden pertama Republik Indonesia?", j: "soekarno" },
    { t: "Kain tradisional bergambar khas Indonesia yang pembuatannya menggunakan malam/lilin adalah...", j: "batik" },
    { t: "Makanan khas Padang berbahan daging sapi yang diakui sebagai salah satu makanan terenak di dunia adalah...", j: "rendang" },
    { t: "Planet terbesar di tata surya kita adalah...", j: "yupiter" },
    { t: "Satelit alami yang mengelilingi Bumi adalah...", j: "bulan" },
    { t: "Karakter monster kuning kecil berelemen listrik di seri Pokemon adalah...", j: "pikachu" },
    { t: "Tukang ledeng berkumis berbaju merah yang ikonik dari Nintendo adalah...", j: "mario" },
    { t: "Ninja berambut kuning dari Desa Konoha yang memiliki siluman rubah di tubuhnya adalah...", j: "naruto" },
    { t: "Robot kucing berwarna biru yang datang dari abad ke-22 adalah...", j: "doraemon" },
    { t: "Olahraga yang menggunakan raket dan *shuttlecock* (kok) adalah...", j: "bulu tangkis" },
    { t: "Induk organisasi sepak bola dunia disingkat...", j: "fifa" },
    { t: "Gaya tarik-menarik yang membuat benda jatuh ke permukaan bumi adalah gaya...", j: "gravitasi" },
    { t: "Bangun datar yang memiliki tiga sudut dan tiga sisi disebut...", j: "segitiga" },
    { t: "Kota di Indonesia yang dijuluki sebagai 'Kota Pahlawan' adalah...", j: "surabaya" },
    { t: "Danau vulkanik terbesar di Indonesia yang terletak di Sumatera Utara adalah Danau...", j: "toba" },
    { t: "Selat yang memisahkan Pulau Jawa dan Pulau Sumatera adalah Selat...", j: "sunda" },
    { t: "Bangunan kuno berbentuk segitiga di Mesir yang menjadi makam para Firaun adalah...", j: "piramida" },
    { t: "Monumen terkenal di India yang dibangun oleh Kaisar Shah Jahan untuk istrinya adalah...", j: "taj mahal" },
    { t: "Kadal raksasa purba asli Indonesia yang hidup di Nusa Tenggara Timur adalah...", j: "komodo" },
    { t: "Tanaman berduri yang sangat identik dengan padang gurun adalah...", j: "kaktus" },
    { t: "Makanan utama dari beruang panda adalah daun...", j: "bambu" },
    { t: "Bunga mawar yang sering dijadikan lambang cinta romantis biasanya berwarna...", j: "merah" },
    { t: "Warna yang dihasilkan dari campuran warna biru dan kuning adalah...", j: "hijau" },
    { t: "Warna yang dihasilkan dari campuran warna merah dan putih adalah...", j: "merah muda" },
    { t: "Bapak proklamator kemerdekaan Indonesia selain Ir. Soekarno adalah Moh. ...", j: "hatta" },
    { t: "Senjata tajam tradisional khas suku Dayak di Kalimantan adalah...", j: "mandau" },
    { t: "Ansambel musik tradisional khas Jawa dan Bali yang terdiri dari alat pukul adalah...", j: "gamelan" },
    { t: "Alat musik tradisional Jawa Barat yang dimainkan dengan cara digoyangkan adalah...", j: "angklung" },
    { t: "Game klasik *puzzle* menyusun balok-balok yang jatuh dari atas adalah...", j: "tetris" },
    { t: "Olahraga yang tujuannya memasukkan bola ke dalam keranjang atau *ring* lawan adalah...", j: "bola basket" },
    { t: "Ibukota dari provinsi Jawa Barat adalah...", j: "bandung" },
    { t: "Mata uang resmi dari negara Amerika Serikat adalah...", j: "dolar" },
    { t: "Mata uang resmi dari negara Korea Selatan adalah...", j: "won" },
    { t: "Ibukota dari negara Inggris Raya adalah...", j: "london" },
    { t: "Ilmuwan jenius yang menemukan Teori Relativitas (Nama belakangnya saja)?", j: "einstein" },
    { t: "Siapa penemu mesin telepon pertama yang diakui dunia? (Nama belakangnya saja)", j: "bell" },
    { t: "Bahasa internasional yang paling banyak digunakan dan dipelajari di dunia adalah bahasa...", j: "inggris" },
    { t: "Burung mitologi yang menjadi lambang negara Republik Indonesia adalah Burung...", j: "garuda" },
    { t: "Hewan mamalia berleher panjang yang hidup di padang rumput Afrika adalah...", j: "jerapah" },
    { t: "Hewan mamalia yang sangat lambat bergerak dan suka bergelantungan di pohon adalah...", j: "kungkang" },
    { t: "Ikan buas bergigi sangat tajam yang hidup berkelompok di Sungai Amazon adalah...", j: "piranha" },
    { t: "Bagian rangka tulang keras yang berfungsi melindungi otak kita disebut...", j: "tengkorak" },
    { t: "Gas yang kita keluarkan dari paru-paru saat mengembuskan napas adalah...", j: "karbon dioksida" },
    { t: "Hari kemerdekaan negara Indonesia diperingati setiap bulan...", j: "agustus" },
    { t: "Di benua manakah letak Gurun Sahara yang sangat luas itu?", j: "afrika" },
    { t: "Negara di Eropa yang sangat ikonik dengan Menara Eiffel adalah...", j: "prancis" },
    { t: "Makanan khas Italia berbentuk bundar pipih yang dipanggang dengan berbagai *topping* adalah...", j: "pizza" },
    { t: "Seni melipat kertas tradisional yang berasal dari Jepang disebut...", j: "origami" },
    { t: "Gunung berapi di Selat Sunda yang letusannya sangat dahsyat pada tahun 1883 adalah...", j: "krakatau" },
    { t: "Alat ukur yang digunakan untuk mengetahui suhu tubuh seseorang disebut...", j: "termometer" },
    { t: "Alat optik yang digunakan untuk mengamati benda-benda di luar angkasa adalah...", j: "teleskop" },
    { t: "Alat optik di laboratorium untuk melihat benda atau bakteri yang sangat kecil adalah...", j: "mikroskop" },
    { t: "Film animasi buatan Pixar yang menceritakan tentang mainan yang bisa hidup bernama...", j: "toy story" },
    { t: "Pahlawan super dari DC Comics yang identik dengan kelelawar dan kota Gotham adalah...", j: "batman" },
    { t: "Pahlawan super dari Marvel yang mendapatkan kekuatan super setelah digigit laba-laba adalah...", j: "spiderman" },
    { t: "Bilangan ganjil yang letaknya tepat setelah angka 7 adalah...", j: "sembilan" },
    { t: "Planet di tata surya kita yang paling terkenal karena memiliki cincin yang indah adalah...", j: "saturnus" },
    { t: "Sebutan untuk rumah tradisional bangsa Eskimo yang terbuat dari balok-balok es adalah...", j: "iglo" },
    { t: "Tarian tradisional khas Aceh yang mengandalkan kekompakan tepuk tangan para penarinya adalah Tari...", j: "saman" },
    { t: "Tarian sakral dari Bali dimana puluhan penari laki-laki duduk melingkar sambil menyerukan 'Cak' adalah Tari...", j: "kecak" },
    { t: "Ibukota dari negara tetangga kita, Filipina, adalah...", j: "manila" },
    { t: "Benua yang berbatasan langsung daratannya dengan Benua Asia di sebelah barat adalah Benua...", j: "eropa" },
    { t: "Satuan jarak standar yang umum digunakan untuk papan petunjuk jalan raya di Indonesia adalah...", j: "kilometer" },
    { t: "Dalam ilmu sains, rumus atau simbol kimia untuk air bersih adalah...", j: "h2o" },
    { t: "Mata uang resmi dari negara Republik Rakyat Tiongkok (China) adalah...", j: "yuan" },
    { t: "Pakaian tradisional asal negara Korea Selatan yang biasa dipakai saat festival disebut...", j: "hanbok" },
    { t: "Garis lintang nol derajat yang membelah Bumi menjadi utara dan selatan disebut garis...", j: "khatulistiwa" },
    { t: "Istilah untuk hewan pemakan segala (tumbuhan dan daging) adalah...", j: "omnivora" }
];
                const pilihTrivia = trivia[Math.floor(Math.random() * trivia.length)];
                soal = `Jawab pertanyaan ini: ${pilihTrivia.t}`;
                jawaban = pilihTrivia.j.toLowerCase();
                break;

            case 6:
                // Teka-teki / Riddles
                const riddles = [
    // 9 Soal Bawaan
    { t: "Aku punya leher tapi tidak punya kepala, punya lengan tapi tak punya jari. Apakah aku?", j: "baju" },
    { t: "Selalu datang tapi tidak pernah tiba. Apakah itu?", j: "besok" },
    { t: "Bisa dipegang tapi tidak bisa disentuh. Bisa didengar tapi tidak bisa dilihat. Apakah itu?", j: "suara" },
    { t: "Jika kamu menyebut namaku, aku akan hilang. Apakah aku?", j: "rahasia" },
    { t: "Punya mata tiga, tapi cuma punya satu kaki. Apakah aku?", j: "lampu lalu lintas" },
    { t: "Makin diisi, makin ringan. Apakah itu?", j: "balon" },
    { t: "Benda apa yang kalau dibalik ukurannya bertambah besar? (Angka)", j: "9" },
    { t: "Punya banyak gigi tapi tidak bisa menggigit. Apakah itu?", j: "sisir" },
    { t: "Pintu apa yang tidak bisa didorong oleh 100 orang sekalipun?", j: "pintu geser" },

    // 91 Soal Tambahan Baru
    { t: "Aku punya banyak lubang, tapi aku bisa menahan air. Apakah aku?", j: "spons" },
    { t: "Berjalan tanpa kaki, terbang tanpa sayap, menangis tanpa mata. Apakah aku?", j: "awan" },
    { t: "Punya kepala, punya ekor, tapi tak punya badan. Apakah aku?", j: "koin" },
    { t: "Makin banyak yang kamu tinggalkan, makin banyak yang kamu ambil. Apakah itu?", j: "langkah kaki" },
    { t: "Punya kota tapi tak punya rumah, punya gunung tapi tak punya pohon, punya air tapi tak punya ikan. Apakah aku?", j: "peta" },
    { t: "Bisa jatuh tapi tak pernah bisa bangun lagi. Apakah itu?", j: "hujan" },
    { t: "Benda apa yang akan naik kalau air turun, dan akan turun kalau air berhenti?", j: "payung" },
    { t: "Punya jempol dan empat jari tapi bukan tangan yang hidup. Apakah aku?", j: "sarung tangan" },
    { t: "Makin besar aku, makin tidak terlihat. Apakah aku?", j: "kegelapan" },
    { t: "Dibeli untuk makan, tapi tak pernah dimakan. Apakah itu?", j: "piring" },
    { t: "Punya banyak lembaran daun tapi tak punya ranting. Apakah aku?", j: "buku" },
    { t: "Aku punya jarum, tapi tak bisa menjahit. Apakah aku?", j: "jam" },
    { t: "Ada satu di menit, dua di momen, tapi tidak ada di jam. Huruf apakah itu?", j: "m" },
    { t: "Makin digunakan untuk mengeringkan, malah makin basah dirinya. Apakah itu?", j: "handuk" },
    { t: "Punya mulut tapi tak bisa bicara, butuh kunci untuk membukaku. Apakah aku?", j: "gembok" },
    { t: "Tidak punya ujung dan tidak punya pangkal, lambang ikatan. Apakah aku?", j: "cincin" },
    { t: "Diberi makan aku hidup, diberi minum aku mati. Apakah aku?", j: "api" },
    { t: "Hanya bisa dipegang setelah diberikan kepada orang lain. Apakah itu?", j: "janji" },
    { t: "Lebih ringan dari kapas, tapi orang terkuat sekalipun tak bisa menahannya lama-lama. Apakah itu?", j: "napas" },
    { t: "Kalau kamu senyum, dia senyum. Kalau kamu marah, dia ikut marah. Siapakah dia?", j: "cermin" },
    { t: "Makin banyak kamu mengambil darinya, makin besar dia jadinya. Apakah itu?", j: "lubang" },
    { t: "Makin bertambah, tak pernah bisa berkurang apalagi kembali. Apakah itu?", j: "umur" },
    { t: "Punya satu mata tapi tak bisa melihat sama sekali. Apakah aku?", j: "jarum" },
    { t: "Punya lidah tapi tak bisa merasakan makanan atau bicara. Apakah aku?", j: "sepatu" },
    { t: "Punya empat kaki tapi tak bisa berjalan setapak pun. Apakah aku?", j: "meja" },
    { t: "Punya leher tapi tak punya kepala, kadang berisi air. Apakah aku?", j: "botol" },
    { t: "Makin dikupas, makin bikin kamu menangis. Apakah aku?", j: "bawang" },
    { t: "Punya tuts hitam dan putih tapi tak punya warna. Apakah aku?", j: "piano" },
    { t: "Tubuhku kayu, hatiku hitam, aku meninggalkan jejak kemanapun aku pergi. Apakah aku?", j: "pensil" },
    { t: "Dibuang luarnya, dimasak dalamnya. Lalu dimakan luarnya, dibuang dalamnya. Makanan apakah itu?", j: "jagung" },
    { t: "Selalu ada di depanmu tapi tak pernah bisa kamu lihat atau kejar. Apakah itu?", j: "masa depan" },
    { t: "Membentang dari rumah ke rumah tapi tak pernah bergerak sama sekali. Apakah itu?", j: "jalan" },
    { t: "Bisa keliling dunia tapi tetap duduk santai di pojokan amplop. Apakah aku?", j: "perangko" },
    { t: "Itu milikmu, tapi lebih sering digunakan oleh orang lain. Apakah itu?", j: "nama" },
    { t: "Kehilangan kepala di pagi hari, mendapatkan kepala di malam hari. Apakah aku?", j: "bantal" },
    { t: "Punya banyak cabang tapi tak punya daun atau buah. Apakah aku?", j: "bank" },
    { t: "Bicara tanpa mulut, mendengar tanpa telinga. Meniru apa saja yang kamu katakan. Apakah aku?", j: "gema" },
    { t: "Siapa yang bisa berjalan di atas air tanpa basah sedikitpun?", j: "bayangan" },
    { t: "Bisa mendorong perahu dan pohon, tapi tak bisa memindahkan kerikil kecil. Apakah itu?", j: "angin" },
    { t: "Bisa membunuh raja, menghancurkan kota, dan menggerus gunung menjadi debu. Apakah itu?", j: "waktu" },
    { t: "Lahir dari air, tapi kalau dikembalikan ke air aku akan mati. Apakah aku?", j: "es batu" },
    { t: "Makin cepat aku berlari, makin tak terlihat jari-jariku. Apakah aku?", j: "roda" },
    { t: "Punya deretan gigi yang tajam tapi gigitanku hanya mempan pada kayu. Apakah aku?", j: "gergaji" },
    { t: "Punya tulang punggung tapi tak punya tulang rusuk atau daging. Apakah aku?", j: "buku" },
    { t: "Dipegang badannya, dicekik lehernya, digenjreng perutnya. Benda apakah aku?", j: "gitar" },
    { t: "Makin sering dipijat dan dipakai mandi, makin kecil tubuhku. Apakah aku?", j: "sabun" },
    { t: "Terkadang bulat penuh, terkadang seperti sabit, tapi tak pernah bisa dipotong. Apakah itu?", j: "bulan" },
    { t: "Kilatan wujudku selalu terlihat lebih dulu sebelum suaraku menggelegar. Apakah aku?", j: "petir" },
    { t: "Sewaktu kecil berekor panjang, sudah besar malah melompat-lompat. Hewan apakah aku?", j: "katak" },
    { t: "Warnanya merah, berjalan merayap tanpa lelah di seluruh tubuhmu. Apakah itu?", j: "darah" },
    { t: "Peti mati tanpa kunci, engsel, atau tutup, tapi di dalamnya ada harta karun berwarna emas. Apakah itu?", j: "telur" },
    { t: "Kecil di mata, tapi aslinya raksasa di angkasa. Apakah aku?", j: "bintang" },
    { t: "Apa yang selalu ada di paling ujung dari kata 'Dunia'?", j: "a" },
    { t: "Kulitku berduri tajam, tapi bagi sebagian orang rasaku bagaikan raja buah. Apakah aku?", j: "durian" },
    { t: "Aku tinggi saat masih muda, dan menjadi sangat pendek saat aku tua. Apakah aku?", j: "lilin" },
    { t: "Ada di dalam kamar, bentukku kotak tebal, rasanya sangat empuk. Apakah aku?", j: "kasur" },
    { t: "Apa yang ada di tengah 'laut', di akhir 'sore', dan di awal 'elang'?", j: "e" },
    { t: "Kalau siang perutnya diisi daging, kalau malam isi perutnya kosong. Benda apakah ini?", j: "sepatu" },
    { t: "Punya jarum kompas tapi tak menjahit, selalu setia menunjuk ke arah utara. Apakah aku?", j: "kompas" },
    { t: "Ular besi raksasa yang panjang dan sangat suka memakan batu bara atau listrik. Apakah itu?", j: "kereta api" },
    { t: "Aku harus dimandikan dengan air mendidih sebelum bisa kamu nikmati. Apakah aku?", j: "teh" },
    { t: "Punya tujuh warna indah, tapi hanya berani muncul setelah hujan reda. Apakah aku?", j: "pelangi" },
    { t: "Melihat semuanya dari atas, tapi tak pernah bisa masuk ke dalam ruangan yang gelap. Apakah aku?", j: "matahari" },
    { t: "Makin aku dibutuhkan oleh kapal, makin aku dibuang ke dasar laut. Apakah aku?", j: "jangkar" },
    { t: "Kecil bulat, berulang kali masuk lubang tapi tak pernah tembus. Apakah aku?", j: "kancing" },
    { t: "Orang bekerja keras siang malam untukku, tapi dengan mudah membuangku ke mesin kasir. Apakah aku?", j: "uang" },
    { t: "Punya layar yang luas tapi tak pernah bisa diajak berlayar ke laut. Apakah aku?", j: "televisi" },
    { t: "Punya banyak huruf, angka, dan tombol masuk, tapi tak punya pintu. Apakah aku?", j: "keyboard" },
    { t: "Kepalaku selalu berapi-api saat bekerja, tubuhku lurus terbuat dari kayu. Apakah aku?", j: "obor" },
    { t: "Duduk manis di atas rumah, berjemur tiap hari, kedinginan dan basah saat hujan. Apakah aku?", j: "genteng" },
    { t: "Makin dalam digali orang, badannya akan makin membesar ke bawah. Apakah aku?", j: "sumur" },
    { t: "Siapa yang selalu setia mengikutimu di siang hari tapi pasti meninggalkanmu di malam gelap?", j: "bayangan" },
    { t: "Bisa menari-nari memutar dengan indah jika diikat tali lalu dilempar ke tanah. Apakah aku?", j: "gasing" },
    { t: "Makin kuat ditarik makin panjang, tapi kalau dilepas tiba-tiba bisa bikin sakit. Apakah aku?", j: "karet" },
    { t: "Punya enam wajah tapi tak pakai riasan, punya dua puluh satu mata tapi buta total. Apakah aku?", j: "dadu" },
    { t: "Terbang tinggi dan menari dengan seutas tali, tapi kalau putus bisa bikin anak menangis. Apakah aku?", j: "layangan" },
    { t: "Huruf apakah yang duduk manis tepat di tengah-tengah kata 'Burung'?", j: "r" },
    { t: "Makin dijilat makin terasa manis, tapi kalau didiamkan saja malah mencair sedih. Apakah aku?", j: "es krim" },
    { t: "Orang membeliku untuk makan, lalu merebusku, tapi setelah direbus aku dibuang. Apakah itu? (Clue: Minuman)", j: "kopi" },
    { t: "Kalau ditutup dia seperti tongkat, kalau dibuka dia seperti atap jamur. Apakah aku?", j: "payung" },
    { t: "Di dalam tempat apa hari Kamis datang sebelum hari Rabu?", j: "kamus" },
    { t: "Punya ruang tapi tak punya tembok, punya tombol hapus tapi tak punya penghapus karet. Apakah aku?", j: "keyboard" },
    { t: "Bisa dipecahkan tanpa disinggung, bisa dijatuhkan tanpa disentuh. Apakah itu?", j: "janji" },
    { t: "Punya dua lengan tapi tak punya jari, memeluk lehermu saat cuaca dingin. Apakah aku?", j: "syal" },
    { t: "Bentukku bundar seperti apel, berlapis tanah dan air, tapi menggantung di angkasa. Apakah aku?", j: "bumi" },
    { t: "Kalau aku hidup aku bernyanyi, kalau aku mati aku bertepuk tangan. (Clue: Sayap)", j: "burung" },
    { t: "Tak punya tubuh tapi bisa menembus dinding. Tak punya suara tapi bisa menyampaikan pesan. (Clue: Jaringan)", j: "wifi" },
    { t: "Punya gigi banyak, tapi makanannya hanya rambut kepala orang. Apakah aku?", j: "sisir" },
    { t: "Berjalan merangkak saat pagi, berjalan tegak saat siang, memakai tongkat saat sore. Apakah aku?", j: "manusia" },
    { t: "Binatang apa yang kalau namanya dipotong bagian awalnya, berubah menjadi hewan melata berbahaya?", j: "kucing" },
    { t: "Aku punya banyak cerita, tapi aku tidak punya suara untuk menceritakannya. Apakah aku?", j: "buku" }
];
                const pilihRiddle = riddles[Math.floor(Math.random() * riddles.length)];
                soal = `Teka-teki Logika: ${pilihRiddle.t}`;
                jawaban = pilihRiddle.j.toLowerCase();
                break;

            case 7:
                // Matematika: Soal Cerita Sederhana
                const hargaBarang = (Math.floor(Math.random() * 10) + 1) * 1000;
                const qty = Math.floor(Math.random() * 3) + 2;
                const totalHarga = hargaBarang * qty;
                const uangDibayar = totalHarga + (Math.floor(Math.random() * 5) + 1) * 5000;
                
                soal = `Mandor menyuruhmu membeli ${qty} buah kopi. Harga 1 kopi adalah Rp${hargaBarang}. Kamu diberi uang Rp${uangDibayar}. Berapa kembaliannya? (Tulis angkanya saja, tanpa titik/Rp)`;
                jawaban = (uangDibayar - totalHarga).toString();
                break;
        }

        global.db.sesiKerja[senderNumber] = {
            soal: soal,
            jawaban: jawaban
        };

        const teksTugas = 
`👷 *LOWONGAN PEKERJAAN* 👷

Mandor memberikanmu tugas. Selesaikan dengan cepat dan tepat untuk mendapatkan upah Nexus!

📝 *Tugas:* ${soal}

💡 _Cara menjawab: Ketik !kerja [jawabanmu]_`;

        await sock.sendMessage(chatId, { text: teksTugas }, { quoted: msg });
    }
};