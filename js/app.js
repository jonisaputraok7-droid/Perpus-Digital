/* =========================================================================
   Perpustakaan Digital MTs N 1 Bandar Lampung - Main Javascript Logic
   ========================================================================= */

// --- Firebase Configuration (GANTI DENGAN PUNYA ANDA) ---
// Silakan buat proyek di console.firebase.google.com lalu salin config di sini
const firebaseConfig = {
    apiKey: "AIzaSyBTwic2vL3IPxf4l8BQQNt5CjMHXgcRmy4",
    authDomain: "perpusdigital-dc3fc.firebaseapp.com",
    databaseURL: "https://perpusdigital-dc3fc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perpusdigital-dc3fc",
    storageBucket: "perpusdigital-dc3fc.firebasestorage.app",
    messagingSenderId: "124694258088",
    appId: "1:124694258088:web:8c6fca7a368cf1545b3d9d",
    measurementId: "G-5FER2FVCJ8"
};

// Initialize Firebase
let db;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase script not found. Check index.html.");
    }
} catch (error) {
    console.error("Firebase failed to initialize:", error);
}

// --- Initial Mock Data for Demonstration ---
const initialData = {
    siswa: [
        { id: 1, nama: "Ahmad Faisal", kelas: "VII A" },
        { id: 2, nama: "Budi Santoso", kelas: "VII B" },
        { id: 3, nama: "Cindy Aurelia", kelas: "VIII A" },
        { id: 4, nama: "Dewi Lestari", kelas: "IX C" }
    ],
    buku: [
        { id: 1, judul: "Matematika Kelas VII", pengarang: "Kemdikbud", penerbit: "Erlangga", tahun: "2021" },
        { id: 2, judul: "Sejarah Kebudayaan Islam", pengarang: "Dr. H. Amin", penerbit: "Kemenag", tahun: "2020" },
        { id: 3, judul: "Bahasa Inggris - When English Rings a Bell", pengarang: "Siti Wachidah", penerbit: "Kemdikbud", tahun: "2017" }
    ],
    peminjaman: [
        { id: 1, siswaId: 1, bukuId: 1, jumlah: 1, tglPinjam: "2023-10-01", tglKembaliRencana: "2023-10-08", status: "Dipinjam" },
        { id: 2, siswaId: 3, bukuId: 2, jumlah: 1, tglPinjam: "2023-10-05", tglKembaliRencana: "2023-10-12", status: "Dikembalikan" }
    ],
    pengembalian: [
        { id: 1, transaksiId: 2, tglDikembalikan: "2023-10-10", jumlah: 1, statusKeterlambatan: "Tepat Waktu" }
    ],
    kunjungan: [
        { id: 1, namaSiswa: "Ahmad Faisal", kelas: "VII A", tujuan: "Membaca Buku", tanggal: "2023-10-01", waktu: "10:00" }
    ],
    settings: {
        appTitle: "Perpus Digital",
        schoolName: "MTs N 1 Bandar Lampung",
        address: "Jl. Letnan Jenderal Ryacudu, Bandar Lampung",
        website: "https://mtsn1bandarlampung.sch.id",
        headmaster: "Drs. H. Lukman Hakim",
        librarian: "Winarno, S.Pd",
        logo: "img/logo.png",
        banner: ""
    }
};

// --- State Management ---
let appData = JSON.parse(localStorage.getItem('perpusData')) || initialData;

// Sanitasi Data untuk mencegah nilai NaN yang merusak Firebase set()
function sanitizeData() {
    if (!appData) appData = {};
    if (!appData.siswa) appData.siswa = [];
    if (!appData.buku) appData.buku = [];
    if (!appData.peminjaman) appData.peminjaman = [];
    if (!appData.pengembalian) appData.pengembalian = [];
    if (!appData.kunjungan) appData.kunjungan = [];
    if (!appData.bukuInduk) appData.bukuInduk = [];
    if (!appData.settings) appData.settings = {};

    try {
        appData = JSON.parse(JSON.stringify(appData));
    } catch (e) {
        console.error("Sanitasi JSON gagal:", e);
    }

    if (!appData.siswa) appData.siswa = [];
    if (!appData.buku) appData.buku = [];
    if (!appData.peminjaman) appData.peminjaman = [];
    if (!appData.pengembalian) appData.pengembalian = [];
    if (!appData.kunjungan) appData.kunjungan = [];
    if (!appData.bukuInduk) appData.bukuInduk = [];
    if (!appData.settings) appData.settings = {};

    appData.siswa = appData.siswa.filter(s => s && s.id && !isNaN(s.id));
    appData.buku = appData.buku.filter(b => b && b.id && !isNaN(b.id));
    appData.peminjaman = appData.peminjaman.filter(p => p && p.id && !isNaN(p.id));
    appData.pengembalian = appData.pengembalian.filter(k => k && k.id && !isNaN(k.id));
    appData.kunjungan = appData.kunjungan.filter(k => k && k.id && !isNaN(k.id));
    appData.bukuInduk = appData.bukuInduk.filter(b => b && b.id && !isNaN(b.id));

    appData.peminjaman.forEach(p => {
        if (p.siswaId === null || isNaN(p.siswaId)) p.siswaId = (appData.siswa && appData.siswa[0]) ? appData.siswa[0].id : 1;
        if (p.bukuId === null || isNaN(p.bukuId)) p.bukuId = (appData.buku && appData.buku[0]) ? appData.buku[0].id : 1;
        if (p.jumlah === null || isNaN(p.jumlah)) p.jumlah = 1;
    });

    appData.pengembalian.forEach(k => {
        if (k.transaksiId === null || isNaN(k.transaksiId)) k.transaksiId = 1;
        if (k.jumlah === null || isNaN(k.jumlah)) k.jumlah = 1;
    });
}

// Jalankan sanitasi awal
sanitizeData();

// Sinkronisasi dengan Firebase (Real-time Sync)
if (db) {
    db.ref('perpusData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("Data diterima dari Firebase:", data);
            appData = data;
            sanitizeData();
            localStorage.setItem('perpusData', JSON.stringify(appData));

            // Re-render UI hanya jika sudah di-login atau halaman aktif
            if (sessionStorage.getItem('isLoggedIn')) {
                renderAll();
            }
        } else {
            console.log("Firebase kosong, mengirim data lokal ke server...");
            saveData(); // Push local data to server if server is empty
        }
    });
}

function saveData() {
    sanitizeData();
    localStorage.setItem('perpusData', JSON.stringify(appData));
    if (db) {
        db.ref('perpusData').set(appData)
            .catch(error => console.error("Gagal simpan ke Firebase:", error));
    }
}

// Helper untuk render semua komponen UI
function renderAll() {
    renderDashboard();
    renderSiswa();
    renderKunjungan();
    renderBuku();
    renderBukuInduk();
    renderPeminjaman();
    renderPengembalian();
    renderRekapan();
    renderSettings();
    applySettings();
    populateSelects();
    checkRoleVisibility();
    initReportFilters();
}

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginSiswaBtn = document.getElementById('login-siswa-btn');
const logoutBtn = document.getElementById('logout-btn');
const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.querySelector('.toggle-sidebar');
const navLinks = document.querySelectorAll('.nav-links a[data-target]');
const pageSections = document.querySelectorAll('.page-section');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        showApp();
    }

    // Init Data Rendering (Using helper)
    renderAll();
});

// --- Auth Handling ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Simple mock authentication
    if (user && pass) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'admin');
        showApp();
    }
});

loginSiswaBtn.addEventListener('click', () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', 'siswa');
    showApp();
});

function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    appView.style.display = 'none';
    loginView.style.display = 'flex';
    loginView.classList.add('active');
}

logoutBtn.addEventListener('click', handleLogout);

function showApp() {
    loginView.style.display = 'none';
    loginView.classList.remove('active');
    appView.style.display = 'flex';

    checkRoleVisibility();

    // Trigger chart resize if needed
    window.dispatchEvent(new Event('resize'));
}

function checkRoleVisibility() {
    const role = sessionStorage.getItem('userRole');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const siswaOnlyElements = document.querySelectorAll('.siswa-only');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');

    if (role === 'siswa') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
        siswaOnlyElements.forEach(el => el.style.display = 'flex');
        if (userNameEl) userNameEl.innerText = "Siswa Tamu";
        if (userRoleEl) userRoleEl.innerText = "Anggota";

        // Ensure student lands on dashboard or allowed page
        const activeLink = document.querySelector('.nav-links a.active');
        if (activeLink && activeLink.parentElement.classList.contains('admin-only')) {
            document.querySelector('.nav-links a[data-target="dashboard"]').click();
        }
    } else {
        adminOnlyElements.forEach(el => el.style.display = 'block');
        siswaOnlyElements.forEach(el => el.style.display = 'none');
        if (userNameEl) userNameEl.innerText = "Administrator";
        if (userRoleEl) userRoleEl.innerText = "Pustakawan";
    }
}

