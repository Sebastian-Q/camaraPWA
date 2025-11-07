const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const takePhotoBtn = document.getElementById('takePhoto');
const switchCameraBtn = document.getElementById('switchCamera');
const galleryContainer = document.getElementById('galleryContainer');
const gallery = document.getElementById('gallery');
const clearGalleryBtn = document.getElementById('clearGallery');

const ctx = canvas.getContext('2d');

let stream = null;
let currentFacingMode = 'user'; // user = frontal | environment = trasera
let photos = JSON.parse(localStorage.getItem('photos') || '[]');

// === Inicializar galería al cargar ===
window.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  adjustGalleryWidth();
});

// --- Abrir cámara ---
async function openCamera() {
  try {
    const constraints = {
      video: { facingMode: { ideal: currentFacingMode } },
      audio: false
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    cameraContainer.style.display = 'flex';
    openCameraBtn.style.display = 'none';

    console.log(`✅ Cámara (${currentFacingMode}) abierta`);
  } catch (error) {
    console.error('❌ Error al acceder a la cámara:', error);
    alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
  }
}

// --- Tomar foto ---
function takePhoto() {
  if (!stream) return alert('Primero abre la cámara');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const url = canvas.toDataURL('image/png');
  photos.push(url);
  saveGallery();
  addPhotoToGallery(url);
  adjustGalleryWidth();
}

// --- Cambiar cámara (frontal/trasera) ---
async function switchCamera() {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  closeCamera();
  await openCamera();
}

// --- Cerrar cámara ---
function closeCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// --- Cargar galería ---
function loadGallery() {
  gallery.innerHTML = '';
  photos.forEach(addPhotoToGallery);
}

// --- Agregar foto al DOM ---
function addPhotoToGallery(url) {
  const img = document.createElement('img');
  img.src = url;
  img.title = 'Ver foto';
  img.addEventListener('click', () => openCanvasViewer(url));
  gallery.appendChild(img);
  gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
}

// --- Abrir foto en un Canvas Viewer ---
function openCanvasViewer(url) {
  const newTab = window.open('', '_blank');
  newTab.document.write(`
    <html>
      <head>
        <title>Foto</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; background: #000; }
          canvas { max-width: 100vw; max-height: 100vh; border-radius: 8px; }
        </style>
      </head>
      <body>
        <canvas id="photoCanvas"></canvas>
        <script>
          const img = new Image();
          img.src = "${url}";
          img.onload = () => {
            const canvas = document.getElementById('photoCanvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
          };
        </script>
      </body>
    </html>
  `);
}

// --- Guardar en localStorage ---
function saveGallery() {
  localStorage.setItem('photos', JSON.stringify(photos));
}

// --- Ajustar ancho dinámico ---
function adjustGalleryWidth() {
  const photoCount = gallery.querySelectorAll('img').length;
  const newWidth = Math.min(320 + photoCount * 110, window.innerWidth * 0.9);
  galleryContainer.style.width = newWidth + 'px';
}

// --- Limpiar galería ---
clearGalleryBtn.addEventListener('click', () => {
  if (confirm('¿Seguro que deseas borrar todas las fotos?')) {
    photos = [];
    saveGallery();
    gallery.innerHTML = '';
    galleryContainer.style.width = '320px';
  }
});

// --- Eventos ---
openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);
switchCameraBtn.addEventListener('click', switchCamera);
window.addEventListener('beforeunload', closeCamera);
