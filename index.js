const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// --- 🌐 PENGATURAN GLOBAL & EKONOMI MAKRO 🌐 ---
global.mataUang = "💠 Nexus";
global.MAX_SUPPLY = 1000000; // Pasokan Uang Mutlak (Tidak bisa inflasi)

global.db = {
    bank: {
        brankas: global.MAX_SUPPLY, // Awal mula semua uang ada di Bank
        kredit: {} // Catatan utang pemain { nomor: { utang, jatuhTempo } }
    },
    player: {}, // Data dompet & status pemain
    pet: {},    // Data peliharaan
    market: {}  // Data lisensi toko pemain
};

// --- 💾 SISTEM DATABASE & AUDIT EKONOMI 💾 ---
function loadDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const files = ['bank', 'player', 'pet', 'market'];
    files.forEach(file => {
        const filePath = path.join(dataDir, `${file}.json`);
        if (fs.existsSync(filePath)) {
            global.db[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } else {
            fs.writeFileSync(filePath, JSON.stringify(global.db[file], null, 2));
        }
    });

    auditEkonomi(); // Panggil BPK (Badan Pemeriksa Keuangan) bot
}

function auditEkonomi() {
    console.log('[AUDIT] Memeriksa keseimbangan ekonomi...');
    let uangDiPemain = 0;

    // Hitung semua uang yang beredar di tangan pemain
    for (const nomor in global.db.player) {
        uangDiPemain += (global.db.player[nomor].saldo || 0);
    }

    // Tambahkan di dekat inisialisasi global.db.player atau global.db.pet
if (!fs.existsSync('./data/boss.json')) {
    fs.writeFileSync('./data/boss.json', JSON.stringify({ aktif: false }, null, 2));
}
global.db.boss = JSON.parse(fs.readFileSync('./data/boss.json'));

    const uangDiBank = global.db.bank.brankas;
    const totalUangSistem = uangDiPemain + uangDiBank;

    if (totalUangSistem !== global.MAX_SUPPLY) {
        console.log(`⚠️ [PERINGATAN] Anomali ekonomi terdeteksi! Total: ${totalUangSistem}`);
        // Jika ada kebocoran/anomali, Bank Sentral menanggung selisihnya agar tetap 100.000
        global.db.bank.brankas = global.MAX_SUPPLY - uangDiPemain;
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
        console.log(`[AUDIT] Koreksi otomatis: Brankas Bank disesuaikan menjadi ${global.db.bank.brankas} Nexus.`);
    } else {
        console.log(`✅ [AUDIT] Ekonomi stabil. Total sirkulasi: ${totalUangSistem} Nexus.`);
    }
}