// --- Sidebar Navigation ---
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('close');
});

// Dropdown Toggling
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = toggle.parentElement;
        parent.classList.toggle('open');
    });
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active');

        // Hide all sections
        pageSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('active');
        });

        // Show target section
        const targetId = link.getAttribute('data-target');
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
            targetSec.style.display = 'block';
            
            // Small delay to allow transition
            setTimeout(() => {
                targetSec.classList.add('active');
            }, 50);
        }

        // Re-render specific views if needed
        if (targetId === 'dashboard') renderDashboard();
        if (targetId === 'rekapan') renderRekapan();
        if (targetId === 'pengaturan') renderSettings();
        if (targetId === 'kartu-anggota') renderKartuAnggota();
        if (targetId === 'laporan-harian') renderLaporanHarian();
        if (targetId === 'laporan-mingguan') renderLaporanMingguan();
        if (targetId === 'laporan-bulanan') renderLaporanBulanan();
        if (targetId === 'laporan-tahunan') renderLaporanTahunan();
    });
});


// --- Modal Handling ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Populate dynamic dropdowns before showing
    if (id === 'modal-peminjaman' || id === 'modal-pengembalian') {
        populateSelects();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function toggleKunjunganDetails(val) {
    const groupLaptop = document.getElementById('group-keperluan-laptop');
    const groupBaca = document.getElementById('group-membaca-buku');
    const groupLainnya = document.getElementById('group-deskripsi-lainnya');
    
    if (groupLaptop) groupLaptop.style.display = val === 'Menggunakan Laptop' ? 'block' : 'none';
    if (groupBaca) groupBaca.style.display = val === 'Membaca Buku' ? 'block' : 'none';
    if (groupLainnya) groupLainnya.style.display = val === 'Lainnya' ? 'block' : 'none';
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// --- Form Submissions (Tambah Manual) ---

// Tambah / Edit Siswa
document.getElementById('form-siswa').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-siswa-id').value;
    const nama = document.getElementById('siswa-nama').value;
    const kelas = document.getElementById('siswa-kelas').value;

    if (editId) {
        // Mode Edit
        const idx = appData.siswa.findIndex(s => s.id === parseInt(editId));
        if (idx !== -1) {
            appData.siswa[idx].nama = nama;
            appData.siswa[idx].kelas = kelas;
        }
    } else {
        // Mode Tambah
        appData.siswa.push({
            id: Date.now(),
            nama,
            kelas
        });
    }

    saveData();
    renderSiswa();
    populateSelects();
    closeModal('modal-siswa');
    e.target.reset();
    document.getElementById('edit-siswa-id').value = '';
    document.getElementById('modal-siswa-title').innerText = 'Tambah Data Siswa';
});

// Tambah Buku
document.getElementById('form-buku').addEventListener('submit', (e) => {
    e.preventDefault();
    appData.buku.push({
        id: Date.now(),
        judul: document.getElementById('buku-judul').value,
        pengarang: document.getElementById('buku-pengarang').value,
        penerbit: document.getElementById('buku-penerbit').value,
        tahun: document.getElementById('buku-tahun').value
    });

    saveData();
    renderBuku();
    closeModal('modal-buku');
    e.target.reset();
});

// Tambah / Edit Buku Induk
document.getElementById('form-buku-induk').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-buku-induk-id').value;
    const payload = {
        noInduk: document.getElementById('buku-induk-no').value,
        tglTerima: document.getElementById('buku-induk-tgl').value,
        judul: document.getElementById('buku-induk-judul').value,
        pengarang: document.getElementById('buku-induk-pengarang').value,
        penerbit: document.getElementById('buku-induk-penerbit').value,
        tahun: document.getElementById('buku-induk-tahun').value,
        asal: document.getElementById('buku-induk-asal').value,
        harga: document.getElementById('buku-induk-harga').value,
        keterangan: document.getElementById('buku-induk-keterangan').value
    };

    if (editId) {
        const idx = appData.bukuInduk.findIndex(b => b.id === parseInt(editId));
        if (idx !== -1) {
            appData.bukuInduk[idx] = { ...appData.bukuInduk[idx], ...payload };
        }
    } else {
        appData.bukuInduk.push({
            id: Date.now(),
            ...payload
        });
    }

    saveData();
    renderBukuInduk();
    closeModal('modal-buku-induk');
    e.target.reset();
    document.getElementById('edit-buku-induk-id').value = '';
    document.getElementById('modal-buku-induk-title').innerText = 'Tambah Buku Induk';
});

// Tambah/Update Peminjaman
document.getElementById('form-peminjaman').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const editId = document.getElementById('edit-pinjam-id').value;
        let siswaId = parseInt(document.getElementById('pinjam-siswa').value);
        const siswaManual = document.getElementById('pinjam-siswa-manual').value.trim();
        const kelasManual = document.getElementById('pinjam-kelas-manual').value.trim();

        let bukuId = parseInt(document.getElementById('pinjam-buku').value);
        const bukuManual = document.getElementById('pinjam-buku-manual').value.trim();

        // Validasi: Harus pilih siswa atau input manual
        if (!siswaId && !siswaManual) {
            alert('Silakan pilih siswa dari daftar atau input nama siswa manual.');
            return;
        }

        // Validasi: Harus pilih buku atau input manual
        if (!bukuId && !bukuManual) {
            alert('Silakan pilih buku dari daftar atau input judul buku manual.');
            return;
        }

        // Jika input manual siswa, tambahkan ke data siswa dulu
        if (!siswaId && siswaManual) {
            const newSiswa = {
                id: Date.now(),
                nama: siswaManual,
                kelas: kelasManual || "-"
            };
            appData.siswa.push(newSiswa);
            siswaId = newSiswa.id;
            renderSiswa(); // Update tabel siswa
            populateSelects(); // Update dropdowns
        }

        // Jika input manual buku, tambahkan ke data buku dulu
        if (!bukuId && bukuManual) {
            const newBuku = {
                id: Date.now() + 2, // prevent ID collision if both are added at the exact same millisecond
                judul: bukuManual,
                pengarang: document.getElementById('pinjam-pengarang-manual').value.trim() || "-",
                penerbit: document.getElementById('pinjam-penerbit-manual').value.trim() || "-",
                tahun: document.getElementById('pinjam-tahun-manual').value.trim() || "-"
            };
            appData.buku.push(newBuku);
            bukuId = newBuku.id;
            renderBuku(); // Update tabel buku
        }

        const payload = {
            siswaId: siswaId,
            bukuId: bukuId,
            jumlah: parseInt(document.getElementById('pinjam-jumlah').value),
            tglPinjam: document.getElementById('pinjam-tgl').value,
            tglKembaliRencana: document.getElementById('pinjam-kemb').value,
        };

        if (editId) {
            const idx = appData.peminjaman.findIndex(p => p.id === parseInt(editId));
            if (idx !== -1) {
                appData.peminjaman[idx] = { ...appData.peminjaman[idx], ...payload };
            }
        } else {
            appData.peminjaman.push({
                id: Date.now() + 1,
                ...payload,
                status: "Dipinjam"
            });
        }

        saveData();
        renderPeminjaman();
        renderDashboard();
        closeModal('modal-peminjaman');
        e.target.reset();
        document.getElementById('edit-pinjam-id').value = '';
    } catch (err) {
        console.error("Gagal simpan peminjaman:", err);
        alert("Gagal simpan peminjaman: " + err.message);
    }
});

