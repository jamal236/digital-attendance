// =====================================================
// DIGITAL ATTENDANCE
// SCRIPT.JS
// =====================================================


// ===============================
// DATA MAHASISWA SEMENTARA
// ===============================

let mahasiswa = [];


// ===============================
// GOOGLE SHEET
// ===============================

const LINK_SHEET =
    "https://docs.google.com/spreadsheets/d/11tIbv7YAJeg41v9dxwNY2izZPNG3JtA7TrM9QTG4i6Y/edit";

const API_URL =
    "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec";

    // ===============================
// AMBIL DATA MAHASISWA DARI SHEET
// ===============================

function loadMahasiswa() {

    const callbackName =
        "mahasiswaCallback_" + Date.now();

    const script =
        document.createElement("script");

    window[callbackName] = function(data) {

        console.log(
            "DATA DARI GOOGLE SHEET:",
            data
        );

        mahasiswa = data.map(function(m) {

            return {
                nim: String(m.nim),
                nama: m.nama,
                kelas: String(m.kelas),
                jurusan: m.jurusan,
                status: m.status
            };

        });

        console.log(
            "DATA MAHASISWA:",
            mahasiswa
        );

        tampilkanDaftarMahasiswa();

        delete window[callbackName];

        script.remove();
    };

    script.src =
        API_URL +
        "?callback=" +
        callbackName;

    script.onerror = function() {

        console.error(
            "Gagal mengambil data mahasiswa."
        );

        alert(
            "Gagal mengambil data mahasiswa dari Google Sheet."
        );

        delete window[callbackName];

        script.remove();
    };

    document.body.appendChild(script);
}
// ===============================
// ELEMENT
// ===============================

const nimInput =
    document.getElementById("nim");

const qrContainer =
    document.getElementById("studentQRCode");

const studentInfo =
    document.getElementById("studentInfo");

const qrResult =
    document.getElementById("studentQRResult");


// ===============================
// GENERATE QR
// ===============================

function generateQR() {

    const nim = nimInput.value.trim();


    // Cek input kosong

    if (nim === "") {

        alert("Silakan masukkan NIM mahasiswa.");

        return;
    }


    // Cari mahasiswa

    const dataMahasiswa =
        mahasiswa.find(
            student => student.nim === nim
        );


    // NIM tidak ditemukan

    if (!dataMahasiswa) {

        alert("NIM tidak terdaftar.");

        return;
    }


    // Data yang dimasukkan ke QR

    const qrData = {

        nim: dataMahasiswa.nim,

        nama: dataMahasiswa.nama,

        kelas: dataMahasiswa.kelas,

        jurusan: dataMahasiswa.jurusan,

        link_sheet: LINK_SHEET,

        timestamp: new Date().toISOString()

    };


    // Buat QR

    tampilkanQR(qrData);
}


// ===============================
// TAMPILKAN QR
// ===============================

function tampilkanQR(data) {

    // Bersihkan QR sebelumnya

    qrContainer.innerHTML = "";


    // Buat QR baru

new QRCode(qrContainer, {

    text: String(data.nim),

    width: 240,

    height: 240,

    colorDark: "#111827",

    colorLight: "#ffffff",

    correctLevel: QRCode.CorrectLevel.H

});


    // Tampilkan informasi mahasiswa

    studentInfo.innerHTML = `

        <h4>${data.nama}</h4>

        <p>NIM: ${data.nim}</p>

        <p>Kelas: ${data.kelas}</p>

        <p>${data.jurusan}</p>

    `;


    // Tampilkan container

    qrResult.classList.add("show");


    console.log(
        "Data QR:",
        JSON.stringify(data)
    );
}

// =====================================================
// QR SCANNER
// =====================================================

let html5QrCode = null;


// ===============================
// MULAI SCANNER
// ===============================

async function mulaiScanner() {

    const readerElement =
        document.getElementById("reader");

    const startButton =
        document.getElementById("startScanBtn");

    const stopButton =
        document.getElementById("stopScanBtn");


    try {

        html5QrCode =
            new Html5Qrcode("reader");


        await html5QrCode.start(

            { facingMode: "environment" },

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                }
            },

            (decodedText) => {

                       console.log("ISI QR TERBACA:", decodedText);

                berhasilScan(decodedText);

            },

            (errorMessage) => {

                // Error pembacaan frame
                // sengaja tidak ditampilkan

            }

        );


        startButton.style.display = "none";

        stopButton.style.display = "inline-block";


    } catch (error) {

        console.error(error);

        alert(
            "Kamera tidak dapat digunakan.\n\n" +
            "Pastikan browser memiliki izin kamera."
        );

    }

}


