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
const regModule = require('./commands/utilities/registrasi');

let lelangInterval; 

// --- 🌐 PENGATURAN GLOBAL & EKONOMI MAKRO 🌐 ---
global.mataUang = "💠 Nexus";
global.MAX_SUPPLY = 1000000000; 

global.db = {
    bank: { brankas: global.MAX_SUPPLY, kredit: {} },
    player: {}, 
    pet: {},     
    market: {},
    inventory: {},
    tantanganDuel: {},
    proposalKawin: {},
    pemilu: { status: 'idle', kandidat: [], pemilih: [], fee: 10000, chatId: '', timer: null }
};

// --- 💾 SISTEM DATABASE & AUDIT EKONOMI 💾 ---
function loadDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const files = ['bank', 'player', 'pet', 'market', 'inventory', 'petBersama'];
    files.forEach(file => {
        const filePath = path.join(dataDir, `${file}.json`);
        if (fs.existsSync(filePath)) {
            global.db[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } else {
            const initialData = file === 'petBersama' ? [] : (global.db[file] || {});
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
            global.db[file] = initialData;
        }
    });

    if (!fs.existsSync('./data/boss.json')) {
        fs.writeFileSync('./data/boss.json', JSON.stringify({ aktif: false }, null, 2));
    }
    global.db.boss = JSON.parse(fs.readFileSync('./data/boss.json'));

    if (!fs.existsSync('./data/kabinet.json')) {
        const kabinetInit = {
            kas_negara: 0,
            presiden: "6285188427706",
            wakil_presiden: "173766357327942",
            menteri_keuangan: { nomor: "", pajak_pendapatan: 5, bunga_pinjaman: 2 },
            menteri_perdagangan: { nomor: "", pajak_transaksi: 2 },
            menteri_esdm: { nomor: "", pajak_tambang: 3 },
            menteri_pertanian: { nomor: "", pajak_kawin: 5 },
            menteri_pertahanan: { nomor: "", denda_rampok: 10 }
        };
        fs.writeFileSync('./data/kabinet.json', JSON.stringify(kabinetInit, null, 2));
    }
    global.db.kabinet = JSON.parse(fs.readFileSync('./data/kabinet.json', 'utf-8'));

    if (!fs.existsSync('./data/nik.json')) {
        const nikInit = {
            session: { active: false, groupId: null, groupName: null, startedAt: null, lastReminderAt: null },
            records: {},
            pending: []
        };
        fs.writeFileSync('./data/nik.json', JSON.stringify(nikInit, null, 2));
    }
    global.db.nik = JSON.parse(fs.readFileSync('./data/nik.json', 'utf-8'));
    if (!global.db.nik.session) global.db.nik.session = { active: false, groupId: null, groupName: null, startedAt: null, lastReminderAt: null };
    if (!global.db.nik.records) global.db.nik.records = {};
    if (!global.db.nik.pending) global.db.nik.pending = [];

    auditEkonomi(); 
}

function auditEkonomi() {
    console.log('[AUDIT] Memeriksa keseimbangan ekonomi...');
    let uangDiPemain = 0;
    for (const nomor in global.db.player) {
        uangDiPemain += (global.db.player[nomor].saldo || 0);
    }
    const uangDiBank = global.db.bank.brankas;
    const totalUangSistem = uangDiPemain + uangDiBank;

    if (totalUangSistem !== global.MAX_SUPPLY) {
        console.log(`⚠️ [PERINGATAN] Anomali ekonomi! Total: ${totalUangSistem}`);
        global.db.bank.brankas = Math.max(0, global.MAX_SUPPLY - uangDiPemain);
        fs.writeFileSync('./data/bank.json', JSON.stringify(global.db.bank, null, 2));
    } else {
        console.log(`✅ [AUDIT] Ekonomi stabil. Sirkulasi: ${totalUangSistem} Nexus.`);
    }
}

loadDatabase();

