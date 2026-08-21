document.addEventListener('DOMContentLoaded', () => {
    const pasteBtn = document.getElementById('paste-btn');
    const processBtn = document.getElementById('process-btn');
    const tiktokUrlInput = document.getElementById('tiktok-url');
    
    const loading = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const mediaPreviewContainer = document.getElementById('media-preview-container');
    const thumbnailPreview = document.getElementById('thumbnail-preview');
    
    const slideContainer = document.getElementById('slide-container');
    const slideImg = document.getElementById('slide-img');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const dlNoWatermark = document.getElementById('dl-nowatermark');
    const dlWatermark = document.getElementById('dl-watermark');
    const dlMp3 = document.getElementById('dl-mp3');

    let slideImages = [];
    let currentSlideIndex = 0;

    // Sistem Tempel Link
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            tiktokUrlInput.value = text;
        } catch (err) {
            alert('Gagal menempelkan link secara otomatis. Silakan tempel manual.');
        }
    });

    // Proses Pencarian Data TikTok
    processBtn.addEventListener('click', async () => {
        const url = tiktokUrlInput.value.trim();
        if (!url) {
            alert('Masukkan link TikTok terlebih dahulu!');
            return;
        }

        loading.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        slideContainer.classList.add('hidden');
        mediaPreviewContainer.classList.add('hidden');

        try {
            // Menggunakan API TikWM Publik
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const resData = await response.json();

            if (resData.code !== 0) {
                alert('Gagal mengambil data TikTok. Pastikan link benar!');
                loading.classList.add('hidden');
                return;
            }

            const data = resData.data;

            // Set Tombol Download
            dlNoWatermark.href = data.play || '#';
            dlWatermark.href = data.wmplay || data.play || '#';
            dlMp3.href = data.music || '#';

            // Cek Jika Tipe Media Adalah Slide Images
            if (data.images && data.images.length > 0) {
                slideImages = data.images;
                currentSlideIndex = 0;
                updateSlideView();
                slideContainer.classList.remove('hidden');
            } else {
                // Tipe Video atau Foto Profil
                thumbnailPreview.src = data.cover || data.origin_cover || data.author.avatar;
                mediaPreviewContainer.classList.remove('hidden');
            }

            loading.classList.add('hidden');
            resultContainer.classList.remove('hidden');

        } catch (error) {
            alert('Terjadi kesalahan koneksi atau data tidak ditemukan.');
            loading.classList.add('hidden');
        }
    });

    // Logika Pengaturan Slide Next & Prev
    function updateSlideView() {
        slideImg.src = slideImages[currentSlideIndex];

        // Slide pertama hanya tampilkan Next, Slide terakhir hanya tampilkan Prev
        if (slideImages.length <= 1) {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
        } else if (currentSlideIndex === 0) {
            prevBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        } else if (currentSlideIndex === slideImages.length - 1) {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
        }
    }

    nextBtn.addEventListener('click', () => {
        if (currentSlideIndex < slideImages.length - 1) {
            currentSlideIndex++;
            updateSlideView();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            updateSlideView();
        }
    });
});
