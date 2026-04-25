const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 🛡️ AUTO-SEED PASAR INDUK 🛡️ ---
const defaultPasarInduk = {
    karnivora: {
        daging_ayam: { nama: "Daging Ayam Brolier", modal: 50, efek: "+20 Kenyang", tipe: "makanan" },
        daging_sapi: { nama: "Daging Sapi Premium", modal: 120, efek: "+50 Kenyang", tipe: "makanan" },
        tulang_iga: { nama: "Tulang Iga Segar", modal: 80, efek: "+30 Kenyang", tipe: "makanan" },
        sosis_daging: { nama: "Sosis Daging Olahan", modal: 30, efek: "+10 Kenyang", tipe: "makanan" }
    },
    herbivora: {
        gandum: { nama: "Gandum Kering", modal: 25, efek: "+15 Kenyang", tipe: "makanan" },
        wortel: { nama: "Wortel Segar", modal: 40, efek: "+25 Kenyang", tipe: "makanan" },
        apel: { nama: "Apel Merah Manis", modal: 60, efek: "+35 Kenyang", tipe: "makanan" },
        rumput_sultan: { nama: "Rumput Sultan Berkualitas", modal: 100, efek: "+50 Kenyang", tipe: "makanan" }
    },
    pescivora: {
        ikan_kecil: { nama: "Ikan Teri Air Tawar", modal: 30, efek: "+15 Kenyang", tipe: "makanan" },
        ikan_salmon: { nama: "Ikan Salmon Samudra", modal: 150, efek: "+60 Kenyang", tipe: "makanan" },
        udang: { nama: "Udang Kupas", modal: 70, efek: "+30 Kenyang", tipe: "makanan" },
        cumi: { nama: "Cumi-cumi Mentah", modal: 90, efek: "+40 Kenyang", tipe: "makanan" }
    },
    mythical: {
        kristal_mana: { nama: "Kristal Mana Biru", modal: 500, efek: "+100 Kenyang & Energi", tipe: "makanan" },
        buah_surga: { nama: "Buah Eden", modal: 800, efek: "+100 Kenyang & +10 XP", tipe: "makanan" },
        elixir_murni: { nama: "Tetesan Elixir Murni", modal: 1200, efek: "Kenyang Max & Imunitas", tipe: "makanan" }
    },
    apotek: {
        pil_ringan: { nama: "Pil Ringan", modal: 150, kegunaan: "Menyembuhkan sakit pencernaan", tipe: "obat" },
        perban: { nama: "Perban Steril", modal: 100, kegunaan: "Memulihkan luka luar akibat PvP", tipe: "obat" },
        vitamin: { nama: "Vitamin Booster", modal: 250, kegunaan: "Meningkatkan imunitas", tipe: "obat" },
        antibiotik: { nama: "Antibiotik Dosis Tinggi", modal: 450, kegunaan: "Menyembuhkan sakit keras", tipe: "obat" },
        salep_luka: { nama: "Salep Luka Ajaib", modal: 300, kegunaan: "Memulihkan HP pet", tipe: "obat" }
    }
};