// ===============================
// STOP SCANNER
// ===============================

async function stopScanner() {

    if (!html5QrCode) {
        return;
    }


    try {

        await html5QrCode.stop();

        html5QrCode.clear();

        html5QrCode = null;


        document.getElementById(
            "startScanBtn"
        ).style.display = "inline-block";


        document.getElementById(
            "stopScanBtn"
        ).style.display = "none";


    } catch (error) {

        console.error(error);

    }

}



// ===============================
// HASIL SCAN DOSEN
// ===============================

async function berhasilScan(decodedText) {

    console.log("QR DOSEN TERBACA:", decodedText);

    const nimQR =
        String(decodedText).trim();

    if (!nimQR) {

        tampilkanError(
            "QR mahasiswa tidak valid."
        );

        return;
    }

    console.log("NIM DARI QR:", nimQR);

    const mahasiswaDitemukan =
        mahasiswa.find(function(student) {

            return String(student.nim).trim() === nimQR;

        });

    if (!mahasiswaDitemukan) {

        tampilkanError(
            "NIM " + nimQR + " tidak terdaftar!"
        );

        return;
    }

    console.log(
        "MAHASISWA DITEMUKAN:",
        mahasiswaDitemukan
    );

    await cekKehadiranMahasiswa(
        mahasiswaDitemukan
    );

}

// ===============================
// CEK KEHADIRAN MAHASISWA
// SESUAI SESI AKTIF
// ===============================

