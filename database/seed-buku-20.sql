-- ============================================================
-- SEED 20 BUKU + COVER (Open Library)
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

-- Kosongkan buku lama (opsional, hilangkan jika ingin menambah)
-- DELETE FROM public.transaksi WHERE id_buku IS NOT NULL;
-- DELETE FROM public.rating;
-- DELETE FROM public.buku;

INSERT INTO public.buku (judul, penulis, penerbit, tahun_terbit, kategori, stok, lokasi, rating, rating_count, kualitas, deskripsi, isbn, cover_url) VALUES
  ('Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 'Fiksi', 5, 'Rak A-1', 4.8, 12, 'Baik', 'Novel ikonik yang menceritakan perjuangan sejumlah anak Belitung dalam mengejar pendidikan. Intinya: semangat, persahabatan, dan tekad melawan keterbatasan demi meraih mimpi.', '978-979-3062-92-1', 'https://covers.openlibrary.org/b/id/7079796-L.jpg'),
  ('Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, 'Fiksi', 3, 'Rak A-2', 4.7, 9, 'Baik', 'Novel sejarah kolonial tentang Minke, pemuda pribumi terdidik di era Hindia Belanda.', '978-979-4071-77-5', 'https://covers.openlibrary.org/b/id/6643692-L.jpg'),
  ('Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, 'Nonfiksi', 4, 'Rak B-1', 4.6, 8, 'Baik', 'Buku praktis tentang filsafat Stoisisme yang relevan untuk kehidupan modern.', '978-602-291-882-6', 'https://covers.openlibrary.org/b/id/15155833-L.jpg'),
  ('Atomic Habits', 'James Clear', 'Avery', 2018, 'Pengembangan Diri', 2, 'Rak B-2', 4.7, 10, 'Baik', 'Buku pengembangan diri tentang kekuatan kebiasaan kecil. Intinya: perubahan besar datang dari perbaikan 1% setiap hari secara konsisten.', '978-602-291-885-7', 'https://covers.openlibrary.org/b/id/12539702-L.jpg'),
  ('Negeri 5 Menara', 'Ahmad Fuadi', 'Gramedia', 2009, 'Fiksi', 6, 'Rak A-3', 4.6, 7, 'Baik', 'Kisah enam sahabat santri di Pondok Madani yang masing-masing bermimpi menaklukkan dunia.', '978-979-2234-39-2', 'https://covers.openlibrary.org/b/id/14303993-L.jpg'),
  ('Sang Pemimpi', 'Andrea Hirata', 'Bentang Pustaka', 2006, 'Fiksi', 4, 'Rak A-1', 4.5, 6, 'Baik', 'Sekuel Laskar Pelangi tentang Ikal, Arai, dan Jimbron yang bermimpi besar hingga melanjutkan pendidikan ke luar negeri.', '978-979-2232-42-0', 'https://covers.openlibrary.org/b/id/15218349-L.jpg'),
  ('Harry Potter dan Batu Filsafat', 'J.K. Rowling', 'Scholastic', 1997, 'Fiksi', 3, 'Rak D-1', 4.9, 15, 'Baik', 'Seorang penyihir muda memulai petualangan di Hogwarts School of Witchcraft and Wizardry.', '978-0-590-35340-3', 'https://covers.openlibrary.org/b/id/15155833-L.jpg'),
  ('The Alchemist', 'Paulo Coelho', 'HarperOne', 1988, 'Fiksi', 2, 'Rak D-2', 4.5, 8, 'Baik', 'Petualangan Santiago mengejar mimpi dan harta karun di padang pasir Mesir.', '978-0-06-112241-5', 'https://covers.openlibrary.org/b/id/7414780-L.jpg'),
  ('The Lightning Thief', 'Rick Riordan', 'Disney Hyperion', 2005, 'Fiksi', 3, 'Rak D-3', 4.6, 7, 'Baik', 'Percy Jackson menemukan bahwa ia adalah anak dewa Yunani dan memulai petualangan menghentikan pencurian petir Zeus.', '978-0-7868-5629-9', 'https://covers.openlibrary.org/b/id/7239831-L.jpg'),
  ('Diary of a Wimpy Kid', 'Jeff Kinney', 'Abrams Books', 2007, 'Fiksi', 4, 'Rak D-4', 4.3, 6, 'Baik', 'Catatan harian Greg Heffley yang penuh kekonyolan dan petualangan masa sekolah.', '978-0-8109-9313-6', 'https://covers.openlibrary.org/b/id/14376136-L.jpg'),
  ('The Lord of the Rings', 'J.R.R. Tolkien', 'Allen & Unwin', 1954, 'Fiksi', 2, 'Rak D-5', 4.9, 20, 'Baik', 'Epik fantasi tentang Frodo Baggins dan perjalanan menghancurkan Cincin Kekuasaan.', '978-0-618-64561-9', 'https://covers.openlibrary.org/b/id/14625765-L.jpg'),
  ('The Hunger Games', 'Suzanne Collins', 'Scholastic', 2008, 'Fiksi', 3, 'Rak D-6', 4.6, 9, 'Baik', 'Katniss Everdeen bertahan hidup dalam arena Hunger Games yang mematikan di Panem.', '978-0-439-02348-1', 'https://covers.openlibrary.org/b/id/12646537-L.jpg'),
  ('Divergent', 'Veronica Roth', 'Katherine Tegen', 2011, 'Fiksi', 2, 'Rak D-7', 4.4, 6, 'Baik', 'Tris Prior menemukan bahwa dirinya tidak cocok dengan satu fraksi di dunia yang terbagi.', '978-0-06-202403-9', 'https://covers.openlibrary.org/b/id/13274634-L.jpg'),
  ('The Maze Runner', 'James Dashner', 'Delacorte Press', 2009, 'Fiksi', 3, 'Rak D-8', 4.3, 5, 'Baik', 'Thomas terbangun di sebuah labirin misterius tanpa ingatan, dikelilingi anak laki-laki lain.', '978-0-385-73797-5', 'https://covers.openlibrary.org/b/id/10464801-L.jpg'),
  ('Twilight', 'Stephenie Meyer', 'Little, Brown', 2005, 'Fiksi', 2, 'Rak D-9', 4.2, 7, 'Baik', 'Kisah cinta antara Bella Swan dan vampir Edward Cullen di kota Forks.', '978-0-316-06792-8', 'https://covers.openlibrary.org/b/id/12641977-L.jpg'),
  ('Naruto Vol.1', 'Masashi Kishimoto', 'Shueisha', 1999, 'Komik', 5, 'Rak E-1', 4.7, 11, 'Baik', 'Naruto Uzumaki, ninja muda hiperaktif, bermimpi menjadi Hokage di Desa Konoha.', NULL, 'https://covers.openlibrary.org/b/id/7335243-L.jpg'),
  ('Becoming', 'Michelle Obama', 'Crown Publishing', 2018, 'Nonfiksi', 2, 'Rak B-3', 4.7, 8, 'Baik', 'Memoir Michelle Obama tentang perjalanan hidupnya dari South Side Chicago hingga Gedung Putih.', '978-1-5247-6313-8', 'https://covers.openlibrary.org/b/id/8824664-L.jpg'),
  ('Steve Jobs', 'Walter Isaacson', 'Simon & Schuster', 2011, 'Nonfiksi', 2, 'Rak B-4', 4.5, 6, 'Baik', 'Biografi pendiri Apple yang mengubah wajah industri teknologi.', '978-1-4516-4853-9', 'https://covers.openlibrary.org/b/id/12374726-L.jpg'),
  ('Thinking, Fast and Slow', 'Daniel Kahneman', 'Farrar, Straus', 2011, 'Nonfiksi', 3, 'Rak B-5', 4.6, 5, 'Baik', 'Mengupas dua sistem pemikiran manusia: cepat-intuitif dan lambat-analitis.', '978-0-374-53355-7', 'https://covers.openlibrary.org/b/id/13290711-L.jpg'),
  ('Sapiens', 'Yuval Noah Harari', 'Harper', 2014, 'Nonfiksi', 3, 'Rak B-6', 4.7, 9, 'Baik', 'Sejarah singkat umat manusia dari era batu hingga era teknologi modern.', '978-0-06-231609-7', 'https://covers.openlibrary.org/b/id/8634250-L.jpg');