// --- 🚀 KONEKSI UTAMA WHATSAPP 🚀 ---
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`[SYSTEM] WhatsApp Web v${version.join('.')} (Terbaru: ${isLatest})`);

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Republik Nexus', 'Chrome', '1.0.0'] 
    });

    // --- 🏪 MESIN PEMANTAU LELANG OTOMATIS ---
    if (lelangInterval) clearInterval(lelangInterval);
    lelangInterval = setInterval(async () => {
        try {
            if (!global.db.market?.lelang?.['BANK_SENTRAL']) return;
            const lelang = global.db.market.lelang['BANK_SENTRAL'];
            const sekarang = Date.now();
            const waktuSelesai = lelang.waktuSita + (60 * 60 * 1000);

            if (sekarang >= waktuSelesai) {
                if (lelang.pemenangSementara) {
                    const pemenang = lelang.pemenangSementara;
                    global.db.bank.brankas += lelang.bidTertinggi;
                    global.db.market.tokoPemain[pemenang] = {
                        nama: lelang.nama,
                        kategori: 'serba_ada',
                        etalase: lelang.etalase || {},
                        tokenWeb: lelang.tokenWeb,
                        pendapatan: 0, terakhirLaku: sekarang
                    };
                    const tagPemenang = pemenang.length > 14 ? `${pemenang}@lid` : `${pemenang}@s.whatsapp.net`;
                    await sock.sendMessage(lelang.chatId, { 
                        text: `🎉 *LELANG DITUTUP!*\n\nLisensi jatuh ke tangan @${pemenang} seharga *${lelang.bidTertinggi.toLocaleString()} 💠*!`, 
                        mentions: [tagPemenang] 
                    });
                }
                delete global.db.market.lelang['BANK_SENTRAL'];
                fs.writeFileSync('./data/market.json', JSON.stringify(global.db.market, null, 2));
            }
        } catch (e) { console.log("[ERROR] Lelang Interval:", e); }
    }, 60000);

    // --- 📂 LOAD COMMANDS ---
    sock.commands = new Map();

    // Folder game/ekonomi bawaan + folder fitur baru
    const folders = [
        // Folder lama (sistem game & pemerintahan)
        'kemenkeu', 'kementan', 'kemenhan', 'kemendag', 'kemenesdm', 'panduan', 'presiden',
        // Folder baru (fitur umum)
        'utilities', // !stiker, !toimg, !hd, !qr, !ss, !vote, dll
        'moderasi',  // !tutup, !buka, !kick, !add, !tagall, !antilink
        'sosial',    // !intro, !absen, !hadir, !jodoh, !confess
        'ai',        // !ai, !wiki, !cuaca, !gempa, !translate, !rembg, !vn, dll
        'downloader',// !tt, !ytmp3, !ig, !fb, !pin, !twit
        'hiburan'    // !quotes, !pantun, !fakta, !joke, !memeindo
    ];

    for (const folder of folders) {
        const folderPath = path.join(__dirname, `commands/${folder}`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        fs.readdirSync(folderPath).filter(f => f.endsWith('.js')).forEach(file => {
            const modul = require(`./commands/${folder}/${file}`);

            // Dukung dua jenis ekspor:
            // 1. module.exports = { name, execute }  → satu command per file
            // 2. module.exports = [{ name, execute }, ...]  → banyak command per file
            const daftarCommand = Array.isArray(modul) ? modul : [modul];

            daftarCommand.forEach(command => {
                if (!command.name) return; // Lewati jika tidak ada nama
                sock.commands.set(command.name, command);

                // Daftarkan juga alias jika ada
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => sock.commands.set(alias, command));
                }
            });
        });
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) connectToWhatsApp();
        } else if (connection === 'open') { console.log('\n✅ Nexus Core Online!'); }
    });

    // --- 👥 EVENT ANGGOTA BARU MASUK (UNTUK PENGUMPULAN NIK) ---
    sock.ev.on('group-participants.update', async (anu) => {
        try {
            if (anu.action === 'add') {
                const session = global.db.nik?.session;
                if (session && session.active && session.groupId === anu.id) {
                    for (const participant of anu.participants) {
                        const realJid = participant;
                        const parsedNum = realJid.split('@')[0];

                        if (!global.db.nik.records[parsedNum]) {
                            if (!global.db.nik.pending.includes(realJid)) {
                                global.db.nik.pending.push(realJid);
                            }

                            try {
                                const templateTeks = `🔔 *PENGUMPULAN NIK REPUBLIK NEXUS* 🔔\n\nHalo! Anda baru saja bergabung di grup *${session.groupName}*.\n\nPresiden/Wapres sedang melakukan pengumpulan NIK guna melengkapi *data MBG Santri*. Mohon segera kirimkan NIK Anda melalui chat pribadi ini dengan format:\n*!nik |Nama Lengkap Sesuai KK| Nomor NIK*\n\nContoh:\n*!nik |Budi Santoso| 1234567890123456*\n\n_Pesan pengingat akan terus dikirim setiap 1 jam jika Anda belum menginputkan NIK._`;
                                await sock.sendMessage(realJid, { text: templateTeks });
                            } catch (err) {
                                console.error(`[NIK NEW MEMBER ERROR] Gagal mengirim PM ke ${realJid}:`, err);
                            }
                        }
                    }
                    fs.writeFileSync(path.join(process.cwd(), 'data/nik.json'), JSON.stringify(global.db.nik, null, 2));
                }
            }
        } catch (e) {
            console.error('[ERROR] group-participants.update:', e);
        }
    });

    // --- 🕒 SISTEM PENGINGAT NIK OTOMATIS (SETIAP 1 JAM) ---
    setInterval(async () => {
        try {
            if (!global.db.nik || !global.db.nik.session || !global.db.nik.session.active) return;
            const session = global.db.nik.session;
            const sekarang = Date.now();

            if (sekarang - (session.lastReminderAt || 0) >= 3600000) {
                const pendingUsers = global.db.nik.pending || [];
                if (pendingUsers.length > 0) {
                    console.log(`[NIK REMINDER] Mengirim pengingat ke ${pendingUsers.length} anggota...`);
                    for (const userJid of pendingUsers) {
                        try {
                            const templateTeks = `🔔 *PENGINGAT PENGUMPULAN NIK* 🔔\n\nHalo! Anda belum menginputkan NIK untuk grup *${session.groupName}* guna melengkapi *data MBG Santri*.\n\nMohon segera kirimkan NIK Anda dengan format:\n*!nik |Nama Lengkap Sesuai KK| Nomor NIK*\n\nContoh:\n*!nik |Budi Santoso| 1234567890123456*\n\n_Pesan ini akan terus dikirim setiap 1 jam jika Anda belum menginputkan NIK._`;
                            await sock.sendMessage(userJid, { text: templateTeks });
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (err) {
                            console.error(`[NIK REMINDER ERROR] Gagal mengirim ke ${userJid}:`, err);
                        }
                    }
                }
                session.lastReminderAt = sekarang;
                fs.writeFileSync(path.join(process.cwd(), 'data/nik.json'), JSON.stringify(global.db.nik, null, 2));
            }
        } catch (e) {
            console.error("[ERROR] NIK Reminder Interval:", e);
        }
    }, 60000);

    // --- 📨 PESAN MASUK ---
    sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // 1. DEFINISI VARIABEL
    const chatId = msg.key.remoteJid;
    const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];
    const teksPesan = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();
    const idPesanDibalas = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
    const replierId = senderNumber;

    // 2. SESI PENDAFTARAN (Diletakkan SEBELUM cek tanda "!")
    const { sesiPendaftaran, handleSession } = require('./commands/utilities/registrasi');
    
    if (sesiPendaftaran && sesiPendaftaran[senderNumber]) {
        console.log(`[DEBUG] User ${senderNumber} terdeteksi dalam sesi.`);
        return await handleSession(sock, msg, chatId, senderNumber, teksPesan);
    }

    // --- (Lanjutkan ke logika GAS / COMMAND HANDLER di bawahnya) ---

        // --- ⚔️ LOGIKA "GAS" (DUEL & KAWIN) ---
        if (teksPesan === 'gas' && idPesanDibalas) {
            
            // 0. COUPLE HANDLER
            if (global.db.proposalCouple?.[idPesanDibalas]) {
                const data = global.db.proposalCouple[idPesanDibalas];
                if (data.target === replierId) {
                    if (!global.db.player[data.pengaju]) global.db.player[data.pengaju] = { saldo: 0, reputasi: 0 };
                    if (!global.db.player[data.target]) global.db.player[data.target] = { saldo: 0, reputasi: 0 };

                    global.db.player[data.pengaju].pasangan = data.target;
                    global.db.player[data.target].pasangan = data.pengaju;

                    delete global.db.proposalCouple[idPesanDibalas];
                    fs.writeFileSync('./data/player.json', JSON.stringify(global.db.player, null, 2));

                    const tag1 = data.pengaju.length > 14 ? `${data.pengaju}@lid` : `${data.pengaju}@s.whatsapp.net`;
                    const tag2 = data.target.length > 14 ? `${data.target}@lid` : `${data.target}@s.whatsapp.net`;

                    return await sock.sendMessage(msg.key.remoteJid, { 
                        text: `🎉 *SAH! PASANGAN BARU!* 🎉\n\nSelamat untuk @${data.pengaju} dan @${data.target} yang kini resmi berpacaran!\nSemoga langgeng dan semangat kerjanya ya! 💕`,
                        mentions: [tag1, tag2]
                    });
                }
            }

            // 1. DUEL HANDLER
            if (global.db.tantanganDuel?.[idPesanDibalas]) {
                const data = global.db.tantanganDuel[idPesanDibalas];
                if (data.target === replierId) {
                    const p1 = data.penantang, p2 = data.target;
                    const pet1 = global.db.pet[p1].find(p => p.id == data.idPetPenantang);
                    const pet2 = global.db.pet[p2].find(p => p.id == data.idPetTarget);

                    if (!pet1 || !pet2) {
                        delete global.db.tantanganDuel[idPesanDibalas];
                        return await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Duel dibatalkan karena salah satu pet sudah tidak ada (terjual/hilang)!' }, { quoted: msg });
                    }

                    // Update 1 & 6: Power Calculation
                    const b1 = pet1.buff || 0, b2 = pet2.buff || 0;
                    const base1 = pet1.power + (pet1.level * 15) + b1;
                    const base2 = pet2.power + (pet2.level * 15) + b2;
                    const power1 = Math.floor(base1 * (0.9 + Math.random() * 0.2));
                    const power2 = Math.floor(base2 * (0.9 + Math.random() * 0.2));

                    let win, lose, winN, loseN;
                    if (power1 >= power2) { win = pet1; lose = pet2; winN = p1; loseN = p2; }
                    else { win = pet2; lose = pet1; winN = p2; loseN = p1; }

                    // MMR & Rewards
                    const mmrW = Math.floor(Math.random() * 10) + 20;
                    const mmrL = Math.floor(Math.random() * 5) + 10;
                    global.db.player[winN].mmr = (global.db.player[winN].mmr || 0) + mmrW;
                    global.db.player[loseN].mmr = Math.max(0, (global.db.player[loseN].mmr || 0) - mmrL);

                    if (global.db.player[loseN].saldo >= 500) {
                        global.db.player[loseN].saldo -= 500;
                        global.db.player[winN].saldo += 500;
                    }
                    win.xp += 50; if (win.xp >= 100) { win.level++; win.xp = 0; }
                    lose.kondisi = 'Sakit (Luka Fisik)'; lose.lapar = Math.max(0, lose.lapar - 30);
                    pet1.buff = 0; pet2.buff = 0; // Reset Buff

                    const tagW = winN.length > 14 ? `${winN}@lid` : `${winN}@s.whatsapp.net`;
                    const tagL = loseN.length > 14 ? `${loseN}@lid` : `${loseN}@s.whatsapp.net`;
                    
                    const teks = `⚔️ *RANKED MATCH SELESAI*\n\n🏆 Win: *${win.nama}* (@${winN}) [+${mmrW} MMR]\n💀 Lose: *${lose.nama}* (@${loseN}) [-${mmrL} MMR]`;
                    await sock.sendMessage(msg.key.remoteJid, { text: teks, mentions: [tagW, tagL] });
                    
                    delete global.db.tantanganDuel[idPesanDibalas];
                    fs.writeFileSync('./data/pet.json', JSON.stringify(global.db.pet, null, 2));
                    fs.writeFileSync('./data/player.json', JSON.stringify(global.db.player, null, 2));
                }
            }

            // 2. KAWIN HANDLER (UPDATE: TURUN 3 LEVEL)
            if (global.db.proposalKawin?.[idPesanDibalas]) {
                const data = global.db.proposalKawin[idPesanDibalas];
                if (data.target === replierId) {
                    const ortu1 = global.db.pet[data.pengaju].find(p => p.id == data.idPetPengaju);
                    const ortu2 = global.db.pet[data.target].find(p => p.id == data.idPetTarget);

                    if (!ortu1 || !ortu2) {
                        delete global.db.proposalKawin[idPesanDibalas];
                        return await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Pernikahan batal karena salah satu pet sudah tidak ada (terjual/hilang)!' }, { quoted: msg });
                    }

                    ortu1.level = Math.max(1, ortu1.level - 3);
                    ortu2.level = Math.max(1, ortu2.level - 3);
                    const babyPower = Math.floor((ortu1.power + ortu2.power) * 0.3) + 20;
                    const newId = `B${global.db.petBersama.length + 1}`;

                    global.db.petBersama.push({
                        id: newId, ortu1: data.pengaju, ortu2: data.target,
                        nama: `Bayi ${ortu1.spesies.trim()}`, spesies: ortu1.spesies,
                        diet: ortu1.diet, rarity: ortu1.rarity, level: 1, xp: 0,
                        health: 100, lapar: 100, kondisi: 'Sehat', power: babyPower, lastFeed: Date.now()
                    });

                    const tag1 = data.pengaju.length > 14 ? `${data.pengaju}@lid` : `${data.pengaju}@s.whatsapp.net`;
                    const tag2 = data.target.length > 14 ? `${data.target}@lid` : `${data.target}@s.whatsapp.net`;

                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: `🍼 *BAYI LAHIR!* Peliharaan @${data.pengaju} & @${data.target} punya anak (ID: ${newId}). Ortu turun 3 Level!`,
                        mentions: [tag1, tag2]
                    });

                    delete global.db.proposalKawin[idPesanDibalas];
                    fs.writeFileSync('./data/petBersama.json', JSON.stringify(global.db.petBersama, null, 2));
                    fs.writeFileSync('./data/pet.json', JSON.stringify(global.db.pet, null, 2));
                }
            }
        }

        // 4. COMMAND HANDLER (Logika !daftar, !nik, dll)
    const fullTeks = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
    if (!fullTeks.startsWith('!')) return;

    const args = fullTeks.slice(1).trim().split(/\s+/);
    let cmd = args.shift().toLowerCase();
    
    if (!sock.commands.has(cmd) && cmd.startsWith('nik')) cmd = 'nik';
    
    if (!global.db.player[senderNumber]) {
        global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        fs.writeFileSync('./data/player.json', JSON.stringify(global.db.player, null, 2));
    }

    if (sock.commands.has(cmd)) {
        // --- MIDDLEWARE & LOCKDOWN ---
        const { isPrivate } = require('./utils/middleware.js');
        if (isPrivate(msg) && cmd === 'kerja') {
            return await sock.sendMessage(chatId, { text: '⚠️ *PERINGATAN*... _Silakan gunakan di grup!_' }, { quoted: msg });
        }
        
        if (global.db.pemilu.status !== 'idle' && !['pemilu', 'nyaleg', 'coblos', 'saldo', 'ktp', 'nama'].includes(cmd)) {
            return await sock.sendMessage(chatId, { text: '🏛️ *HARI LIBUR NASIONAL!*' }, { quoted: msg });
        }

        try { 
            await sock.commands.get(cmd).execute(sock, msg, args); 
        } catch (e) { 
            console.error(`[ERROR] CMD ${cmd}:`, e); 
        }
    }
});

    const startWebServer = require('./server.js');
    startWebServer();
}

connectToWhatsApp();