// Tambah/Update Pengembalian
document.getElementById('form-pengembalian').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-kembali-id').value;
    const transId = parseInt(document.getElementById('kembali-transaksi').value);
    const tglBalik = document.getElementById('kembali-tgl').value;
    const jumlah = parseInt(document.getElementById('kembali-jumlah').value);

    // Find borrow record
    const pinjamIndex = appData.peminjaman.findIndex(p => p.id === transId);
    if (pinjamIndex === -1) {
        alert('Transaksi peminjaman tidak ditemukan.');
        return;
    }

    // Calculate lateness
    const tglRencana = new Date(appData.peminjaman[pinjamIndex].tglKembaliRencana);
    const tglAktual = new Date(tglBalik);
    const diffTime = tglAktual - tglRencana;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const statusKeterlambatan = diffDays > 0 ? `Terlambat ${diffDays} hari` : "Tepat Waktu";

    const payload = {
        transaksiId: transId,
        tglDikembalikan: tglBalik,
        jumlah: jumlah,
        statusKeterlambatan: statusKeterlambatan
    };

    if (editId) {
        const idx = appData.pengembalian.findIndex(k => k.id === parseInt(editId));
        if (idx !== -1) {
            appData.pengembalian[idx] = { ...appData.pengembalian[idx], ...payload };
        }
    } else {
        appData.peminjaman[pinjamIndex].status = "Dikembalikan";
        appData.pengembalian.push({
            id: Date.now(),
            ...payload
        });
    }

    saveData();
    renderPeminjaman();
    renderPengembalian();
    renderDashboard();
    closeModal('modal-pengembalian');
    e.target.reset();
    document.getElementById('edit-kembali-id').value = '';
});

// Tambah Kunjungan
document.getElementById('form-kunjungan').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const editId = document.getElementById('edit-kunjungan-id').value;
        let siswaId = parseInt(document.getElementById('kunjungan-siswa').value);
        const siswaManual = document.getElementById('kunjungan-siswa-manual').value.trim();
        const kelasManual = document.getElementById('kunjungan-kelas-manual').value.trim();

        if (!siswaId && !siswaManual) {
            alert('Silakan pilih siswa dari daftar atau input nama siswa manual.');
            return;
        }

        // Jika input manual siswa, wajib mengisi kelas manual
        if (!siswaId && siswaManual && !kelasManual) {
            alert('Silakan isi kelas untuk siswa manual.');
            return;
        }

        // Jika input manual siswa, tambahkan ke data siswa dulu
        if (!siswaId && siswaManual) {
            const newSiswa = {
                id: Date.now(),
                nama: siswaManual,
                kelas: kelasManual || "-"
            };
            appData.siswa.push(newSiswa);
            siswaId = newSiswa.id;
            renderSiswa(); // Update tabel siswa
            populateSelects(); // Update dropdowns
        }

        const tujuan = document.getElementById('kunjungan-tujuan').value;
        const keperluanLaptop = document.getElementById('kunjungan-keperluan-laptop').value;
        const deskripsiLaptop = document.getElementById('kunjungan-deskripsi-laptop').value.trim();
        const judulBuku = document.getElementById('kunjungan-judul-buku').value.trim();
        const manfaatBuku = document.getElementById('kunjungan-manfaat-buku').value.trim();
        const deskripsiLainnya = document.getElementById('kunjungan-deskripsi-lainnya').value.trim();
        const tanggal = document.getElementById('kunjungan-tgl').value;
        const waktu = document.getElementById('kunjungan-waktu').value;

        // Validasi tujuan kunjungan
        if (!tujuan) {
            alert('Silakan pilih tujuan kunjungan.');
            return;
        }

        // Validasi field wajib berdasarkan tujuan kunjungan
        if (tujuan === "Membaca Buku") {
            if (!judulBuku) {
                alert('Silakan isi judul buku yang dibaca.');
                return;
            }
            if (!manfaatBuku) {
                alert('Silakan isi manfaat / intisari buku.');
                return;
            }
        } else if (tujuan === "Menggunakan Laptop") {
            if (!keperluanLaptop) {
                alert('Silakan pilih keperluan menggunakan laptop.');
                return;
            }
            if (!deskripsiLaptop) {
                alert('Silakan isi deskripsi keperluan menggunakan laptop.');
                return;
            }
        } else if (tujuan === "Lainnya") {
            if (!deskripsiLainnya) {
                alert('Silakan isi deskripsi kunjungan.');
                return;
            }
        }

        // Tentukan detail tujuan
        let detailTujuan = "-";
        if (tujuan === "Menggunakan Laptop" && keperluanLaptop) {
            const displayKeperluan = `Keperluan: ${keperluanLaptop}`;
            const displayDeskripsi = deskripsiLaptop ? `Deskripsi: ${deskripsiLaptop}` : "";
            detailTujuan = [displayKeperluan, displayDeskripsi].filter(Boolean).join('<br>');
        } else if (tujuan === "Membaca Buku" && (judulBuku || manfaatBuku)) {
            const displayJudul = judulBuku ? `Judul: ${judulBuku}` : "";
            const displayManfaat = manfaatBuku ? `Manfaat: ${manfaatBuku}` : "";
            detailTujuan = [displayJudul, displayManfaat].filter(Boolean).join('<br>');
        } else if (tujuan === "Lainnya" && deskripsiLainnya) {
            detailTujuan = deskripsiLainnya;
        }

        const payload = {
            siswaId: siswaId,
            tujuan: tujuan,
            detailTujuan: detailTujuan,
            tanggal: tanggal,
            waktu: waktu
        };

        if (editId) {
            const idx = appData.kunjungan.findIndex(k => k.id === parseInt(editId));
            if (idx !== -1) {
                appData.kunjungan[idx] = { ...appData.kunjungan[idx], ...payload };
            }
        } else {
            appData.kunjungan.push({
                id: Date.now() + 1,
                ...payload
            });
        }

        saveData();
        renderKunjungan();
        closeModal('modal-kunjungan');
        e.target.reset();
        document.getElementById('edit-kunjungan-id').value = '';
    } catch (err) {
        console.error("Gagal simpan kunjungan:", err);
        alert("Gagal simpan kunjungan: " + err.message);
    }
});


// --- Rendering Functions ---

function getBuku(id) { return appData.buku.find(b => b.id === id) || {}; }
function getSiswa(id) { return appData.siswa.find(s => s.id === id) || {}; }

