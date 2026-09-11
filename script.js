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
    "https://docs.google.com/spreadsheets/d/1PXOSZAXZNg7hvX-33DglZlM3saj4yclUhiYepiFNYhI/edit?gid=646034675#gid=646034675";

const API_URL =
    "https://script.google.com/macros/s/AKfycbyUT42QkL-FU_sJn_TdDMQyBL9ZBZiygSPE_DFwLpKVRQ2xuFtYZfqtWQcO4eIvmQRhfg/exec";

    // ===============================
// AMBIL DATA MAHASISWA DARI SHEET
// ===============================

async function loadMahasiswa() {
    try {
        const response = await fetch(
            "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec?action=mahasiswa"
        );

        if (!response.ok) {
            throw new Error("API tidak merespons dengan benar");
        }

        const data = await response.json();

        mahasiswa = data.map(item => ({
            ...item,
            nim: String(item.nim),
            kelas: String(item.kelas)
        }));

        console.log("Data mahasiswa berhasil diambil:", mahasiswa);
        tampilkanDaftarMahasiswa();

    } catch (error) {
        console.error("Gagal mengambil data mahasiswa:", error);
    }
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

    text: JSON.stringify(data),

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
// HASIL SCAN
// ===============================

function berhasilScan(decodedText) {

    console.log(
        "QR terbaca:",
        decodedText
    );


    let data;


    // Coba membaca JSON

    try {

        data = JSON.parse(decodedText);

    } catch (error) {

        tampilkanError(
            "QR Code tidak memiliki format yang valid."
        );

        return;

    }


    // Cari mahasiswa berdasarkan NIM

    const mahasiswaDitemukan =
        mahasiswa.find(
            student =>
                student.nim === data.nim
        );


    // NIM tidak ditemukan

    if (!mahasiswaDitemukan) {

        tampilkanError(
            `NIM ${data.nim} tidak terdaftar!`
        );

        return;

    }


    // Mahasiswa ditemukan

    tampilkanBerhasil(
        mahasiswaDitemukan
    );

    simpanPresensi(mahasiswaDitemukan);

    // Stop kamera setelah berhasil

    stopScanner();

}


async function simpanPresensi(data) {

    const presensi = {
        nim: data.nim,
        mata_kuliah: data.mata_kuliah || "Pemrograman Web",
        status: "HADIR"
    };

    try {

        await fetch(
            "https://script.google.com/macros/s/AKfycbwQ0DBSXYLN7KlbkOBTzqna7iwdvlWuT716XJTAoZDso5Gb08wo4j-Ud48jqwUgY5m3qw/exec",
            {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body:
                    "nim=" + encodeURIComponent(presensi.nim) +
                    "&mata_kuliah=" + encodeURIComponent(presensi.mata_kuliah) +
                    "&status=" + encodeURIComponent(presensi.status)
            }
        );

        console.log(
            "Presensi berhasil dikirim:",
            presensi
        );

    } catch (error) {

        console.error(
            "Gagal menyimpan presensi:",
            error
        );

    }
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

let sesiAktif = null;


// ===============================
// BUAT SESI
// ===============================

function buatSesi() {

    // Buat ID sesi unik
    const sessionId = "SESI-" + Date.now();

    // Data sesi presensi
    sesiAktif = {
        type: "SESSION",
        session_id: sessionId,
        mata_kuliah: "Pemrograman Web",
        kelas: "3",
        timestamp: new Date().toISOString()
    };

    // Ambil tempat QR
    const qrContainer = document.getElementById("classQRCode");

    // Bersihkan QR sebelumnya
    qrContainer.innerHTML = "";

    /*
     * Buat alamat halaman mahasiswa.
     *
     * Contoh:
     * http://192.168.100.144:5500/student.html?session=...
     */
    const sessionUrl =
        `${window.location.origin}/student.html?session=${encodeURIComponent(
            JSON.stringify(sesiAktif)
        )}`;

    // Buat QR sesi
    new QRCode(qrContainer, {

        text: sessionUrl,

        width: 280,
        height: 280,

        colorDark: "#111827",
        colorLight: "#ffffff",

        correctLevel: QRCode.CorrectLevel.H
    });

    // Informasi sesi
    console.log("Sesi aktif:", sesiAktif);
    console.log("URL sesi:", sessionUrl);

    alert("Sesi presensi berhasil dibuat!");
}

loadMahasiswa();

function tampilkanDaftarMahasiswa() {

    const tbody = document.getElementById("mahasiswaTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    mahasiswa.forEach(student => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.nim}</td>

            <td>
                ${student.nama}
            </td>

            <td>
                ${student.kelas}
            </td>

            <td>
                ${student.jurusan}
            </td>

            <td>
                <span class="status hadir">
                    ${student.status || "Terdaftar"}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

loadMahasiswa();