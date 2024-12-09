// Simpan state untuk skor, kata, artikel, dan daftar yang telah digunakan
let score = 0;
let words = {};
let currentWord = "";
let articles = {};
let currentArticleKeys = {};
let currentArticleKey = "";
let currentArticleIndex = {};
let usedWords = [];   // Array untuk menyimpan kata yang sudah digunakan
let usedArticles = []; // Array untuk menyimpan artikel yang sudah digunakan
let remainingWords = 0;
let remainingArticles = 0;
let totalWordsAvailable = 0; // Variabel untuk menyimpan jumlah kata yang tersedia
let totalArticlesAvailable = 0; //variabel untuk menyimpan jumlah artikel yang tersedia
let speakTimeout = null;
let isGameOver = false;


// Fungsi untuk menampilkan halaman tertentu
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';

}

const music = document.getElementById('background-music');
const playButton = document.getElementById('play-music-btn');
const buttonClickSound = document.getElementById('button-sound');
const ttsVolumeSlider = document.getElementById('tts-volume');

// Fungsi untuk memulai game tebak kata
async function startGuessGame() {
    // Reset semua variabel permainan
    isGameOver = false;
    score = 0;
    usedWords = [];
    totalWordsAvailable = 0;
    remainingWords = 0;

    // Ambil kata dari Firebase
    words = await fetchWords();
    const availableWords = Object.keys(words).filter(word => !usedWords.includes(word));
    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    // Tampilkan kata baru di halaman
    document.getElementById('random-word').textContent = `Kata: ${currentWord}`;
    document.getElementById('user-input').value = "";
    document.getElementById('feedback').textContent = "";
    console.log("Kata yang diambil: ", words);

    // Set jumlah kata yang tersedia
    totalWordsAvailable = Object.keys(words).length;
    remainingWords = totalWordsAvailable;

    // Reset elemen HTML
    document.getElementById('remaining-attempts').textContent = `Sisa kesempatan menebak: ${remainingWords}`;
    document.getElementById('score-result-guess-game').textContent = `Skor: ${score}`;
    document.getElementById('feedback').textContent = "";

    // Mulai permainan
    nextWord();
    playButtonAndSpeak();
    showPage('guess-game');
}

function nextWord() {
    // Cek apakah kata tersedia
    playButtonAndSpeak();
    const availableWords = Object.keys(words).filter(word => !usedWords.includes(word));
    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    document.getElementById('random-word').textContent = `Kata: ${currentWord}`;
    document.getElementById('user-input').value = "";
    document.getElementById('feedback').textContent = "";

}


// Fungsi untuk memutar suara tombol dan TTS secara bersamaan
function playButtonAndSpeak() {
    // Memutar suara tombol terlebih dahulu, baru kemudian TTS
    playButtonSoundAsync().then(() => {
        setTimeout(() => {
            speakWordAsync(); // Hanya dijalankan setelah suara tombol selesai
        }, 10);
    });
}

// Fungsi untuk memainkan suara tombol secara async
function playButtonSoundAsync() {
    return new Promise((resolve) => {
        const buttonAudio = document.getElementById('button-sound');
        buttonAudio.play();
        buttonAudio.onended = resolve; // Resolves when the sound ends
    });
}

// Fungsi untuk memilih kata acak
function speakWordAsync() {
    return new Promise((resolve) => {
        if (!isGameOver) {
            const utterance = new SpeechSynthesisUtterance(currentWord);
            utterance.lang = 'en-US';
            utterance.onend = resolve; // Resolves when the speech finishes
            speechSynthesis.speak(utterance);
        } else {
            resolve(); // If game is over, resolve immediately
        }
    });
    
}