async function cekKehadiranMahasiswa(data) {

    console.log(
        "Mengecek kehadiran:",
        data
    );

    const result =
        document.getElementById("scanResult");

    result.innerHTML = `
        <div class="scan-success">

            <h4>
                ⏳ MENGECEK...
            </h4>

            <p>
                <strong>${data.nama}</strong>
            </p>

            <p>
                NIM: ${data.nim}
            </p>

        </div>
    `;


    // ===============================
    // SESI AKTIF
    // ===============================

    const sesi =
        window.sesiAktif;

    if (!sesi) {

        tampilkanError(
            "Belum ada sesi presensi yang aktif."
        );

        return;
    }


console.log(
    "Sesi aktif:",
    window.sesiAktif
);


    const mataKuliahSesi =
        String(
            sesi.mata_kuliah || ""
        ).trim();

    const pertemuanSesi =
        String(
            sesi.pertemuan || ""
        ).trim();


    console.log(
        "Mata Kuliah Sesi:",
        mataKuliahSesi
    );

    console.log(
        "Pertemuan Sesi:",
        pertemuanSesi
    );


    // ===============================
    // URL APPS SCRIPT
    // ===============================

    const API_URL =
        "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec";


    const callbackName =
        "cekPresensiCallback_" +
        Date.now();


    const script =
        document.createElement("script");


    // ===============================
    // CALLBACK
    // ===============================

    window[callbackName] =
        function(presensi) {

            console.log(
                "DATA PRESENSI:",
                presensi
            );


            // ===============================
            // CARI PRESENSI SESUAI SESI
            // ===============================

            const sudahHadir =
    presensi.find(function(item) {

        const nimSama =
            String(item.nim).trim() ===
            String(data.nim).trim();


        const mataKuliahSama =
            String(item.mata_kuliah || "").trim() ===
            String(sesi.mata_kuliah || "").trim();


        // Normalisasi pertemuan
        const pertemuanData =
            String(item.pertemuan || "")
                .replace(/[^0-9]/g, "");

        const pertemuanSesi =
            String(sesi.pertemuan || "")
                .replace(/[^0-9]/g, "");


        const pertemuanSama =
            pertemuanData === pertemuanSesi;


        console.log("CEK PRESENSI:", {
            nim: item.nim,
            mataKuliah: item.mata_kuliah,
            pertemuan: item.pertemuan,
            nimSama: nimSama,
            mataKuliahSama: mataKuliahSama,
            pertemuanData: pertemuanData,
            pertemuanSesi: pertemuanSesi,
            pertemuanSama: pertemuanSama
        });


        return (
            nimSama &&
            mataKuliahSama &&
            pertemuanSama
        );

    });


            // ===============================
            // SUDAH HADIR
            // ===============================

            if (sudahHadir) {

                console.log(
                    "MAHASISWA SUDAH HADIR DI SESI INI:",
                    sudahHadir
                );


                result.innerHTML = `

                    <div class="scan-success">

                        <h4>
                            ✓ MAHASISWA SUDAH HADIR
                        </h4>

                        <p>
                            <strong>
                                ${data.nama}
                            </strong>
                        </p>

                        <p>
                            NIM: ${data.nim}
                        </p>

                        <p>
                            Mata Kuliah:
                            ${sudahHadir.mata_kuliah}
                        </p>

                        <p>
                            Pertemuan:
                            ${sudahHadir.pertemuan}
                        </p>

                        <p>
                            Status:
                            ${sudahHadir.status || "HADIR"}
                        </p>

                    </div>

                `;

            }


            // ===============================
            // BELUM HADIR
            // ===============================

            else {

                console.log(
                    "MAHASISWA BELUM HADIR DI SESI INI:",
                    data.nim
                );


                result.innerHTML = `

                    <div class="scan-error">

                        <h4>
                            ✕ MAHASISWA BELUM HADIR
                        </h4>

                        <p>
                            <strong>
                                ${data.nama}
                            </strong>
                        </p>

                        <p>
                            NIM: ${data.nim}
                        </p>

                        <p>
                            Mata Kuliah:
                            ${mataKuliahSesi}
                        </p>

                        <p>
                            Pertemuan:
                            ${pertemuanSesi}
                        </p>

                    </div>

                `;

            }


            // Bersihkan callback
            delete window[callbackName];

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }

        };


    // ===============================
    // ERROR
    // ===============================

    script.onerror =
        function(error) {

            console.error(
                "GAGAL MEMUAT DATA PRESENSI:",
                error
            );


            result.innerHTML = `

                <div class="scan-error">

                    ❌ Gagal mengambil data presensi.

                </div>

            `;


            delete window[callbackName];

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }

        };


    // ===============================
    // PANGGIL APPS SCRIPT
    // ===============================

    const url =
        API_URL +
        "?action=presensi&callback=" +
        encodeURIComponent(callbackName);


    console.log(
        "URL CEK PRESENSI:",
        url
    );


    script.src = url;

    document.body.appendChild(script);


    // ===============================
    // TIMEOUT
    // ===============================

    setTimeout(function() {

        if (window[callbackName]) {

            console.error(
                "TIMEOUT: Apps Script tidak memberikan callback."
            );


            result.innerHTML = `

                <div class="scan-error">

                    ❌ Waktu pengecekan habis.
                    Silakan coba scan lagi.

                </div>

            `;


            delete window[callbackName];

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }

        }

    }, 10000);

}

// ===============================
// TAMPILKAN BERHASIL
// ===============================

function tampilkanBerhasil(data) {

    const result =
        document.getElementById("scanResult");

    result.innerHTML = `

        <div class="scan-success">

            <h4>
                ✓ HADIR
            </h4>

            <p>
                <strong>${data.nama}</strong>
            </p>

            <p>
                NIM: ${data.nim}
            </p>

            <p>
                Kelas: ${data.kelas}
            </p>

            <p>
                ${data.jurusan}
            </p>

        </div>

    `;
}
// ===============================
// TAMPILKAN ERROR
// ===============================

function tampilkanError(message) {

    const result =
        document.getElementById("scanResult");


    result.innerHTML = `

        <div class="scan-error">

            ❌ ${message}

        </div>

    `;

}

// =====================================================
// SCAN QR DARI GAMBAR
// =====================================================

async function scanDariGambar(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {

        // Jika kamera sedang berjalan, hentikan dulu
        if (html5QrCode) {

            try {
                await html5QrCode.stop();
            } catch (e) {}

            try {
                html5QrCode.clear();
            } catch (e) {}

            html5QrCode = null;
        }


        // Buat objek gambar
        const image = new Image();

        image.onload = function () {

            // Canvas untuk membaca gambar
            const canvas =
                document.createElement("canvas");

            const context =
                canvas.getContext("2d");


            // Gunakan ukuran asli gambar
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;


            // Masukkan gambar ke canvas
            context.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );


            // Ambil pixel gambar
            const imageData =
                context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


            // Baca QR
            const code =
                jsQR(
                    imageData.data,
                    imageData.width,
                    imageData.height
                );


            if (code) {

                console.log(
                    "QR berhasil dibaca:"
                );

                console.log(code.data);


                // Proses isi QR
                berhasilScan(code.data);

            } else {

                tampilkanError(
                    "QR Code tidak dapat dibaca dari gambar."
                );

            }


            // Bersihkan object URL
            URL.revokeObjectURL(
                image.src
            );

        };


        image.onerror = function () {

            tampilkanError(
                "Gambar QR tidak dapat dibuka."
            );

        };


        // Baca file gambar
        image.src =
            URL.createObjectURL(file);


    } catch (error) {

        console.error(error);

        tampilkanError(
            "Terjadi kesalahan saat membaca QR."
        );

    }


    // Reset input
    event.target.value = "";
}