// --- ROUTING HALAMAN DASHBOARD (GET) ---
app.get('/dashboard', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).send('<h1>Akses Ditolak</h1>');

    if (!global.db.market.pasarInduk || Object.keys(global.db.market.pasarInduk).length === 0) {
        global.db.market.pasarInduk = defaultPasarInduk;
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
    }

    let dataToko = null;
    let nomorPemilik = null;

    for (const [nomor, data] of Object.entries(global.db.market.tokoPemain)) {
        if (data.tokenWeb === token) {
            dataToko = data;
            nomorPemilik = nomor;
            break;
        }
    }

    if (!dataToko) return res.status(404).send('<h1>Toko Tidak Ditemukan</h1>');

    const saldoPemilik = global.db.player[nomorPemilik]?.saldo || 0;
    const pasarIndukAman = global.db.market.pasarInduk || defaultPasarInduk;

    // LOOP UNTUK SEMUA KATEGORI
    let kartuBarang = '';
    for (const [kategoriNama, kategoriBarang] of Object.entries(pasarIndukAman)) {
        kartuBarang += `<div class="section-title" style="margin-top:25px; color:var(--primary-dark); text-transform:uppercase; border-bottom: 2px solid var(--border); padding-bottom:5px;">📦 Kategori: ${kategoriNama.replace('_', ' ')}</div>`;
        
        for (const [idBarang, info] of Object.entries(kategoriBarang)) {
            const stokSekarang = dataToko.etalase[idBarang]?.stok || 0;
            const hargaJual = dataToko.etalase[idBarang]?.harga || (info.modal + 20); 

            kartuBarang += `
                <div class="card">
                    <div class="card-header">
                        <div class="item-info">
                            <h3>${info.nama}</h3>
                            <p>${info.kegunaan || info.efek}</p>
                        </div>
                        <div class="stok-badge">📦 ${stokSekarang}</div>
                    </div>
                    <div class="modal-info">Modal Grosir: <span>${info.modal} 💠</span></div>
                    <div class="input-grid">
                        <div class="input-group">
                            <label>Beli Stok Baru</label>
                            <input type="number" class="input-form" id="kulak_${idBarang}" min="0" value="0">
                        </div>
                        <div class="input-group">
                            <label>Set Harga Jual</label>
                            <input type="number" class="input-form" id="harga_${idBarang}" min="${info.modal}" value="${hargaJual}">
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // TAMPILAN HTML DENGAN CSS LENGKAP
    const htmlTampilan = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Nexus Market</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            
            :root {
                --primary: #3b82f6; --primary-dark: #2563eb;
                --bg: #f8fafc; --card-bg: #ffffff;
                --text: #1e293b; --text-muted: #64748b;
                --success: #10b981; --border: #e2e8f0;
            }

            body { 
                font-family: 'Plus Jakarta Sans', sans-serif; 
                background-color: var(--bg); margin: 0; padding: 0; 
                color: var(--text); padding-bottom: 90px;
            }

            .top-nav {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                padding: 25px 20px 40px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;
                color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
            .shop-title { margin: 0 0 5px 0; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px;}
            .shop-cat { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;}
            
            .kas-card {
                background: white; border-radius: 16px; margin: -25px 20px 20px;
                padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .kas-card div p { margin: 0; font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;}
            .kas-card div h2 { margin: 0; font-size: 20px; color: var(--success); }
            
            .content { padding: 0 20px; }
            .section-title { font-size: 16px; margin-bottom: 15px; font-weight: 700;}
            
            .card {
                background: var(--card-bg); border-radius: 16px; padding: 16px;
                margin-bottom: 16px; border: 1px solid var(--border);
                box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;}
            .item-info h3 { margin: 0 0 4px 0; font-size: 15px; color: var(--text); }
            .item-info p { margin: 0; font-size: 11px; color: var(--text-muted); line-height: 1.4; }
            .stok-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;}
            
            .modal-info { font-size: 12px; color: #ef4444; font-weight: 600; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--border);}
            .modal-info span { font-size: 14px; }

            .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .input-group label { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
            .input-form { 
                width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid var(--border); 
                border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 600; text-align: center;
                transition: border 0.2s; -webkit-appearance: none;
            }
            .input-form:focus { border-color: var(--primary); outline: none; }

            .bottom-bar {
                position: fixed; bottom: 0; left: 0; right: 0; background: white;
                padding: 15px 20px; border-top: 1px solid var(--border);
                box-shadow: 0 -4px 15px rgba(0,0,0,0.05); z-index: 100;
            }
            .btn-save {
                background: var(--primary); color: white; border: none; width: 100%;
                padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700;
                display: flex; justify-content: center; align-items: center; gap: 8px;
                box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); cursor: pointer;
            }
            .btn-save:active { transform: scale(0.98); }
        </style>
    </head>
    <body>
        
        <div class="top-nav">
            <h1 class="shop-title">🏪 ${dataToko.nama}</h1>
            <span class="shop-cat">Toko Serba Ada</span>
        </div>

        <div class="kas-card">
            <div>
                <p>Uang Kas</p>
                <h2>${saldoPemilik.toLocaleString('id-ID')} 💠</h2>
            </div>
            <div style="text-align: right;">
                <p>Status</p>
                <span style="color:var(--text); font-weight:700; font-size:14px;">Buka ✅</span>
            </div>
        </div>

        <div class="content">
            ${kartuBarang}
        </div>

        <div class="bottom-bar">
            <button class="btn-save" onclick="simpanPerubahan()">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Simpan & Update
            </button>
        </div>

        <script>
            function simpanPerubahan() {
                const inputs = document.querySelectorAll('.input-form');
                let dataUpdate = {};
                
                inputs.forEach(input => {
                    const parts = input.id.split('_'); 
                    const aksi = parts.shift();
                    const idBarang = parts.join('_');

                    if (!dataUpdate[idBarang]) dataUpdate[idBarang] = {};
                    dataUpdate[idBarang][aksi] = parseInt(input.value) || 0;
                });

                const btn = document.querySelector('.btn-save');
                btn.innerHTML = '⏳ Menyimpan...';
                btn.style.opacity = '0.7';

                fetch('/api/update-toko', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: '${token}', data: dataUpdate })
                })
                .then(res => res.json())
                .then(res => {
                    if(res.sukses) {
                        alert(res.pesan);
                        window.location.reload(); 
                    } else {
                        alert('⚠️ Gagal: ' + res.pesan);
                        btn.innerHTML = 'Simpan & Update';
                        btn.style.opacity = '1';
                    }
                });
            }
        </script>
    </body>
    </html>
    `;

    res.send(htmlTampilan);
});

