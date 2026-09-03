(function () {
  // Tema warna berdasarkan kategori buku (gradien sampul)
  var THEMES = {
    'fiksi': ['#e75b4a', '#7a2030'],
    'nonfiksi': ['#2e86de', '#1b3a6b'],
    'teknologi': ['#10ac84', '#0f3d3a'],
    'pengembangan diri': ['#f39c12', '#b1560f'],
    'sains': ['#9b59b6', '#4a235a'],
    'sejarah': ['#d35400', '#6e2c00'],
    'komik': ['#e84393', '#6d214f'],
    'novel': ['#ff6b6b', '#c0392b'],
    'agama': ['#16a085', '#0b5345'],
    'pendidikan': ['#3498db', '#154360']
  };
  var DEFAULT_THEME = ['#33415c', '#1c2a44'];

  function hashStr(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  // Palet tambahan bila kategori tidak dikenal; dipilih deterministik dari judul
  var FALLBACK_PALETTES = [
    ['#5b7bd5', '#2d3f8f'],
    ['#2eb086', '#145a43'],
    ['#e17055', '#94350f'],
    ['#8860d0', '#4a2c87'],
    ['#00b4d8', '#0b4f6c'],
    ['#f4a261', '#944d19']
  ];

  function pickTheme(kategori, judul) {
    var key = (kategori || '').toLowerCase().trim();
    if (THEMES[key]) return THEMES[key];
    var pal = FALLBACK_PALETTES[hashStr(key || judul || '') % FALLBACK_PALETTES.length];
    return pal;
  }

  function initials(judul) {
    var words = (judul || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
    if (words.length >= 3) {
      return (words[0][0] || '') + (words[1][0] || '') + (words[2][0] || '');
    }
    return words.map(function (w) { return (w[0] || '').toUpperCase(); }).join('') || 'BUKU';
  }

  function render(container) {
    var judul = container.getAttribute('data-judul') || 'Buku';
    var penulis = container.getAttribute('data-penulis') || '';
    var kategori = container.getAttribute('data-kategori') || 'Umum';
    var theme = pickTheme(kategori, judul);
    var ini = initials(judul);
    var style = container.getAttribute('style') || '';
    var className = container.className;

    // Sembunyikan teks placeholder asli lalu bangun fake cover di dalam container
    var disc = document.createElement('div');
    disc.className = 'fake-cover-inner';
    disc.style.background = 'linear-gradient(145deg, ' + theme[0] + ' 0%, ' + theme[1] + ' 100%)';
    disc.innerHTML =
      '<div class="fake-cover-initial">' + ini.replace(/</g, '&lt;') + '</div>' +
      '<div class="fake-cover-cat">' + kategori.replace(/</g, '&lt;') + '</div>' +
      '<div class="fake-cover-title">' + judul.replace(/</g, '&lt;') + '</div>' +
      '<div class="fake-cover-author">' + penulis.replace(/</g, '&lt;') + '</div>';

    container.innerHTML = '';
    container.appendChild(disc);
    container.classList.add('is-fake-cover');
    container.removeAttribute('data-fake-cover');
  }

  function init() {
    var nodes = document.querySelectorAll('[data-fake-cover]');
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);

    // Img yang gagal dimuat -> ganti jadi fake cover
    var imgs = document.querySelectorAll('img[data-fake-cover-fallback]');
    for (var j = 0; j < imgs.length; j++) {
      (function (img) {
        img.addEventListener('error', function () {
          var holder = document.createElement('div');
          holder.className = img.className;
          holder.setAttribute('data-fake-cover', '');
          holder.setAttribute('data-judul', img.getAttribute('data-judul') || '');
          holder.setAttribute('data-penulis', img.getAttribute('data-penulis') || '');
          holder.setAttribute('data-kategori', img.getAttribute('data-kategori') || '');
          img.parentNode.replaceChild(holder, img);
          render(holder);
        });
        if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
      })(imgs[j]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