// =====================================================
// QR BESAR / SESI KELAS
// =====================================================

window.sesiAktif = null;


// ===============================
// BUAT SESI
// ===============================
function buatSesi() {

    const mataKuliah =
        document.getElementById("mataKuliahSelect").value;

    const dosen =
        document.getElementById("dosenSelect").value;

    const kelas =
        document.getElementById("kelasSelect").value;

    const pertemuan =
        document.getElementById("pertemuanSelect").value;

    const jam =
        document.getElementById("jamSelect").value;

    const materi =
        document.getElementById("materiInput").value.trim();

    if (
        !mataKuliah ||
        !dosen ||
        !kelas ||
        !pertemuan ||
        !jam ||
        !materi
    ) {
        alert("Lengkapi semua data presensi terlebih dahulu!");
        return;
    }

    const sessionId =
        "SESI-" + Date.now();

    window.sesiAktif = {
        type: "SESSION",
        session_id: sessionId,
        mata_kuliah: mataKuliah,
        dosen: dosen,
        kelas: kelas,
        pertemuan: pertemuan,
        jam: jam,
        materi: materi,
        timestamp: new Date().toISOString()
    };

    // ===============================
    // SIMPAN DATA KE SHEET PERTEMUAN
    // ===============================

    const API_URL =
        "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            action: "pertemuan",
            mata_kuliah: mataKuliah,
            dosen: dosen,
            kelas: kelas,
            pertemuan: pertemuan,
            materi: materi,
            tanggal:
                new Date().toLocaleDateString("id-ID"),
            jam: jam,
            sesi: jam,
            status: "Aktif"
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        console.log("Data Pertemuan:", data);
    })
    .catch(function(error) {
        console.error(
            "Gagal menyimpan Pertemuan:",
            error
        );
    });

    // ===============================
    // TAMPILKAN INFORMASI SESI
    // ===============================

    document.getElementById("sessionMataKuliah")
        .textContent = mataKuliah;

    document.getElementById("sessionDosen")
        .textContent = dosen;

    document.getElementById("sessionKelas")
        .textContent = kelas;

    document.getElementById("sessionPertemuan")
        .textContent = "Pertemuan " + pertemuan;

    document.getElementById("sessionJam")
        .textContent = jam;

    document.getElementById("sessionMateri")
        .textContent = materi;

    // ===============================
    // BUAT QR SESI
    // ===============================

    const qrContainer =
        document.getElementById("classQRCode");

    qrContainer.innerHTML = "";

    const sessionUrl =
        `${window.location.origin}${window.location.pathname
            .replace("index.html", "")
            .replace(/\/$/, "")}/student.html?session=${encodeURIComponent(
                JSON.stringify(window.sesiAktif)
            )}`;

    new QRCode(qrContainer, {
        text: sessionUrl,
        width: 280,
        height: 280,
        colorDark: "#111827",
        colorLight: "#ffffff",
        correctLevel:
            QRCode.CorrectLevel.H
    });

    console.log(
        "Sesi aktif:",
        window.sesiAktif
    );

    console.log(
        "URL sesi:",
        sessionUrl
    );

    alert(
        "Sesi presensi berhasil dibuat!"
    );
}

