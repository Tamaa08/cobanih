(function () {
  // Pratinjau langsung URL sampul pada form Tambah/Edit Buku.
  // Saat user mengetik/menempel URL gambar, tampilkan gambar secara real-time.
  // Jika URL kosong      -> tampilkan fake-cover bertema.
  // Jika URL tidak valid -> tampilkan pesan peringatan yang jelas.

  var input = document.getElementById('cover-url-input');
  if (!input) return;

  var img = document.querySelector('[data-live-cover-preview]');
  var placeholder = document.getElementById('cover-no-preview');
  var hint = document.getElementById('cover-hint');
  if (!img || !placeholder) return;

  function isLikelyImageUrl(url) {
    if (url.indexOf('data:image/') === 0) return true;
    var clean = String(url).split('?')[0].toLowerCase();
    return /\.(jpe?g|png|webp|gif|avif|svg)$/.test(clean) ||
      /^https:\/\/i\.ibb\.co\//.test(url) || // imgbb direct
      /\/(edam|image)\//.test(url);          // publisher CDN style
  }

  function showHint(msg, isError) {
    if (!hint) return;
    hint.textContent = msg;
    hint.style.display = 'block';
    hint.className = isError ? 'cover-hint cover-hint-error' : 'cover-hint';
  }
  function clearHint() { if (hint) hint.style.display = 'none'; }

  function apply(url) {
    url = (url || '').trim();
    if (!url) {
      img.style.display = 'none';
      placeholder.style.display = '';
      clearHint();
      return;
    }
    if (!isLikelyImageUrl(url)) {
      showHint('Periksa link: pastikan ini link LANGSUNG ke file gambar (berakhiran .jpg / .png / .webp). Bukan link halaman web.', true);
      img.style.display = 'none';
      placeholder.style.display = '';
      return;
    }
    clearHint();
    img.style.display = '';
    placeholder.style.display = 'none';
    img.src = url;
  }

  img.addEventListener('error', function () {
    // gambar tidak bisa dimuat (404 / terkunci hotlink)
    img.style.display = 'none';
    placeholder.style.display = '';
    showHint('Gambar tidak bisa dimuat dari link ini. Cek link-nya (404 / terkunci anti-hotlink), atau gunakan direct link dari imgbb.', true);
  });

  input.addEventListener('input', function () { apply(this.value); });
  apply(input.value);
})();