// Fungsi untuk memeriksa terjemahan
function checkTranslation() {
    const userInput = document.getElementById('user-input').value.toLowerCase();
    const feedbackElement = document.getElementById('feedback');

    if (userInput === words[currentWord].toLowerCase()) {
        score += 10; // Tambah skor jika benar
        feedbackElement.textContent = "Benar!";
        feedbackElement.style.color = "green"; // Warna hijau untuk jawaban benar
        usedWords.push(currentWord); // Tandai kata telah digunakan
        remainingWords--; // Kurangi jumlah kata yang tersisa
        // KURANGI JUMLAH KATA YANG TERSEDIA 
        totalWordsAvailable -= 1;
        playButtonAndSpeak();
    } else {
        feedbackElement.textContent = `Salah! Terjemahan yang benar adalah: "${words[currentWord]}"`;
        feedbackElement.style.color = "red"; // Warna hijau untuk jawaban benar
        remainingWords--;
        totalWordsAvailable -=1;
        usedWords.push(currentWord);
        playButtonAndSpeak();
    }
     // Update sisa kesempatan menebak
    document.getElementById('remaining-attempts').textContent = `Sisa kesempatan menebak: ${remainingWords}`;
    document.getElementById('score-result-guess-game').textContent = `Skor: ${score}`;
    // Kurangi jumlah kata yang tersedia
    console.log("Jumlah kata yang tersedia: ", totalWordsAvailable); // Log jumlah kata yang tersisa
    
    // Jika kata sudah habis, akhiri permainan
    if (remainingWords <= 0) {
        endGameForGuessGame();
    } else {
        // Tunggu 1,5 detik sebelum berpindah ke kata selanjutnya
        setTimeout(() => {
            nextWord();
            playButtonAndSpeak();
        }, 1500);
    }
}
// Fungsi untuk memulai deteksi kesalahan artikel
// Fungsi untuk memulai deteksi kesalahan artikel
async function startErrorDetect() {
    articles = await fetchArticles(); // Ambil artikel dari Firebase
    console.log("Artikel yang diambil: ", articles); // Log artikel
    usedArticles = []; // Reset array usedArticles
    score = 0; // Reset skor
    
    // Filter key yang berupa angka dan diurutkan
    const numericKeys = Object.keys(articles)
        .filter(key => /^[1-9]\d*$/.test(key)) // Hanya key angka positif
        .map(Number) // Konversi ke angka
        .sort((a, b) => a - b); // Urutkan secara menaik
    
    totalArticlesAvailable = numericKeys.length; // Total artikel yang valid
    remainingArticles = totalArticlesAvailable; // Atur jumlah artikel yang tersedia
    currentArticleKeys = numericKeys; // Simpan daftar key angka
    currentArticleIndex = 0; // Indeks awal

    if (totalArticlesAvailable > 0) {
        nextArticle(); // Ambil artikel pertama
        showPage('error-detect'); // Tampilkan halaman game
    } else {
        alert("Tidak ada artikel yang valid ditemukan.");
    }
}
// Fungsi untuk memilih artikel berikutnya
function nextArticle() {
    playButtonSoundAsync();
    const articleKey = String(currentArticleKeys[currentArticleIndex]); // Key berbasis indeks
    currentArticle = articles[articleKey]; // Ambil artikel berdasarkan key

    if (remainingArticles <= 0) {
        usedArticles = []; // Reset artikel yang telah digunakan
        remainingArticles = totalArticlesAvailable; // Reset jumlah artikel yang tersisa
        currentArticleIndex = 0; // Kembali ke artikel pertama
        remainingArticles --;
        currentArticleIndex++;
        return;
    }

    if (!currentArticle) {
        // Cari artikel yang belum digunakan
        const unusedArticleKeys = currentArticleKeys.filter(key => !usedArticles.includes(key));
    
        if (unusedArticleKeys.length > 0) {
            // Ambil artikel yang belum digunakan
            const nextArticleKey = unusedArticleKeys[0];
            currentArticle = articles[nextArticleKey]; // Ambil artikel berdasarkan key
            currentArticleIndex = currentArticleKeys.indexOf(nextArticleKey); // Update indeks
        } else {
            console.log("Semua artikel sudah digunakan!");
        }
    }
    


    currentArticleIndex++; // Pindah ke indeks berikutnya

    // Perbarui tampilan halaman
    document.getElementById('remaining-attemptss').textContent = `Sisa kesempatan menebak: ${remainingArticles}`;
    document.getElementById('article').textContent = currentArticle.text;
    document.getElementById('correction').value = "";
    document.getElementById('error-feedback').textContent = "";
}
unusedArticles = (!currentArticleKey);
// Fungsi untuk memeriksa kesalahan artikel
function checkError() {
    const correction = document.getElementById('correction').value.trim();
    const feedbackElement = document.getElementById('error-feedback');

    // Ambil kata yang benar dari artikel
    const correctWord = currentArticle.correctWord; // Dapatkan dari artikel saat ini

    // Logika untuk memeriksa apakah jawaban benar
    if (correction.toLowerCase() === correctWord.toLowerCase()) {
        score += 10; // Tambah skor jika benar
        feedbackElement.textContent = "Benar!";
        feedbackElement.style.color = "green"; // Warna hijau untuk jawaban benar
        currentArticleKey ++;
        usedArticles.push(currentArticleKey); // Tandai artikel telah digunakan
        remainingArticles--;
    } else {
        feedbackElement.textContent = `Salah! Kata yang benar adalah "${correctWord}".`;
        feedbackElement.style.color = "red"; // Warna merah untuk jawaban salah
        currentArticleKey ++;
        usedArticles.push(currentArticleKey); // Tandai artikel telah digunakan
        remainingArticles--;
    }
    // Update skor dan artikel yang tersisa
    document.getElementById('score-result-check-eror').textContent = `Skor: ${score}`;
    document.getElementById('remaining-attemptss').textContent = `Sisa artikel: ${remainingArticles}`;

    // Tunggu 1,5 detik sebelum berpindah ke artikel berikutnya
    if (remainingArticles === 0) {
        endGameForErrorDetect(); // Akhiri permainan jika artikel sudah habis
    } else {
        setTimeout(() => {
            nextArticle(); // Pindah ke artikel berikutnya
        }, 1000);
    }
}