loadDatabase();
// -----------------------------------------------

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`[SYSTEM] Menggunakan WA Web v${version.join('.')} (Terbaru: ${isLatest})`);

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'] 
    });

    // --- INISIALISASI COMMAND HANDLER (STRUKTUR BARU) ---
    sock.commands = new Map();
    const folders = ['perbankan', 'pet_core', 'pvp_coop', 'toko_player', 'panduan'];
    
    console.log('[SYSTEM] Memuat module perintah...');
    for (const folder of folders) {
        const folderPath = path.join(__dirname, `commands/${folder}`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            sock.commands.set(command.name, command);
        }
    }
    console.log(`[SYSTEM] Berhasil memuat ${sock.commands.size} perintah.`);
    // --------------------------------------------

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) qrcode.generate(qr, { small: true });
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('\n✅ Nexus Core berhasil online!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // --- 🌟 SENSOR REPLY "GAS" (DUEL & KAWIN) 🌟 ---
        const teksPesanMasuk = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const idPesanDibalas = msg.message.extendedTextMessage?.contextInfo?.stanzaId;

        if (idPesanDibalas && teksPesanMasuk.toLowerCase().trim() === 'gas') {
            const replierId = msg.key.participant || msg.key.remoteJid;
            const replierNumber = replierId.replace(/:\d+/, '').split('@')[0];
            const fs = require('fs');
            const path = require('path');

            // 1. CEK JIKA ITU BALASAN TANTANGAN DUEL
            if (global.db.tantanganDuel && global.db.tantanganDuel[idPesanDibalas]) {
                const dataDuel = global.db.tantanganDuel[idPesanDibalas];
                
                if (dataDuel.target === replierNumber) {
                    const penantangNumber = dataDuel.penantang;
                    const pet1 = global.db.pet[penantangNumber].find(p => p.id === dataDuel.idPetPenantang);
                    const pet2 = global.db.pet[replierNumber].find(p => p.id === dataDuel.idPetTarget);

                    const rng1 = Math.floor(Math.random() * 20);
                    const rng2 = Math.floor(Math.random() * 20);
                    const power1 = (pet1.level * 5) + pet1.power + rng1;
                    const power2 = (pet2.level * 5) + pet2.power + rng2;

                    let pemenang, kalah, namaPemenang, namaKalah, hadiahNexus;

                    if (power1 >= power2) {
                        pemenang = pet1; kalah = pet2;
                        namaPemenang = penantangNumber; namaKalah = replierNumber;
                    } else {
                        pemenang = pet2; kalah = pet1;
                        namaPemenang = replierNumber; namaKalah = penantangNumber;
                    }

                    hadiahNexus = 500; 
                    if (global.db.player[namaKalah].saldo >= hadiahNexus) {
                        global.db.player[namaKalah].saldo -= hadiahNexus;
                        global.db.player[namaPemenang].saldo += hadiahNexus;
                    }

                    pemenang.xp += 50;
                    if (pemenang.xp >= 100) {
                        pemenang.level += 1;
                        pemenang.xp = 0;
                    }
                    kalah.kondisi = 'Sakit (Luka Fisik)';
                    kalah.lapar = Math.max(0, kalah.lapar - 30);

                    fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    delete global.db.tantanganDuel[idPesanDibalas];

                    const teksHasil = `⚔️ *HASIL PERTARUNGAN EPIC!* ⚔️\n\n${pet1.nama} (Power: ${power1}) 🆚 ${pet2.nama} (Power: ${power2})\n\n🏆 *PEMENANG: ${pemenang.nama}* milik @${namaPemenang}!\n${pemenang.nama} mendapatkan +50 XP!\n💸 Merampas uang ${hadiahNexus} 💠 dari pihak yang kalah!\n\n🚑 *KORBAN: ${kalah.nama}* milik @${namaKalah} terluka parah. Kondisinya sekarang: *Sakit (Luka Fisik)*. Beli Perban di Apotek terdekat!`;
                    sock.sendMessage(dataDuel.chatId, { text: teksHasil, mentions: [`${namaPemenang}@s.whatsapp.net`, `${namaKalah}@s.whatsapp.net`] });
                    return; 
                }
            }

            // 2. CEK JIKA ITU BALASAN PROPOSAL PERNIKAHAN
            if (global.db.proposalKawin && global.db.proposalKawin[idPesanDibalas]) {
                const dataKawin = global.db.proposalKawin[idPesanDibalas];
                
                if (dataKawin.target === replierNumber) {
                    if (!global.db.petBersama) global.db.petBersama = [];
                    
                    const newId = global.db.petBersama.length + 1;
                    const gachaPower = Math.floor(Math.random() * 20) + 10;

                    global.db.petBersama.push({
                        id: `B${newId}`, 
                        ortu1: dataKawin.penawar,
                        ortu2: dataKawin.target,
                        nama: `Bayi ${dataKawin.spesies.split(' ')[0]}`,
                        spesies: dataKawin.spesies,
                        diet: dataKawin.diet,
                        rarity: 'Common', 
                        level: 1,
                        xp: 0,
                        health: 100,
                        lapar: 100,
                        kondisi: 'Sehat',
                        power: gachaPower,
                        lastFeed: Date.now()
                    });

                    fs.writeFileSync(path.join(process.cwd(), 'data/petBersama.json'), JSON.stringify(global.db.petBersama, null, 2));
                    delete global.db.proposalKawin[idPesanDibalas]; 

                    const teksLahir = `🍼 *SELAMAT! BAYI TELAH LAHIR!* 🍼\n\nPernikahan direstui! Peliharaan milik @${dataKawin.penawar} dan @${dataKawin.target} telah melahirkan keturunan baru!\n\n👶 *Nama:* Bayi ${dataKawin.spesies.split(' ')[0]}\n🐾 *Spesies:* ${dataKawin.spesies}\nID Bersama: *B${newId}*\n\n_Kalian berdua bisa melihat anak ini di bagian bawah menu !mypet masing-masing!_`;
                    sock.sendMessage(dataKawin.chatId, { text: teksLahir, mentions: [`${dataKawin.penawar}@s.whatsapp.net`, `${dataKawin.target}@s.whatsapp.net`] });
                    return;
                }
            }
        }
        // ------------------------------------------------

        const pesanTeks = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
        
        if (!pesanTeks.startsWith('!')) return;

        const args = pesanTeks.slice(1).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        // Inisialisasi otomatis data player jika belum ada
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];
        if (!global.db.player[senderNumber]) {
            global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
            fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        }

        if (sock.commands.has(commandName)) {
            const command = sock.commands.get(commandName);
            try {
                await command.execute(sock, msg, args);
            } catch (error) {
                console.error(`[ERROR] Gagal menjalankan perintah ${commandName}:`, error);
            }
        }
    });
}

// Panggil Web Server
const startWebServer = require('./server.js');
startWebServer();

connectToWhatsApp();