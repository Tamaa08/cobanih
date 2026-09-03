(function () {
  // Pratinjau langsung URL sampul pada form Tambah/Edit Buku.
  // Saat user mengetik/menempel URL gambar, tampilkan gambar tsb secara real-time.
  // Jika URL kosong / tidak valid, tampilkan fake-cover bertema.

  var input = document.getElementById('cover-url-input');
  if (!input) return;

  var img = document.querySelector('[data-live-cover-preview]');
  var placeholder = document.getElementById('cover-no-preview');
  if (!img || !placeholder) return;

  function apply(url) {
    url = (url || '').trim();
    if (!url) {
      img.style.display = 'none';
      placeholder.style.display = '';
      return;
    }
    // Tampilkan img preview. Jika dimuat gagal -> event 'error' -> fallback fake-cover
    img.src = url;
    img.style.display = '';
    placeholder.style.display = 'none';
  }

  input.addEventListener('input', function () { apply(this.value); });
  // Jalankan sekali untuk nilai awal
  apply(input.value);
})();