function renderSiswa() {
    const tbody = document.querySelector('#table-siswa tbody');
    tbody.innerHTML = '';
    appData.siswa.forEach((s, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${s.nama}</strong></td>
                <td><span class="badge badge-success">${s.kelas}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editSiswa(${s.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSiswa(${s.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteSiswa(id) {
    if (confirm('Yakin hapus siswa ini?')) {
        appData.siswa = appData.siswa.filter(s => s.id !== id);
        saveData();
        renderSiswa();
    }
}

function editSiswa(id) {
    const s = appData.siswa.find(item => item.id === id);
    if (s) {
        document.getElementById('edit-siswa-id').value = s.id;
        document.getElementById('siswa-nama').value = s.nama;
        document.getElementById('siswa-kelas').value = s.kelas;
        document.getElementById('modal-siswa-title').innerText = 'Edit Data Siswa';
        openModal('modal-siswa');
    }
}

function openModalSiswaTambah() {
    document.getElementById('edit-siswa-id').value = '';
    document.getElementById('form-siswa').reset();
    document.getElementById('modal-siswa-title').innerText = 'Tambah Data Siswa';
    openModal('modal-siswa');
}

function openModalBukuInduk() {
    document.getElementById('edit-buku-induk-id').value = '';
    document.getElementById('form-buku-induk').reset();
    document.getElementById('modal-buku-induk-title').innerText = 'Tambah Buku Induk';
    openModal('modal-buku-induk');
}

function renderKunjungan() {
    const tbody = document.querySelector('#table-kunjungan tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Sort descending by ID (newest first)
    const sortedKunjungan = [...appData.kunjungan].sort((a, b) => b.id - a.id);
    
    sortedKunjungan.forEach((k, idx) => {
        const siswa = getSiswa(k.siswaId);
        // Fallback for manual or missing class
        const displaySiswa = siswa.nama ? siswa.nama : "Tidak Diketahui";
        const displayKelas = siswa.kelas ? siswa.kelas : "-";
        
        const detailTujuan = k.detailTujuan ? k.detailTujuan : "-";
        const displayWaktuSelesai = k.waktuSelesai ? k.waktuSelesai : "-";
        
        let badgeClass = "badge-primary";
        if (k.tujuan.includes('Membaca')) badgeClass = "badge-success";
        else if (k.tujuan.includes('Laptop')) badgeClass = "badge-warning";

        let actionButtons = `
            <button class="btn btn-sm btn-outline" onclick="editKunjungan(${k.id})" title="Edit"><i class='bx bx-edit'></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteKunjungan(${k.id})" title="Hapus"><i class='bx bx-trash'></i></button>
        `;

        if ((k.tujuan.includes('Laptop') || k.tujuan.includes('Membaca') || k.tujuan === 'Lainnya') && !k.waktuSelesai) {
            actionButtons = `
                <button class="btn btn-sm btn-success" onclick="selesaiKunjungan(${k.id})" title="Tandai Selesai" style="margin-right:4px;"><i class='bx bx-check'></i> Selesai</button>
                ` + actionButtons;
        }
        
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${displaySiswa}</strong></td>
                <td>${displayKelas}</td>
                <td><span class="badge ${badgeClass}">${k.tujuan}</span></td>
                <td><small><i>${detailTujuan}</i></small></td>
                <td>${k.tanggal}</td>
                <td>${k.waktu}</td>
                <td><strong>${displayWaktuSelesai}</strong></td>
                <td>
                    ${actionButtons}
                </td>
            </tr>
        `;
    });
}

function editKunjungan(id) {
    const k = appData.kunjungan.find(item => item.id === id);
    if (k) {
        document.getElementById('edit-kunjungan-id').value = k.id;
        document.getElementById('kunjungan-siswa').value = k.siswaId;
        document.getElementById('kunjungan-tujuan').value = k.tujuan;
        document.getElementById('kunjungan-tgl').value = k.tanggal;
        document.getElementById('kunjungan-waktu').value = k.waktu;

        toggleKunjunganDetails(k.tujuan);

        // Reset details first
        document.getElementById('kunjungan-keperluan-laptop').value = '';
        document.getElementById('kunjungan-deskripsi-laptop').value = '';
        document.getElementById('kunjungan-judul-buku').value = '';
        document.getElementById('kunjungan-manfaat-buku').value = '';
        document.getElementById('kunjungan-deskripsi-lainnya').value = '';

        if (k.tujuan === 'Menggunakan Laptop' && k.detailTujuan && k.detailTujuan !== '-') {
            const parts = k.detailTujuan.split('<br>');
            parts.forEach(part => {
                if (part.startsWith('Keperluan: ')) {
                    document.getElementById('kunjungan-keperluan-laptop').value = part.replace('Keperluan: ', '');
                } else if (part.startsWith('Deskripsi: ')) {
                    document.getElementById('kunjungan-deskripsi-laptop').value = part.replace('Deskripsi: ', '');
                }
            });
        } else if (k.tujuan === 'Membaca Buku' && k.detailTujuan && k.detailTujuan !== '-') {
            // Parse out Judul and Manfaat from <br>
            const parts = k.detailTujuan.split('<br>');
            parts.forEach(part => {
                if (part.startsWith('Judul: ')) {
                    document.getElementById('kunjungan-judul-buku').value = part.replace('Judul: ', '');
                } else if (part.startsWith('Manfaat: ')) {
                    document.getElementById('kunjungan-manfaat-buku').value = part.replace('Manfaat: ', '');
                }
            });
        } else if (k.tujuan === 'Lainnya' && k.detailTujuan && k.detailTujuan !== '-') {
            document.getElementById('kunjungan-deskripsi-lainnya').value = k.detailTujuan;
        }

        openModal('modal-kunjungan');
    }
}

function selesaiKunjungan(id) {
    const k = appData.kunjungan.find(item => item.id === id);
    if (k) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        k.waktuSelesai = `${hours}:${minutes}`;
        saveData();
        renderKunjungan();
    }
}

function deleteKunjungan(id) {
    if (confirm('Yakin hapus data kunjungan ini?')) {
        appData.kunjungan = appData.kunjungan.filter(k => k.id !== id);
        saveData();
        renderKunjungan();
    }
}


function renderBuku() {
    const tbody = document.querySelector('#table-buku tbody');
    tbody.innerHTML = '';
    appData.buku.forEach((b, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${b.judul}</strong></td>
                <td>${b.pengarang}</td>
                <td>${b.penerbit}</td>
                <td>${b.tahun}</td>
                <td>
                    <button class="btn btn-sm btn-outline"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBuku(${b.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteBuku(id) {
    if (confirm('Yakin hapus buku ini?')) {
        appData.buku = appData.buku.filter(b => b.id !== id);
        saveData();
        renderBuku();
    }
}

function renderBukuInduk() {
    const tbody = document.querySelector('#table-buku-induk tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    appData.bukuInduk.forEach((b, idx) => {
        const hargaFormatted = b.harga ? "Rp " + parseInt(b.harga).toLocaleString('id-ID') : "-";
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${b.noInduk}</strong></td>
                <td>${b.tglTerima}</td>
                <td><strong>${b.judul}</strong></td>
                <td>${b.pengarang}</td>
                <td>${b.penerbit}</td>
                <td>${b.tahun}</td>
                <td>${b.asal}</td>
                <td>${hargaFormatted}</td>
                <td>${b.keterangan || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editBukuInduk(${b.id})" title="Edit"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBukuInduk(${b.id})" title="Hapus"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteBukuInduk(id) {
    if (confirm('Yakin hapus data buku induk ini?')) {
        appData.bukuInduk = appData.bukuInduk.filter(b => b.id !== id);
        saveData();
        renderBukuInduk();
    }
}

function editBukuInduk(id) {
    const b = appData.bukuInduk.find(item => item.id === id);
    if (b) {
        document.getElementById('edit-buku-induk-id').value = b.id;
        document.getElementById('buku-induk-no').value = b.noInduk;
        document.getElementById('buku-induk-tgl').value = b.tglTerima;
        document.getElementById('buku-induk-judul').value = b.judul;
        document.getElementById('buku-induk-pengarang').value = b.pengarang;
        document.getElementById('buku-induk-penerbit').value = b.penerbit;
        document.getElementById('buku-induk-tahun').value = b.tahun;
        document.getElementById('buku-induk-asal').value = b.asal;
        document.getElementById('buku-induk-harga').value = b.harga || 0;
        document.getElementById('buku-induk-keterangan').value = b.keterangan || '';
        document.getElementById('modal-buku-induk-title').innerText = 'Edit Buku Induk';
        openModal('modal-buku-induk');
    }
}

function renderPeminjaman() {
    const tbody = document.querySelector('#table-peminjaman tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const filterStatusEl = document.getElementById('filter-status-peminjaman');
    const filterStatus = filterStatusEl ? filterStatusEl.value : 'Semua';
    
    let filteredData = appData.peminjaman;
    if (filterStatus !== 'Semua') {
        filteredData = appData.peminjaman.filter(p => p.status === filterStatus);
    }

    filteredData.forEach((p, idx) => {
        const buku = getBuku(p.bukuId);
        const siswa = getSiswa(p.siswaId);
        const statusClass = p.status === 'Dipinjam' ? 'badge-warning' : 'badge-success';

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${siswa.nama} <br><small>(${siswa.kelas})</small></td>
                <td>${p.tglPinjam}</td>
                <td><strong>${buku.judul}</strong></td>
                <td>${buku.pengarang}</td>
                <td>${buku.penerbit}</td>
                <td>${buku.tahun}</td>
                <td>${p.jumlah}</td>
                <td>${p.tglKembaliRencana}</td>
                <td><span class="badge ${statusClass}">${p.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editPeminjaman(${p.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deletePeminjaman(${p.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function editPeminjaman(id) {
    const p = appData.peminjaman.find(item => item.id === id);
    if (p) {
        openModal('modal-peminjaman');
        document.getElementById('edit-pinjam-id').value = p.id;
        document.getElementById('pinjam-siswa').value = p.siswaId;
        document.getElementById('pinjam-buku').value = p.bukuId;
        document.getElementById('pinjam-jumlah').value = p.jumlah;
        document.getElementById('pinjam-tgl').value = p.tglPinjam;
        document.getElementById('pinjam-kemb').value = p.tglKembaliRencana;
        document.getElementById('pinjam-buku-manual').value = ''; // Reset manual input
        document.getElementById('pinjam-siswa-manual').value = ''; // Reset manual student input
        document.getElementById('pinjam-kelas-manual').value = ''; // Reset manual class input
    }
}

function deletePeminjaman(id) {
    if (confirm('Yakin hapus transaksi peminjaman ini?')) {
        appData.peminjaman = appData.peminjaman.filter(p => p.id !== id);
        // Also remove associated return if any
        appData.pengembalian = appData.pengembalian.filter(k => k.transaksiId !== id);
        saveData();
        renderPeminjaman();
        renderPengembalian();
        renderDashboard();
    }
}

function renderPengembalian() {
    const tbody = document.querySelector('#table-pengembalian tbody');
    tbody.innerHTML = '';
    appData.pengembalian.forEach((kembali, idx) => {
        // Get the associated borrow transaction
        const pinjam = appData.peminjaman.find(p => p.id === kembali.transaksiId);
        if (!pinjam) return;

        const buku = getBuku(pinjam.bukuId);
        const siswa = getSiswa(pinjam.siswaId);
        const statusClass = kembali.statusKeterlambatan === 'Tepat Waktu' ? 'badge-success' : 'badge-danger';

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${buku.judul}</strong></td>
                <td>${buku.pengarang}</td>
                <td>${buku.penerbit}</td>
                <td>${buku.tahun}</td>
                <td>${kembali.jumlah}</td>
                <td>${kembali.tglDikembalikan} <br> <span class="badge ${statusClass}">${kembali.statusKeterlambatan}</span></td>
                <td>${siswa.nama} <br><small>(${siswa.kelas})</small></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editPengembalian(${kembali.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deletePengembalian(${kembali.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function editPengembalian(id) {
    const k = appData.pengembalian.find(item => item.id === id);
    if (k) {
        // We need to allow picking from ALL borrows for editing, 
        // unlike adding which only shows active ones.
        populateSelects(true);

        openModal('modal-pengembalian');
        document.getElementById('edit-kembali-id').value = k.id;
        document.getElementById('kembali-transaksi').value = k.transaksiId;
        document.getElementById('kembali-tgl').value = k.tglDikembalikan;
        document.getElementById('kembali-jumlah').value = k.jumlah;
    }
}

function deletePengembalian(id) {
    if (confirm('Yakin hapus transaksi pengembalian ini?')) {
        const k = appData.pengembalian.find(item => item.id === id);
        if (k) {
            // Restore borrow status to "Dipinjam"
            const pIdx = appData.peminjaman.findIndex(p => p.id === k.transaksiId);
            if (pIdx !== -1) appData.peminjaman[pIdx].status = "Dipinjam";

            appData.pengembalian = appData.pengembalian.filter(item => item.id !== id);
            saveData();
            renderPeminjaman();
            renderPengembalian();
            renderDashboard();
        }
    }
}

function renderRekapan() {
    const tbody = document.querySelector('#table-rekapan tbody');
    const filterType = document.getElementById('filter-rekapan').value;
    tbody.innerHTML = '';

    // Advanced grouped logic
    let groupedData = {};

    appData.peminjaman.forEach(p => {
        const date = new Date(p.tglPinjam);
        const key = filterType === 'bulan' ?
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` :
            `${date.getFullYear()}`;

        if (!groupedData[key]) {
            groupedData[key] = { pinjam: 0, kembali: 0, bukuTerlaris: {} };
        }

        groupedData[key].pinjam += p.jumlah;
        groupedData[key].bukuTerlaris[p.bukuId] = (groupedData[key].bukuTerlaris[p.bukuId] || 0) + p.jumlah;
    });

    appData.pengembalian.forEach(k => {
        const date = new Date(k.tglDikembalikan);
        const key = filterType === 'bulan' ?
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` :
            `${date.getFullYear()}`;

        if (groupedData[key]) {
            groupedData[key].kembali += k.jumlah;
        }
    });

    // Sort keys descending
    const sortedKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach(period => {
        const d = groupedData[period];
        // find most popular book
        let topBookId = null;
        let maxVal = 0;
        for (const [bId, count] of Object.entries(d.bukuTerlaris)) {
            if (count > maxVal) { maxVal = count; topBookId = bId; }
        }
        const topBookName = topBookId ? getBuku(parseInt(topBookId)).judul : '-';
        const displayPeriod = filterType === 'bulan' ? formatBulan(period) : period;

        tbody.innerHTML += `
            <tr>
                <td><strong>${displayPeriod}</strong></td>
                <td><span class="badge badge-warning">${d.pinjam} Buku Dipinjam</span></td>
                <td><span class="badge badge-success">${d.kembali} Buku Dikembalikan</span></td>
                <td>${topBookName} <small>(${maxVal} kali)</small></td>
            </tr>
        `;
    });
}

function formatBulan(yyyyMm) {
    const [y, m] = yyyyMm.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return `${months[parseInt(m) - 1]} ${y}`;
}

// Re-render rekapan on filter change
document.getElementById('filter-rekapan').addEventListener('change', renderRekapan);

// --- Pengaturan Logic ---

function renderSettings() {
    const s = appData.settings;
    if (!s) return;

    document.getElementById('set-app-title').value = s.appTitle;
    document.getElementById('set-school-name').value = s.schoolName;
    document.getElementById('set-school-address').value = s.address;
    document.getElementById('set-school-web').value = s.website;
    document.getElementById('set-headmaster').value = s.headmaster;
    document.getElementById('set-librarian').value = s.librarian || "Winarno, S.Pd";
}

function applySettings() {
    const s = appData.settings;
    if (!s) return;

    // Apply Global Titles
    document.title = s.appTitle + " - " + s.schoolName;

    // Apply school names in UI
    document.querySelectorAll('.app-school-name').forEach(el => el.innerText = s.schoolName);
    document.querySelectorAll('.app-title-full').forEach(el => el.innerText = s.appTitle);
    document.querySelectorAll('.app-title-short').forEach(el => el.innerText = s.appTitle);

    // Apply images if exist
    if (s.logo) {
        document.querySelectorAll('.app-logo-img').forEach(img => img.src = s.logo);
    }

    if (s.banner) {
        document.getElementById('login-view').style.backgroundImage = `url(${s.banner})`;
        document.getElementById('login-view').style.backgroundSize = 'cover';
        document.getElementById('login-view').style.backgroundPosition = 'center';
    } else {
        document.getElementById('login-view').style.backgroundImage = 'none';
    }
}

// Handle Settings Form Submit
document.getElementById('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();

    appData.settings.appTitle = document.getElementById('set-app-title').value;
    appData.settings.schoolName = document.getElementById('set-school-name').value;
    appData.settings.address = document.getElementById('set-school-address').value;
    appData.settings.website = document.getElementById('set-school-web').value;
    appData.settings.headmaster = document.getElementById('set-headmaster').value;
    appData.settings.librarian = document.getElementById('set-librarian').value;

    saveData();
    applySettings();
    alert('Pengaturan berhasil disimpan!');
});

// Handle Image Uploads for settings
document.getElementById('set-logo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            appData.settings.logo = event.target.result;
            saveData();
            applySettings();
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('set-banner-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            appData.settings.banner = event.target.result;
            saveData();
            applySettings();
        };
        reader.readAsDataURL(file);
    }
});


function populateSelects(showAllTransactions = false) {
    // Populate Siswa Select
    const sSelect = document.getElementById('pinjam-siswa');
    const kSelect = document.getElementById('kunjungan-siswa');
    
    if (sSelect) {
        sSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
        appData.siswa.forEach(s => {
            sSelect.innerHTML += `<option value="${s.id}">${s.nama} (${s.kelas})</option>`;
        });
    }

    if (kSelect) {
        kSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
        appData.siswa.forEach(s => {
            kSelect.innerHTML += `<option value="${s.id}">${s.nama} (${s.kelas})</option>`;
        });
    }

    // Populate Buku Select
    const bSelect = document.getElementById('pinjam-buku');
    if (bSelect) {
        bSelect.innerHTML = '<option value="">-- Pilih Buku --</option>';
        appData.buku.forEach(b => {
            bSelect.innerHTML += `<option value="${b.id}">${b.judul}</option>`;
        });
    }

    // Populate Transaksi Select for Pengembalian
    const tSelect = document.getElementById('kembali-transaksi');
    if (tSelect) {
        tSelect.innerHTML = '<option value="">-- Pilih Transaksi --</option>';
        const filterFn = showAllTransactions ? () => true : p => p.status === 'Dipinjam';

        appData.peminjaman.filter(filterFn).forEach(p => {
            const b = getBuku(p.bukuId);
            const s = getSiswa(p.siswaId);
            tSelect.innerHTML += `<option value="${p.id}">${b.judul} - ${s.nama} (${p.tglPinjam})</option>`;
        });
    }
}

// --- Dashboard & Chart.js ---
let peminjamanChart;

function renderDashboard() {
    // 1. Update top stats
    document.getElementById('stat-total-buku').innerText = appData.buku.length;
    document.getElementById('stat-total-siswa').innerText = appData.siswa.length;

    const activeBorrows = appData.peminjaman.filter(p => p.status === 'Dipinjam');
    document.getElementById('stat-dipinjam').innerText = activeBorrows.length;

    const lates = appData.pengembalian.filter(k => k.statusKeterlambatan !== 'Tepat Waktu').length;
    document.getElementById('stat-terlambat').innerText = lates;

    // 2. Render Chart
    const ctx = document.getElementById('peminjamanChart').getContext('2d');

    // Aggregate real data by month for the current year
    const currentYear = new Date().getFullYear();
    const monthlyData = new Array(12).fill(0);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    appData.peminjaman.forEach(p => {
        const d = new Date(p.tglPinjam);
        if (d.getFullYear() === currentYear) {
            monthlyData[d.getMonth()] += p.jumlah;
        }
    });

    if (peminjamanChart) {
        peminjamanChart.destroy();
    }

    peminjamanChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Jumlah Buku Dipinjam',
                data: monthlyData,
                backgroundColor: 'rgba(13, 138, 188, 0.7)',
                borderColor: '#0D8ABC',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Pinjaman: ${context.parsed.y} Buku`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
}

// --- Utility Functions (Export/Print) ---

function downloadExcel(tableId, filename) {
    const table = document.getElementById(tableId);

    // Create a new workbook and add the table as a worksheet
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });

    // Write and download the Excel file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function printTable(tableId, title) {
    const s = appData.settings;
    const tableHtml = document.getElementById(tableId).outerHTML;
    const printArea = document.getElementById('print-area');

    // Branding Header
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';

    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">${title}</h2>
        </div>
        <div class="print-body">
            ${tableHtml.replace('id="' + tableId + '"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;

    window.print();
}

// --- Excel Import & Templates ---

function downloadTemplateSiswa() {
    const header = [["Nama Siswa", "Kelas"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
}

function downloadTemplateBuku() {
    const header = [["Judul Buku", "Nama Pengarang", "Nama Penerbit", "Tahun Terbit"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, "Template Buku");
    XLSX.writeFile(wb, "Template_Data_Buku.xlsx");
}

function handleUploadSiswa(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

        // Skip header row and process data
        let addedCount = 0;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length >= 2) {
                appData.siswa.push({
                    id: Date.now() + i, // prevent duplicate IDs during fast loop
                    nama: rows[i][0] || "",
                    kelas: rows[i][1] || ""
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            saveData();
            renderSiswa();
            populateSelects();
            renderDashboard();
            alert(`Berhasil mengimpor ${addedCount} data siswa.`);
        } else {
            alert('Format file kosong atau tidak sesuai.');
        }

        // Reset input
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function handleUploadBuku(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

        // Skip header row and process data
        let addedCount = 0;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length >= 4) {
                appData.buku.push({
                    id: Date.now() + i,
                    judul: rows[i][0] || "",
                    pengarang: rows[i][1] || "",
                    penerbit: rows[i][2] || "",
                    tahun: rows[i][3] || ""
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            saveData();
            renderBuku();
            populateSelects();
            renderDashboard();
            alert(`Berhasil mengimpor ${addedCount} data buku.`);
        } else {
            alert('Format file kosong atau tidak sesuai.');
        }

        // Reset input
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// Attach upload handlers to hidden inputs when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const inputUploadSiswa = document.getElementById('upload-siswa-input');
    if (inputUploadSiswa) {
        inputUploadSiswa.addEventListener('change', handleUploadSiswa);
    }

    const inputUploadBuku = document.getElementById('upload-buku-input');
    if (inputUploadBuku) {
        inputUploadBuku.addEventListener('change', handleUploadBuku);
    }
});
// --- Kartu Anggota Logic ---

function renderKartuAnggota() {
    const tbody = document.querySelector('#table-kartu tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    appData.siswa.forEach((s, idx) => {
        const cardHTML = generateCardHTML(s);
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${s.nama}</strong></td>
                <td><span class="badge badge-success">${s.kelas}</span></td>
                <td>
                    <div class="card-preview-container">
                        ${cardHTML}
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="printMemberCard(${s.id})">
                        <i class='bx bx-printer'></i> Cetak
                    </button>
                </td>
            </tr>
        `;
    });
}

function generateCardHTML(siswa) {
    const s = appData.settings;
    const logoSrc = s.logo || 'https://via.placeholder.com/40';

    return `
        <div class="member-card">
            <div class="card-header">
                <img src="${logoSrc}" class="card-logo" alt="Logo">
                <div class="card-header-text">
                    <h2>KARTU ANGGOTA PERPUSTAKAAN</h2>
                    <p>${s.schoolName}</p>
                </div>
            </div>
            <div class="card-body">
                <div class="card-photo">
                    <i class='bx bx-user'></i>
                </div>
                <div class="card-info">
                    <div class="info-row">
                        <span class="info-label">Nama Lengkap</span>
                        <span class="info-value">: ${siswa.nama}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Kelas</span>
                        <span class="info-value">: ${siswa.kelas}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status Anggota</span>
                        <span class="info-value">: Anggota Aktif</span>
                    </div>
                </div>
            </div>
            <div class="card-footer" style="min-height: 15px;"></div>
        </div>
    `;
}

function printMemberCard(id) {
    const siswa = appData.siswa.find(s => s.id === id);
    if (!siswa) return;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = `<div class="print-card-wrapper">${generateCardHTML(siswa)}</div>`;
    window.print();
}

function printAllCards() {
    const printArea = document.getElementById('print-area');
    let allCards = '';

    appData.siswa.forEach(s => {
        allCards += `<div class="print-card-wrapper">${generateCardHTML(s)}</div>`;
    });

    printArea.innerHTML = allCards;
    window.print();
}

// Update navLinks event listener to include kartu-anggota
const originalNavListener = () => {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            if (targetId === 'kartu-anggota') renderKartuAnggota();
        });
    });
};

// --- LOGIKA FILTER DAN DETAIL LAPORAN (HARIAN, MINGGUAN, BULANAN, TAHUNAN) ---

function initReportFilters() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Set daily filter default to today
    const filterHarianTanggal = document.getElementById('filter-harian-tanggal');
    if (filterHarianTanggal && !filterHarianTanggal.value) {
        filterHarianTanggal.value = todayStr;
    }
    
    // Set weekly filter default to today
    const filterMingguanTanggal = document.getElementById('filter-mingguan-tanggal');
    if (filterMingguanTanggal && !filterMingguanTanggal.value) {
        filterMingguanTanggal.value = todayStr;
    }
    
    // Populate month & year options for monthly/yearly reports
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const curDate = new Date();
    const curMonth = curDate.getMonth(); // 0-11
    const curYear = curDate.getFullYear();
    
    const mSelect = document.getElementById('filter-bulanan-bulan');
    if (mSelect && mSelect.options.length === 0) {
        months.forEach((m, idx) => {
            const opt = document.createElement('option');
            opt.value = idx + 1; // 1-indexed
            opt.text = m;
            if (idx === curMonth) opt.selected = true;
            mSelect.appendChild(opt);
        });
    }
    
    // Populate years: dynamically get all unique years from transactions, default to current year and surrounding
    const years = new Set();
    years.add(curYear);
    years.add(curYear - 1);
    years.add(curYear + 1);
    
    appData.peminjaman.forEach(p => {
        if (p.tglPinjam) years.add(new Date(p.tglPinjam).getFullYear());
    });
    appData.kunjungan.forEach(k => {
        if (k.tanggal) years.add(new Date(k.tanggal).getFullYear());
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a); // descending
    
    const ySelectMonthly = document.getElementById('filter-bulanan-tahun');
    if (ySelectMonthly && ySelectMonthly.options.length === 0) {
        sortedYears.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.text = y;
            if (y === curYear) opt.selected = true;
            ySelectMonthly.appendChild(opt);
        });
    }
    
    const ySelectYearly = document.getElementById('filter-tahunan-tahun');
    if (ySelectYearly && ySelectYearly.options.length === 0) {
        sortedYears.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.text = y;
            if (y === curYear) opt.selected = true;
            ySelectYearly.appendChild(opt);
        });
    }
}

// 1. LAPORAN HARIAN
function renderLaporanHarian() {
    initReportFilters();
    const dateInput = document.getElementById('filter-harian-tanggal').value;
    if (!dateInput) return;
    
    // Filter Kunjungan
    const dailyKunjungan = appData.kunjungan.filter(k => k.tanggal === dateInput);
    document.getElementById('rep-harian-kunjungan').innerText = dailyKunjungan.length;
    
    // Filter Peminjaman
    const dailyPeminjaman = appData.peminjaman.filter(p => p.tglPinjam === dateInput);
    const sumPeminjamanBuku = dailyPeminjaman.reduce((sum, p) => sum + (p.jumlah || 0), 0);
    document.getElementById('rep-harian-peminjaman').innerText = sumPeminjamanBuku;
    
    // Filter Pengembalian
    const dailyPengembalian = appData.pengembalian.filter(k => k.tglDikembalikan === dateInput);
    const sumPengembalianBuku = dailyPengembalian.reduce((sum, k) => sum + (k.jumlah || 0), 0);
    document.getElementById('rep-harian-pengembalian').innerText = sumPengembalianBuku;
    
    // Render Kunjungan Table
    const kunBody = document.querySelector('#table-laporan-harian-kunjungan tbody');
    kunBody.innerHTML = '';
    if (dailyKunjungan.length === 0) {
        kunBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Tidak ada data kunjungan pada hari ini.</td></tr>';
    } else {
        dailyKunjungan.forEach((k, idx) => {
            const siswa = getSiswa(k.siswaId);
            kunBody.innerHTML += `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${siswa.nama || 'Siswa Manual/Lainnya'}</strong></td>
                    <td>${siswa.kelas || '-'}</td>
                    <td><span class="badge ${k.tujuan.includes('Membaca') ? 'badge-success' : 'badge-warning'}">${k.tujuan}</span></td>
                    <td><small>${k.detailTujuan || '-'}</small></td>
                    <td>${k.waktu || '-'}</td>
                    <td><strong>${k.waktuSelesai || '-'}</strong></td>
                </tr>
            `;
        });
    }
    
    // Render Transaksi Table
    const trBody = document.querySelector('#table-laporan-harian-transaksi tbody');
    trBody.innerHTML = '';
    
    const dailyLogs = [];
    dailyPeminjaman.forEach(p => {
        const siswa = getSiswa(p.siswaId);
        const buku = getBuku(p.bukuId);
        dailyLogs.push({
            type: 'Pinjam',
            siswa: siswa.nama || 'Siswa Manual/Lainnya',
            kelas: siswa.kelas || '-',
            buku: buku.judul || '-',
            jumlah: p.jumlah,
            detail: `Tenggat: ${p.tglKembaliRencana}`
        });
    });
    
    dailyPengembalian.forEach(k => {
        const pinjam = appData.peminjaman.find(p => p.id === k.transaksiId) || {};
        const siswa = getSiswa(pinjam.siswaId);
        const buku = getBuku(pinjam.bukuId);
        dailyLogs.push({
            type: 'Kembali',
            siswa: siswa.nama || 'Siswa Manual/Lainnya',
            kelas: siswa.kelas || '-',
            buku: buku.judul || '-',
            jumlah: k.jumlah,
            detail: k.statusKeterlambatan || 'Tepat Waktu'
        });
    });
    
    if (dailyLogs.length === 0) {
        trBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Tidak ada transaksi peminjaman/pengembalian hari ini.</td></tr>';
    } else {
        dailyLogs.forEach((log, idx) => {
            const typeBadge = log.type === 'Pinjam' ? 
                '<span class="badge badge-warning">Peminjaman</span>' : 
                '<span class="badge badge-success">Pengembalian</span>';
            trBody.innerHTML += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${typeBadge}</td>
                    <td><strong>${log.siswa}</strong></td>
                    <td>${log.kelas}</td>
                    <td>${log.buku}</td>
                    <td>${log.jumlah}</td>
                    <td><small><i>${log.detail}</i></small></td>
                </tr>
            `;
        });
    }
}

// 2. LAPORAN MINGGUAN
let weeklyChart;
function renderLaporanMingguan() {
    initReportFilters();
    const dateVal = document.getElementById('filter-mingguan-tanggal').value;
    if (!dateVal) return;
    
    const baseDate = new Date(dateVal);
    const day = baseDate.getDay();
    const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(baseDate.setDate(diffToMonday));
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
    
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];
    
    document.getElementById('filter-mingguan-range').innerText = `Rentang Minggu: ${formatDateIndo(mondayStr)} s/d ${formatDateIndo(sundayStr)}`;
    
    const weekDaysName = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const datesOfWeek = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        datesOfWeek.push(d.toISOString().split('T')[0]);
    }
    
    let totalKunjungan = 0;
    let totalPeminjaman = 0;
    let totalPengembalian = 0;
    
    const chartLabels = [];
    const kunData = [];
    const pinjamData = [];
    const kembaliData = [];
    
    const tbody = document.querySelector('#table-laporan-mingguan tbody');
    tbody.innerHTML = '';
    
    datesOfWeek.forEach((dateStr, idx) => {
        const dayKunjungan = appData.kunjungan.filter(k => k.tanggal === dateStr).length;
        const dayPeminjaman = appData.peminjaman.filter(p => p.tglPinjam === dateStr).length;
        const dayPengembalian = appData.pengembalian.filter(k => k.tglDikembalikan === dateStr).reduce((s, k) => s + (k.jumlah || 0), 0);
        
        totalKunjungan += dayKunjungan;
        totalPeminjaman += dayPeminjaman;
        totalPengembalian += dayPengembalian;
        
        const dayLabel = `${weekDaysName[idx]} (${dateStr.split('-')[2]})`;
        chartLabels.push(dayLabel);
        kunData.push(dayKunjungan);
        pinjamData.push(dayPeminjaman);
        kembaliData.push(dayPengembalian);
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${weekDaysName[idx]}, ${formatDateIndo(dateStr)}</strong></td>
                <td><span class="badge badge-primary">${dayKunjungan} Kunjungan</span></td>
                <td><span class="badge badge-warning">${dayPeminjaman} Transaksi</span></td>
                <td><span class="badge badge-success">${dayPengembalian} Buku Kembali</span></td>
                <td><small><i>${dayKunjungan || dayPeminjaman || dayPengembalian ? 'Aktivitas Tercatat' : 'Tidak Ada Aktivitas'}</i></small></td>
            </tr>
        `;
    });
    
    document.getElementById('rep-mingguan-kunjungan').innerText = totalKunjungan;
    document.getElementById('rep-mingguan-peminjaman').innerText = totalPeminjaman;
    document.getElementById('rep-mingguan-pengembalian').innerText = totalPengembalian;
    
    const ctx = document.getElementById('laporanMingguanChart').getContext('2d');
    if (weeklyChart) weeklyChart.destroy();
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Kunjungan',
                    data: kunData,
                    backgroundColor: 'rgba(13, 138, 188, 0.7)',
                    borderColor: '#0D8ABC',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Peminjaman',
                    data: pinjamData,
                    backgroundColor: 'rgba(242, 153, 74, 0.7)',
                    borderColor: '#F2994A',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Pengembalian',
                    data: kembaliData,
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderColor: '#27AE60',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 }
                }
            }
        }
    });
}

// 3. LAPORAN BULANAN
function renderLaporanBulanan() {
    initReportFilters();
    const month = parseInt(document.getElementById('filter-bulanan-bulan').value);
    const year = parseInt(document.getElementById('filter-bulanan-tahun').value);
    if (!month || !year) return;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let totalKunjungan = 0;
    let totalPeminjaman = 0;
    let totalPeminjamanBuku = 0;
    let totalPengembalian = 0;
    const popularBooks = {};
    
    const tbody = document.querySelector('#table-laporan-bulanan tbody');
    tbody.innerHTML = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayKunjungan = appData.kunjungan.filter(k => k.tanggal === dateStr);
        const dayPeminjaman = appData.peminjaman.filter(p => p.tglPinjam === dateStr);
        const dayPeminjamanBuku = dayPeminjaman.reduce((sum, p) => sum + (p.jumlah || 0), 0);
        const dayPengembalian = appData.pengembalian.filter(k => k.tglDikembalikan === dateStr);
        const dayPengembalianBuku = dayPengembalian.reduce((sum, k) => sum + (k.jumlah || 0), 0);
        
        totalKunjungan += dayKunjungan.length;
        totalPeminjaman += dayPeminjaman.length;
        totalPeminjamanBuku += dayPeminjamanBuku;
        totalPengembalian += dayPengembalianBuku;
        
        dayPeminjaman.forEach(p => {
            popularBooks[p.bukuId] = (popularBooks[p.bukuId] || 0) + (p.jumlah || 0);
        });
        
        if (dayKunjungan.length > 0 || dayPeminjaman.length > 0 || dayPengembalianBuku > 0) {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${day} ${formatBulanIndo(month)} ${year}</strong></td>
                    <td><span class="badge badge-primary">${dayKunjungan.length} Kunjungan</span></td>
                    <td>${dayPeminjaman.length} Transaksi</td>
                    <td><span class="badge badge-warning">${dayPeminjamanBuku} Buku</span></td>
                    <td><span class="badge badge-success">${dayPengembalianBuku} Buku</span></td>
                    <td><small><i>${dayKunjungan.length > 5 ? 'Aktivitas Tinggi' : 'Tren Stabil'}</i></small></td>
                </tr>
            `;
        }
    }
    
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Tidak ada aktivitas perpustakaan pada bulan ini.</td></tr>';
    }
    
    let topBookId = null;
    let maxBorrow = 0;
    for (const [bId, count] of Object.entries(popularBooks)) {
        if (count > maxBorrow) {
            maxBorrow = count;
            topBookId = parseInt(bId);
        }
    }
    const topBookName = topBookId ? getBuku(topBookId).judul : '-';
    
    document.getElementById('rep-bulanan-kunjungan').innerText = totalKunjungan;
    document.getElementById('rep-bulanan-peminjaman').innerText = totalPeminjamanBuku;
    document.getElementById('rep-bulanan-pengembalian').innerText = totalPengembalian;
    document.getElementById('rep-bulanan-terpopuler').innerText = topBookName;
    document.getElementById('rep-bulanan-terpopuler').title = topBookName;
}

// 4. LAPORAN TAHUNAN
function renderLaporanTahunan() {
    initReportFilters();
    const year = parseInt(document.getElementById('filter-tahunan-tahun').value);
    if (!year) return;
    
    let totalKunjungan = 0;
    let totalPeminjaman = 0;
    let totalPengembalian = 0;
    const popularBooks = {};
    const monthsName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const tbody = document.querySelector('#table-laporan-tahunan tbody');
    tbody.innerHTML = '';
    
    monthsName.forEach((mName, mIdx) => {
        const monthNum = mIdx + 1;
        let mKunjungan = 0;
        let mPeminjaman = 0;
        let mPeminjamanBuku = 0;
        let mPengembalian = 0;
        const mPopularBooks = {};
        
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayKunjungan = appData.kunjungan.filter(k => k.tanggal === dateStr).length;
            const dayPeminjaman = appData.peminjaman.filter(p => p.tglPinjam === dateStr);
            const dayPeminjamanBuku = dayPeminjaman.reduce((sum, p) => sum + (p.jumlah || 0), 0);
            const dayPengembalianBuku = appData.pengembalian.filter(k => k.tglDikembalikan === dateStr).reduce((sum, k) => sum + (k.jumlah || 0), 0);
            
            mKunjungan += dayKunjungan;
            mPeminjaman += dayPeminjaman.length;
            mPeminjamanBuku += dayPeminjamanBuku;
            mPengembalian += dayPengembalianBuku;
            
            dayPeminjaman.forEach(p => {
                popularBooks[p.bukuId] = (popularBooks[p.bukuId] || 0) + (p.jumlah || 0);
                mPopularBooks[p.bukuId] = (mPopularBooks[p.bukuId] || 0) + (p.jumlah || 0);
            });
        }
        
        totalKunjungan += mKunjungan;
        totalPeminjaman += mPeminjamanBuku;
        totalPengembalian += mPengembalian;
        
        let mTopBookId = null;
        let mMaxBorrow = 0;
        for (const [bId, count] of Object.entries(mPopularBooks)) {
            if (count > mMaxBorrow) { mMaxBorrow = count; mTopBookId = parseInt(bId); }
        }
        const mTopBookName = mTopBookId ? getBuku(mTopBookId).judul : '-';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${mName} ${year}</strong></td>
                <td><span class="badge badge-primary">${mKunjungan} Kunjungan</span></td>
                <td>${mPeminjaman} Transaksi (${mPeminjamanBuku} Buku)</td>
                <td><span class="badge badge-success">${mPengembalian} Buku</span></td>
                <td>${mTopBookName} ${mMaxBorrow ? `<small>(${mMaxBorrow} kali)</small>` : ''}</td>
            </tr>
        `;
    });
    
    let topBookId = null;
    let maxBorrow = 0;
    for (const [bId, count] of Object.entries(popularBooks)) {
        if (count > maxBorrow) {
            maxBorrow = count;
            topBookId = parseInt(bId);
        }
    }
    const topBookName = topBookId ? getBuku(topBookId).judul : '-';
    
    document.getElementById('rep-tahunan-kunjungan').innerText = totalKunjungan;
    document.getElementById('rep-tahunan-peminjaman').innerText = totalPeminjaman;
    document.getElementById('rep-tahunan-pengembalian').innerText = totalPengembalian;
    document.getElementById('rep-tahunan-terpopuler').innerText = topBookName;
    document.getElementById('rep-tahunan-terpopuler').title = topBookName;
}

// --- UTILITY DATE HELPERS ---
function formatDateIndo(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function formatBulanIndo(mIdx) {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[mIdx - 1] || '';
}

// --- CETAK LAPORAN DENGAN KOP SURAT RESMI ---

function printLaporanHarian() {
    const s = appData.settings;
    const dateInput = document.getElementById('filter-harian-tanggal').value;
    const printArea = document.getElementById('print-area');
    
    const tableKunHtml = document.getElementById('table-laporan-harian-kunjungan').outerHTML;
    const tableTrHtml = document.getElementById('table-laporan-harian-transaksi').outerHTML;
    
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';
    
    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">LAPORAN HARIAN PERPUSTAKAAN</h2>
            <p style="text-align: center; margin-bottom: 20px;"><strong>Tanggal: ${formatDateIndo(dateInput)}</strong></p>
        </div>
        <div class="print-body">
            <h3>A. Daftar Pengunjung Harian</h3>
            ${tableKunHtml.replace('id="table-laporan-harian-kunjungan"', 'class="print-table"')}
            
            <h3 style="margin-top: 30px;">B. Transaksi Peminjaman & Pengembalian Harian</h3>
            ${tableTrHtml.replace('id="table-laporan-harian-transaksi"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

function printLaporanMingguan() {
    const s = appData.settings;
    const dateInput = document.getElementById('filter-mingguan-tanggal').value;
    const tableHtml = document.getElementById('table-laporan-mingguan').outerHTML;
    const printArea = document.getElementById('print-area');
    
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';
    
    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">LAPORAN MINGGUAN PERPUSTAKAAN</h2>
            <p style="text-align: center; margin-bottom: 20px;"><strong>Tanggal Acuan: ${formatDateIndo(dateInput)}</strong></p>
        </div>
        <div class="print-body">
            ${tableHtml.replace('id="table-laporan-mingguan"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

function printLaporanBulanan() {
    const s = appData.settings;
    const m = document.getElementById('filter-bulanan-bulan').value;
    const y = document.getElementById('filter-bulanan-tahun').value;
    const tableHtml = document.getElementById('table-laporan-bulanan').outerHTML;
    const printArea = document.getElementById('print-area');
    
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';
    
    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">LAPORAN BULANAN PERPUSTAKAAN</h2>
            <p style="text-align: center; margin-bottom: 20px;"><strong>Periode: ${formatBulanIndo(parseInt(m))} ${y}</strong></p>
        </div>
        <div class="print-body">
            ${tableHtml.replace('id="table-laporan-bulanan"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

function printLaporanTahunan() {
    const s = appData.settings;
    const y = document.getElementById('filter-tahunan-tahun').value;
    const tableHtml = document.getElementById('table-laporan-tahunan').outerHTML;
    const printArea = document.getElementById('print-area');
    
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';
    
    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">LAPORAN TAHUNAN PERPUSTAKAAN</h2>
            <p style="text-align: center; margin-bottom: 20px;"><strong>Tahun: ${y}</strong></p>
        </div>
        <div class="print-body">
            ${tableHtml.replace('id="table-laporan-tahunan"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

// --- EXPORT KE EXCEL ---

function exportLaporanHarianExcel() {
    const dateInput = document.getElementById('filter-harian-tanggal').value;
    downloadExcel('table-laporan-harian-kunjungan', `Laporan_Harian_Kunjungan_${dateInput}`);
}

function exportLaporanMingguanExcel() {
    const dateInput = document.getElementById('filter-mingguan-tanggal').value;
    downloadExcel('table-laporan-mingguan', `Laporan_Mingguan_${dateInput}`);
}

function exportLaporanBulananExcel() {
    const m = document.getElementById('filter-bulanan-bulan').value;
    const y = document.getElementById('filter-bulanan-tahun').value;
    downloadExcel('table-laporan-bulanan', `Laporan_Bulanan_${y}_${m}`);
}

function exportLaporanTahunanExcel() {
    const y = document.getElementById('filter-tahunan-tahun').value;
    downloadExcel('table-laporan-tahunan', `Laporan_Tahunan_${y}`);
}


// Since we cannot easily modify the existing listener without full replacement,
// let's add an additional check in the render logic if possible or monkey-patch.
// Better: Add the check to the existing navLinks.forEach block in app.js.
