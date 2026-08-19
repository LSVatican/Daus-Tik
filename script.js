let currentSlideIndex = 0;
let totalSlides = 0;

// 1. Fitur Tempel Link
async function pasteLink() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('tiktokUrl').value = text;
    } catch (err) {
        alert('Gagal menempel link secara otomatis. Silakan tempel manual.');
    }
}

// 2. Blokir Klik Kanan/Drag agar tidak bisa save as biasa (memaksa user pakai tombol)
function disableBrowserDefaultOnImages() {
    const images = document.querySelectorAll('#mediaPreview img, .slide-item img');
    images.forEach(img => {
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

// 3. Generator Nama File: Daus Tik - [Judul]
function generateFileName(title, suffix, extension) {
    const cleanTitle = (title || 'TikTok').replace(/[/\\?%*:|"<>]/g, '').trim().substring(0, 50);
    return `Daus Tik - ${cleanTitle}${suffix}.${extension}`;
}

// 4. Engine Download Langsung (Force Download via Blob)
async function downloadFile(fileUrl, fileName) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempAnchor = document.createElement('a');
        tempAnchor.href = blobUrl;
        tempAnchor.download = fileName;
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        // Fallback jika terjadi error CORS
        window.open(fileUrl, '_blank');
    }
}

// 5. Navigasi Carousel (Slide)
function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex += direction;
    slides[currentSlideIndex].classList.add('active');
    updateCarouselControls();
}

function updateCarouselControls() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const counter = document.getElementById('slideCounter');
    if (counter) counter.innerText = `${currentSlideIndex + 1} / ${totalSlides}`;

    if (currentSlideIndex === 0) {
        btnPrev.style.display = 'none';
        btnNext.style.display = totalSlides > 1 ? 'inline-block' : 'none';
    } else if (currentSlideIndex === totalSlides - 1) {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'none';
    } else {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'inline-block';
    }
}

// 6. Main Logic (Proses Link TikTok)
async function processTikTok() {
    const urlInput = document.getElementById('tiktokUrl').value.trim();
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const slideContainer = document.getElementById('slideContainer');
    const actionButtons = document.getElementById('actionButtons');

    if (!urlInput) { alert('Masukkan link terlebih dahulu!'); return; }

    loading.classList.remove('hidden');
    result.classList.add('hidden');
    slideContainer.innerHTML = '';
    currentSlideIndex = 0;

    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(urlInput)}`);
        const res = await response.json();
        loading.classList.add('hidden');

        if (res.code === 0) {
            const data = res.data;
            const videoTitle = data.title || 'Postingan TikTok';

            document.getElementById('authorName').innerText = `@${data.author.unique_id}`;
            document.getElementById('videoTitle').innerText = videoTitle;

            // HANDLE SLIDE FOTO
            if (data.images && data.images.length > 0) {
                actionButtons.classList.add('hidden');
                totalSlides = data.images.length;

                const carouselWrapper = document.createElement('div');
                carouselWrapper.className = 'carousel-container';

                data.images.forEach((imgUrl, index) => {
                    // MENGGUNAKAN wm_images dari API (Watermark asli dari sistem TikTok)
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = `slide-item ${index === 0 ? 'active' : ''}`;
                    item.innerHTML = `<img src="${imgUrl}" alt="Slide ${index + 1}">`;

                    const actions = document.createElement('div');
                    actions.className = 'slide-actions';

                    const btnNoWm = document.createElement('button');
                    btnNoWm.className = 'btn-slide-nowm';
                    btnNoWm.innerText = 'Tanpa Watermark';
                    btnNoWm.onclick = () => downloadFile(imgUrl, generateFileName(videoTitle, `_Slide_${index + 1}`, 'jpeg'));

                    const btnWm = document.createElement('button');
                    btnWm.className = 'btn-slide-wm';
                    btnWm.innerText = 'Dengan Watermark';
                    btnWm.onclick = () => downloadFile(wmImgUrl, generateFileName(videoTitle, `_Slide_${index + 1}_WM`, 'jpeg'));

                    actions.appendChild(btnNoWm);
                    actions.appendChild(btnWm);
                    item.appendChild(actions);
                    carouselWrapper.appendChild(item);
                });

                const nav = document.createElement('div');
                nav.className = 'carousel-nav';
                nav.innerHTML = `
                    <button id="btnPrev" class="btn-nav" onclick="changeSlide(-1)">Prev</button>
                    <span id="slideCounter" class="slide-counter">1 / ${totalSlides}</span>
                    <button id="btnNext" class="btn-nav" onclick="changeSlide(1)">Next</button>
                `;
                slideContainer.appendChild(carouselWrapper);
                slideContainer.appendChild(nav);
                updateCarouselControls();
            } 
            // HANDLE VIDEO
            else {
                actionButtons.classList.remove('hidden');
                document.getElementById('mediaPreview').innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                document.getElementById('btnNoWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.play, generateFileName(videoTitle, '_NoWM', 'mp4'));
                };

                document.getElementById('btnWm').onclick = (e) => {
                    e.preventDefault();
                    // MENGGUNAKAN data.wmplay (Video dengan watermark asli TikTok)
                    downloadFile(data.wmplay, generateFileName(videoTitle, '_WM', 'mp4'));
                };

                document.getElementById('btnAudio').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.music, generateFileName(videoTitle, '_Audio', 'mp3'));
                };
            }

            result.classList.remove('hidden');
            disableBrowserDefaultOnImages();
        } else {
            alert('Gagal mengambil data. Pastikan link TikTok valid!');
        }
    } catch (error) {
        loading.classList.add('hidden');
        alert('Terjadi kesalahan jaringan.');
    }
}
