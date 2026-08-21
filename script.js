document.addEventListener('DOMContentLoaded', () => {
  const pasteBtn = document.getElementById('pasteBtn');
  const tiktokUrl = document.getElementById('tiktokUrl');
  const fetchBtn = document.getElementById('fetchBtn');
  const loading = document.getElementById('loading');
  const resultContainer = document.getElementById('resultContainer');
  
  const singlePreview = document.getElementById('singlePreview');
  const slidePreview = document.getElementById('slidePreview');
  const slideContent = document.getElementById('slideContent');
  const slideCounter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const dlNoWm = document.getElementById('dlNoWm');
  const dlWm = document.getElementById('dlWm');
  const dlMp3 = document.getElementById('dlMp3');

  let currentSlides = [];
  let currentSlideIndex = 0;
  let mediaData = { noWatermark: '', watermark: '', music: '' };

  // Fitur Tempel Link
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      tiktokUrl.value = text;
    } catch (err) {
      alert('Gagal menempelkan link secara otomatis.');
    }
  });

  // Ambil Data Tikwm API
  fetchBtn.addEventListener('click', async () => {
    const url = tiktokUrl.value.trim();
    if (!url) return alert('Silakan masukkan link TikTok terlebih dahulu!');

    loading.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    singlePreview.innerHTML = '';
    slideContent.innerHTML = '';

    try {
      const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const res = await response.json();

      if (res.code === 0) {
        const data = res.data;
        mediaData.noWatermark = data.play;
        mediaData.watermark = data.wmplay;
        mediaData.music = data.music;

        // Cek tipe: Slide Gambar atau Video
        if (data.images && data.images.length > 0) {
          currentSlides = data.images;
          currentSlideIndex = 0;
          setupSlideSystem();
          singlePreview.classList.add('hidden');
          slidePreview.classList.remove('hidden');
        } else {
          slidePreview.classList.add('hidden');
          singlePreview.classList.remove('hidden');
          singlePreview.innerHTML = `<img src="${data.cover}" alt="Thumbnail" oncontextmenu="return false;">`;
        }

        resultContainer.classList.remove('hidden');
      } else {
        alert('Gagal mengambil data TikTok. Pastikan link valid!');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan/sistem.');
    } finally {
      loading.classList.add('hidden');
    }
  });

  // System Slide Navigasi
  function setupSlideSystem() {
    updateSlideDisplay();
  }

  function updateSlideDisplay() {
    slideContent.innerHTML = `<img src="${currentSlides[currentSlideIndex]}" alt="Slide ${currentSlideIndex + 1}" oncontextmenu="return false;">`;
    slideCounter.textContent = `${currentSlideIndex + 1}/${currentSlides.length}`;

    // Kontrol tombol Next & Prev
    if (currentSlideIndex === 0) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    if (currentSlideIndex === currentSlides.length - 1) {
      nextBtn.classList.add('hidden');
    } else {
      nextBtn.classList.remove('hidden');
    }
  }

  nextBtn.addEventListener('click', () => {
    if (currentSlideIndex < currentSlides.length - 1) {
      currentSlideIndex++;
      updateSlideDisplay();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      updateSlideDisplay();
    }
  });

  // Sistem Download Langsung (Tanpa Buka Tab Baru)
  async function forceDownload(fileUrl, fileName) {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback jika CORS memblokir blob
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  dlNoWm.addEventListener('click', () => {
    if (currentSlides.length > 0) {
      forceDownload(currentSlides[currentSlideIndex], `DausTik_Slide_${currentSlideIndex + 1}.jpeg`);
    } else {
      forceDownload(mediaData.noWatermark, 'DausTik_NoWatermark.mp4');
    }
  });

  dlWm.addEventListener('click', () => {
    if (currentSlides.length > 0) {
      forceDownload(currentSlides[currentSlideIndex], `DausTik_Slide_${currentSlideIndex + 1}.jpeg`);
    } else {
      forceDownload(mediaData.watermark, 'DausTik_Watermark.mp4');
    }
  });

  dlMp3.addEventListener('click', () => {
    forceDownload(mediaData.music, 'DausTik_Audio.mp3');
  });
});