// --- API UNTUK MENYIMPAN PERUBAHAN (POST) ---
app.post('/api/update-toko', (req, res) => {
    const { token, data } = req.body;

    let nomorPemilik = null;
    let dataToko = null;

    for (const [nomor, toko] of Object.entries(global.db.market.tokoPemain)) {
        if (toko.tokenWeb === token) {
            nomorPemilik = nomor;
            dataToko = toko;
            break;
        }
    }

    if (!dataToko) return res.json({ sukses: false, pesan: "Token tidak valid" });

    const pasarIndukAman = global.db.market.pasarInduk || defaultPasarInduk;
    
    // Gabungkan seluruh kategori di pasar induk menjadi satu referensi
    let semuaBarangInduk = {};
    for (const kat in pasarIndukAman) { 
        Object.assign(semuaBarangInduk, pasarIndukAman[kat]); 
    }

    let totalBiayaKulak = 0;
    for (const idBarang in data) {
        if (data[idBarang].kulak > 0 && semuaBarangInduk[idBarang]) {
            totalBiayaKulak += data[idBarang].kulak * semuaBarangInduk[idBarang].modal;
        }
    }

    if (global.db.player[nomorPemilik].saldo < totalBiayaKulak) {
        return res.json({ sukses: false, pesan: `Uang kas tidak cukup! Butuh ${totalBiayaKulak} 💠` });
    }

    global.db.player[nomorPemilik].saldo -= totalBiayaKulak;
    global.db.bank.brankas += totalBiayaKulak;

    for (const idBarang in data) {
        const itemMarket = semuaBarangInduk[idBarang];
        if (!itemMarket) continue;

        if (!dataToko.etalase[idBarang]) {
            dataToko.etalase[idBarang] = { stok: 0, harga: itemMarket.modal };
        }

        dataToko.etalase[idBarang].stok += data[idBarang].kulak;
        
        const hargaSet = data[idBarang].harga;
        dataToko.etalase[idBarang].harga = hargaSet < itemMarket.modal ? itemMarket.modal : hargaSet;
    }

    fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

    res.json({ sukses: true, pesan: "Toko berhasil diupdate dan kulakan berhasil!" });
});