// ===============================
// DOWNLOAD QR
// ===============================
function downloadQR() {

    const qrContainer =
        document.getElementById("classQRCode");

    if (!qrContainer) {
        alert("QR Code tidak ditemukan.");
        return;
    }

    const canvas =
        qrContainer.querySelector("canvas");

    const img =
        qrContainer.querySelector("img");

    let dataURL = null;

    if (canvas) {
        dataURL = canvas.toDataURL("image/png");
    } else if (img) {
        dataURL = img.src;
    }

    if (!dataURL) {
        alert("Buat sesi terlebih dahulu.");
        return;
    }

    const link =
        document.createElement("a");

    link.href = dataURL;

    link.download =
        "QR-Sesi-Presensi.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}


// ===============================
// TUTUP SESI
// ===============================
function tutupSesi() {

    if (!window.sesiAktif) {
        alert("Belum ada sesi yang aktif!");
        return;
    }

    const konfirmasi = confirm(
        "Apakah Anda yakin ingin menutup sesi presensi ini?"
    );

    if (!konfirmasi) {
        return;
    }

    const API_URL =
        "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            action: "tutup_sesi",
            mata_kuliah:
                window.sesiAktif.mata_kuliah,
            dosen:
                window.sesiAktif.dosen,
            pertemuan:
                window.sesiAktif.pertemuan
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("Hasil tutup sesi:", data);

        if (!data.success) {
            alert(
                data.message ||
                "Gagal menutup sesi."
            );
            return;
        }

        // Tandai sesi di website sebagai selesai
        window.sesiAktif.status = "Selesai";

        alert(
            "Sesi presensi berhasil ditutup."
        );

        console.log(
            "Sesi sekarang:",
            window.sesiAktif
        );
    })
    .catch(function(error) {

        console.error(
            "Gagal menutup sesi:",
            error
        );

        alert(
            "Terjadi kesalahan saat menutup sesi."
        );
    });
}


// ===============================
// OTOMATIS SESUAI JADWAL
// ===============================

function updateJadwal() {

    const mataKuliah =
        document.getElementById("mataKuliahSelect").value;

    const dosenSelect =
        document.getElementById("dosenSelect");

    const jamSelect =
        document.getElementById("jamSelect");

    const hariInput =
        document.getElementById("hariInput");

    const ruangInput =
        document.getElementById("ruangInput");


    const jadwal = {

        "Konsep Data Warehouse & Data Mining": {
            dosen: "Jessika, S.Kom., M.Kom",
            hari: "Senin",
            jam: "Jam I",
            ruang: "LAB-03"
        },

        "Proyek Perangkat Lunak": {
            dosen: "Ilal Mahdi, S.T., M.T",
            hari: "Selasa",
            jam: "Jam I",
            ruang: "FTI-02"
        },

        "Pemrograman Berorientasi Objek": {
            dosen: "Ilal Mahdi, S.T., M.T",
            hari: "Selasa",
            jam: "Jam III",
            ruang: "FTI-03"
        },

        "Rekayasa Perangkat Lunak II": {
            dosen: "Zikrul Khalid, ST.,MT",
            hari: "Rabu",
            jam: "Jam I",
            ruang: "FTI-04"
        },

        "Komputer Grafik": {
            dosen: "Wahyuni Harahap, ST.,MM",
            hari: "Rabu",
            jam: "Jam III",
            ruang: "LAB-04"
        },

        "Jaringan Komputer II": {
            dosen: "Sayed Achmady, ST., M.Kom",
            hari: "Kamis",
            jam: "Jam II",
            ruang: "LAB-04"
        },

        "Interaksi Manusia & Komputer": {
            dosen: "Wahyuni Harahap, ST.,MM",
            hari: "Kamis",
            jam: "Jam III",
            ruang: "FTI-10"
        }

    };


    if (!mataKuliah) {

        dosenSelect.value = "";
        jamSelect.value = "";
        hariInput.value = "";
        ruangInput.value = "";

        return;
    }


    const data = jadwal[mataKuliah];

    if (!data) {
        return;
    }


    // Isi otomatis
    dosenSelect.value = data.dosen;

    jamSelect.value = data.jam;

    hariInput.value = data.hari;

    ruangInput.value = data.ruang;

}

// ===============================
// TAMPILKAN DAFTAR MAHASISWA
// ===============================

function tampilkanDaftarMahasiswa() {

    const tbody =
        document.getElementById("mahasiswaTableBody");

    if (!tbody) {
        console.error(
            "Tabel mahasiswa tidak ditemukan."
        );
        return;
    }

    tbody.innerHTML = "";

    mahasiswa.forEach(function(student) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${student.nim}</td>
            <td>${student.nama}</td>
            <td>${student.kelas}</td>
            <td>${student.jurusan}</td>
            <td>
                <span class="status hadir">
                    ${student.status || "Aktif"}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

loadMahasiswa();