// Fungsi untuk memutar musik
playButton.addEventListener('click', () => {
  music.play().catch(e => console.log('Musik tidak dapat diputar:', e));
  buttonClickSound.play(); // Memutar suara klik tombol
});

// Pengaturan volume TTS
ttsVolumeSlider.addEventListener('input', (event) => {
  const volume = event.target.value;
  const utterance = new SpeechSynthesisUtterance("Selamat datang di game!");
  utterance.volume = volume; // Atur volume sesuai slider
  speechSynthesis.speak(utterance);
});

// Fungsi untuk mengakhiri permainan Guess Game
function endGameForGuessGame() {
    isGameOver = true;

    // Hentikan semua text-to-speech aktif
    if (speakTimeout) {
        clearTimeout(speakTimeout);
        speakTimeout = null;
    }
    speechSynthesis.cancel(); // Hentikan semua text-to-speech yang sedang berjalan

    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');

    // Tampilkan halaman skor akhir
    document.getElementById('score-page-guess-game').style.display = 'block';
    document.getElementById('score-result-guess-game').textContent = `Skor Akhir: ${score}`;

    // Tampilkan pesan akhir berdasarkan skor
    const feedbackMessage = document.getElementById('final-feedback');
    if (score >= 80) {
        feedbackMessage.textContent = "Luar biasa! Kamu hebat dalam permainan ini!";
        feedbackMessage.style.color = "green";
    } else if (score >= 50) {
        feedbackMessage.textContent = "Bagus! Tapi kamu bisa lebih baik lagi.";
        feedbackMessage.style.color = "orange";
    } else {
        feedbackMessage.textContent = "Jangan menyerah! Terus belajar dan coba lagi.";
        feedbackMessage.style.color = "red";
    }

    // Tombol untuk bermain ulang
    const restartButton = document.getElementById('restart-button-guess-game');
    restartButton.addEventListener('click', () => {
        resetGuessGame(); // Reset untuk Guess Game
    });
}
// Fungsi untuk mereset permainan Guess Game
function resetGuessGame() {
    startGuessGame();
}

// Fungsi untuk mengakhiri permainan Deteksi Kesalahan Artikel
function endGameForErrorDetect() {
    isGameOver = true;

    // Hentikan semua text-to-speech aktif
    if (speakTimeout) {
        clearTimeout(speakTimeout);
        speakTimeout = null;
    }
    speechSynthesis.cancel(); // Hentikan semua text-to-speech yang sedang berjalan

    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');

    // Tampilkan halaman skor akhir
    document.getElementById('score-page-check-eror').style.display = 'block';
    document.getElementById('score-result-check-eror').textContent = `Skor Akhir: ${score}`;

    // Tampilkan pesan akhir berdasarkan skor
    const feedbackMessage = document.getElementById('final-feedback');
    if (score >= 80) {
        feedbackMessage.textContent = "Luar biasa! Kamu hebat dalam permainan ini!";
        feedbackMessage.style.color = "green";
    } else if (score >= 50) {
        feedbackMessage.textContent = "Bagus! Tapi kamu bisa lebih baik lagi.";
        feedbackMessage.style.color = "orange";
    } else {
        feedbackMessage.textContent = "Jangan menyerah! Terus belajar dan coba lagi.";
        feedbackMessage.style.color = "red";
    }

    // Tombol untuk bermain ulang
    const restartButton = document.getElementById('restart-button-check-eror');
    restartButton.addEventListener('click', () => {
        resetErrorDetect(); // Reset untuk Deteksi Kesalahan Artikel
    });
}
// Fungsi untuk mereset permainan Deteksi Kesalahan Artikel
function resetErrorDetect() {
    startErrorDetect();
}