// --- ROUTING HALAMAN PANDUAN (INTERAKTIF & PREMIUM) ---
app.get('/panduan', (req, res) => {
    const htmlPanduan = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>Buku Panduan Nexus Pet</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            
            :root {
                --bg-app: #f4f7fb;
                --surface: #ffffff;
                --primary: #4F46E5; /* Indigo Modern */
                --primary-light: #EEF2FF;
                --text-main: #111827;
                --text-sec: #6B7280;
                --border: rgba(0, 0, 0, 0.05);
                --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.06);
            }

            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            
            body { 
                font-family: 'Plus Jakarta Sans', sans-serif; 
                background-color: var(--bg-app); 
                margin: 0; padding: 0; 
                color: var(--text-main); 
                padding-bottom: calc(90px + env(safe-area-inset-bottom)); 
            }

            /* Header - Glassmorphism */
            .app-header {
                position: sticky; top: 0; z-index: 50;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                padding: 20px; border-bottom: 1px solid var(--border);
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .app-header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
            .header-icon { font-size: 20px; }

            .container { padding: 20px; }

            /* Tab System */
            .tab-content { display: none; animation: slideFade 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .tab-content.active { display: block; }
            
            @keyframes slideFade { 
                from { opacity: 0; transform: translateY(15px); } 
                to { opacity: 1; transform: translateY(0); } 
            }

            /* Section Banner */
            .section-banner {
                background: linear-gradient(135deg, var(--primary), #818CF8);
                border-radius: 20px; padding: 20px; color: white;
                margin-bottom: 24px; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
            }
            .section-banner h2 { margin: 0 0 5px 0; font-size: 22px; font-weight: 800; }
            .section-banner p { margin: 0; font-size: 13px; opacity: 0.9; line-height: 1.5; }

            /* Modern Card */
            .card {
                background: var(--surface); border-radius: 20px;
                padding: 20px; margin-bottom: 16px;
                box-shadow: var(--shadow-soft); border: 1px solid #F3F4F6;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .card:active { transform: scale(0.98); box-shadow: 0 5px 15px rgba(0,0,0,0.04); }
            
            .cmd-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
            .icon-box {
                width: 44px; height: 44px; border-radius: 14px;
                background: var(--primary-light); color: var(--primary);
                display: flex; align-items: center; justify-content: center; 
                font-size: 22px; flex-shrink: 0;
            }
            .cmd-tags { display: flex; gap: 6px; flex-wrap: wrap; }
            .cmd-tag {
                background: #1F2937; color: white; padding: 5px 12px;
                border-radius: 10px; font-family: 'Courier New', monospace; 
                font-size: 13px; font-weight: 700; letter-spacing: 0.5px;
            }
            .cmd-tag.secondary { background: #E5E7EB; color: #374151; }
            
            .card p { color: var(--text-sec); font-size: 14px; line-height: 1.6; margin: 0; font-weight: 500; }
            .card p b { color: var(--text-main); font-weight: 700; }

            /* Bottom Navigation - Native App Style */
            .bottom-nav {
                position: fixed; bottom: 0; left: 0; right: 0;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border-top: 1px solid var(--border);
                display: flex; justify-content: space-around; 
                padding: 12px 10px calc(12px + env(safe-area-inset-bottom)) 10px;
                z-index: 100;
            }
            .nav-item {
                background: none; border: none; padding: 8px;
                display: flex; flex-direction: column; align-items: center; gap: 6px;
                font-family: inherit; font-size: 11px; font-weight: 700; color: #9CA3AF;
                cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                width: 25%; position: relative;
            }
            .nav-icon { font-size: 22px; transition: transform 0.3s; filter: grayscale(100%) opacity(0.6); }
            
            .nav-item.active { color: var(--primary); }
            .nav-item.active .nav-icon { 
                filter: grayscale(0%) opacity(1); 
                transform: translateY(-4px) scale(1.1); 
            }
            
            /* Active Indicator Dot */
            .nav-item::after {
                content: ''; position: absolute; bottom: -4px;
                width: 4px; height: 4px; border-radius: 50%;
                background: var(--primary); opacity: 0;
                transition: opacity 0.3s, transform 0.3s;
                transform: scale(0);
            }
            .nav-item.active::after { opacity: 1; transform: scale(1); }

        </style>
    </head>
    <body>

        <header class="app-header">
            <span class="header-icon">📖</span>
            <h1>Panduan Nexus</h1>
        </header>

        <div class="container">
            <div id="tab-dasar" class="tab-content active">
                <div class="section-banner">
                    <h2>Dasar Bermain</h2>
                    <p>Mulai perjalananmu, kumpulkan modal, dan pelihara hewan pertamamu di dunia Nexus.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🛠️</div>
                        <div class="cmd-tags"><span class="cmd-tag">!kerja</span></div>
                    </div>
                    <p>Bekerja menyelesaikan soal matematika atau acak kata untuk mendapatkan uang (💠). Pemain yang memiliki <b>pasangan</b> akan mendapat bonus gaji rahasia!</p>
                </div>
                
                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🏪</div>
                        <div class="cmd-tags"><span class="cmd-tag">!tokohewan</span></div>
                    </div>
                    <p>Pusat adopsi hewan. Beli kandang pertama dan pilih peliharaan awalmu (Kelinci, Kucing, atau Ayam).</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🍖</div>
                        <div class="cmd-tags"><span class="cmd-tag">!feed</span></div>
                    </div>
                    <p>Beri makan agar pet tidak mati kelaparan. Gunakan format: <br><b>!feed [ID_Pet] [Nama Makanan]</b>.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🏹</div>
                        <div class="cmd-tags"><span class="cmd-tag">!berburu</span></div>
                    </div>
                    <p>Kirim peliharaanmu berburu ke alam liar. Pet yang berhasil akan membawa pulang EXP level dan harta karun.</p>
                </div>
            </div>

            <div id="tab-ekonomi" class="tab-content">
                <div class="section-banner" style="background: linear-gradient(135deg, #10B981, #059669);">
                    <h2>Sistem Keuangan</h2>
                    <p>Kelola aset, pinjaman bank, dan likuiditas uang Nexus milikmu.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🏦</div>
                        <div class="cmd-tags"><span class="cmd-tag">!pinjam</span></div>
                    </div>
                    <p>Meminjam uang dari Bank Sentral. Limit pinjaman dibatasi oleh <b>Skor Reputasi</b>. Bunga sangat rendah, hanya 5%!</p>
                </div>

                <div class="card">
    <div class="cmd-header">
        <div class="icon-box">💸</div>
        <div class="cmd-tags"><span class="cmd-tag">!transfer</span></div>
    </div>
    <p>Kirim uang Nexus ke pemain lain di dalam grup. Format: <br><b>!transfer @tag [nominal]</b>.</p>
</div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">💳</div>
                        <div class="cmd-tags"><span class="cmd-tag">!bayarutang</span></div>
                    </div>
                    <p>Melunasi tagihan kredit ke Bank. Kamu harus melunasi <b>minimal 50%</b> dari total utang awal untuk bisa mengambil pinjaman baru.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🤝</div>
                        <div class="cmd-tags"><span class="cmd-tag">!jualpet</span></div>
                    </div>
                    <p>Butuh uang cepat? Jual peliharaanmu ke Bank Sentral seharga <b>50% modal awal + (Level x 100)</b>.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">💰</div>
                        <div class="cmd-tags"><span class="cmd-tag">!saldo</span></div>
                    </div>
                    <p>Cek isi brankas dompet, reputasi, dan sisa limit kredit yang tersedia.</p>
                </div>
            </div>

            <div id="tab-battle" class="tab-content">
                <div class="section-banner" style="background: linear-gradient(135deg, #EF4444, #B91C1C);">
                    <h2>Arena Pertarungan</h2>
                    <p>Uji kekuatan peliharaanmu, tempa senjata, dan kalahkan monster Raid!</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">⚔️</div>
                        <div class="cmd-tags"><span class="cmd-tag">!duelpet</span></div>
                    </div>
                    <p>Tantang pet pemain lain. Format: <b>!duelpet @tag [ID_Mu] [ID_Lawan]</b>. Lawan harus membalas pesan bot dengan kata "gas".</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">👹</div>
                        <div class="cmd-tags"><span class="cmd-tag">!boss</span> <span class="cmd-tag secondary">!serangboss</span></div>
                    </div>
                    <p>Cek info monster dengan <b>!boss</b>. Kirim pet terkuatmu dengan <b>!serangboss</b> untuk menyumbang damage (Cooldown 3 menit). Dapatkan hadiah Nexus besar jika boss kalah!</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">⚒️</div>
                        <div class="cmd-tags"><span class="cmd-tag">!tokogear</span></div>
                    </div>
                    <p>Toko perlengkapan khusus. Beli <b>Senjata</b> (+Damage PvP/Raid) atau <b>Armor</b> (+Max HP) untuk memperkuat pet.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🛡️</div>
                        <div class="cmd-tags"><span class="cmd-tag">!pakai</span></div>
                    </div>
                    <p>Pasang senjata/armor yang sudah dibeli ke peliharaan. Format: <br><b>!pakai [ID_Pet] [ID_Item_Gear]</b>.</p>
                </div>
            </div>

            <div id="tab-pasar" class="tab-content">
                <div class="section-banner" style="background: linear-gradient(135deg, #F59E0B, #D97706);">
                    <h2>Bisnis & Sosial</h2>
                    <p>Monopoli perdagangan grup, ikuti lelang, atau cari pasangan hidup.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">📢</div>
                        <div class="cmd-tags"><span class="cmd-tag">!lelang</span> <span class="cmd-tag secondary">!bid</span></div>
                    </div>
                    <p>Lisensi Toko Serba Ada akan dirilis setiap ada 10 pemain baru. Rebut lisensinya dengan <b>!bid BANK_SENTRAL [nominal]</b>.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">🛒</div>
                        <div class="cmd-tags"><span class="cmd-tag">!beli</span></div>
                    </div>
                    <p>Beli kebutuhan dari pemain yang memegang Lisensi Toko. Format: <br><b>!beli @PemilikToko [Jumlah] [Nama Barang]</b>.</p>
                </div>

                <div class="card">
                    <div class="cmd-header">
                        <div class="icon-box">💕</div>
                        <div class="cmd-tags"><span class="cmd-tag">!couple</span> <span class="cmd-tag secondary">!kawin</span></div>
                    </div>
                    <p>Gunakan <b>!couple @tag</b> untuk pacaran dengan pemain lain. Gunakan <b>!kawin</b> untuk menyilangkan pet milikmu dengan pet pemain lain untuk menghasilkan keturunan.</p>
                </div>
            </div>
        </div>

        <nav class="bottom-nav">
            <button class="nav-item active" onclick="switchTab('dasar', this)">
                <span class="nav-icon">🏠</span> Dasar
            </button>
            <button class="nav-item" onclick="switchTab('ekonomi', this)">
                <span class="nav-icon">💰</span> Ekonomi
            </button>
            <button class="nav-item" onclick="switchTab('battle', this)">
                <span class="nav-icon">⚔️</span> Battle
            </button>
            <button class="nav-item" onclick="switchTab('pasar', this)">
                <span class="nav-icon">🏪</span> Pasar
            </button>
        </nav>

        <script>
            function switchTab(tabId, element) {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.nav-item').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                document.getElementById('tab-' + tabId).classList.add('active');
                element.classList.add('active');
                
                // Animasi haptic feedback tipuan (membuat web terasa responsif)
                if (navigator.vibrate) navigator.vibrate(50);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        </script>
    </body>
    </html>
    `;
    res.send(htmlPanduan);
});

function startWebServer() {
    app.listen(port, () => {
        console.log(`[WEB SERVER] Dashboard Toko online di https://d687-180-241-241-59.ngrok-free.app`);
    });
}

module.exports = startWebServer;