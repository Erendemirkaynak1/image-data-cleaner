# ClearPixel — Product & UI Roadmap

> Amaç: ClearPixel'i hızlı, güvenilir, erişilebilir ve profesyonel görünümlü bir tarayıcı tabanlı görsel gizlilik aracına dönüştürmek.
>
> Temel ilkeler: **önce gizlilik**, doğrulanabilir sonuçlar, sade arayüz, mobil uyumluluk ve güvenilir hata yönetimi.

## 1. Arayüz ve kullanıcı deneyimi

- [ ] **Görsel tasarım sistemini tamamla**
  - Renk, tipografi, boşluk, kenarlık, gölge ve durum renklerini tutarlı tasarım token'larına taşı.
  - Açık ve koyu temada tüm panellerin, alanların ve durumların kontrastını kontrol et.
  - Buton, input, select, tooltip ve bildirimler için ortak bileşen stilleri oluştur.
- [ ] **Yükleme alanını geliştir**
  - Sürükle-bırak, dosya seçici ve panodan yapıştırma akışlarını tek ve anlaşılır deneyimde birleştir.
  - Dosya türü, boyut ve çözünürlük sınırlarını yükleme öncesinde açıkça göster.
  - Yükleme sırasında ilerleme ve dosya bazında hata açıklaması sun.
- [ ] **Görsel önizleme deneyimini iyileştir**
  - Orijinal ve temizlenmiş görseli karşılaştırmak için sürüklenebilir önce/sonra karşılaştırıcısı ekle.
  - Yakınlaştırma, uzaklaştırma ve görsele sığdırma kontrolleri ekle.
  - Büyük görsellerde taşma ve performans sorunlarını önle.
- [ ] **Dosya kuyruğunu zenginleştir**
  - Arama, sıralama ve durum filtreleri ekle.
  - Dosya başına işlem durumu, boyut, ölçüler ve sonuç bilgilerini daha okunaklı göster.
  - Toplu seçim, seçilenleri kaldırma ve kuyruğu temizleme akışlarını ekle.
- [ ] **İşlem geri bildirimi**
  - Toplu işlem ilerlemesi ve tahmini kalan iş durumunu göster.
  - Başarı, uyarı ve hata bildirimlerini tutarlı hale getir.
  - Boş durumlar ve ilk kullanım yönlendirmelerini iyileştir.

## 2. Temel özellikler

- [ ] **Gelişmiş metadata raporu**
  - EXIF, IPTC, XMP, GPS, yorumlar ve diğer desteklenen metadata türlerini ayrı ayrı raporla.
  - Temizleme öncesi ve sonrası tespitleri karşılaştır.
  - Doğrulama sonucunu kullanıcıya anlaşılır ve teknik olarak doğru biçimde sun.
- [ ] **Temizleme profilleri**
  - Gizlilik odaklı tam temizleme ve desteklenen güvenli çıktı seçenekleri sun.
  - Kullanıcının seçtiği çıktı biçimi ve kalite ayarlarını net biçimde göster.
- [ ] **İşlem geçmişi**
  - Oturum içinde tamamlanan işlemleri listele.
  - İsteğe bağlı geçmişi yalnızca tarayıcıda tut; kullanıcıya temizleme kontrolü ver.
  - Varsayılan olarak görsel dosyalarını veya hassas metadata'yı kalıcı saklama.
- [ ] **Dışa aktarma**
  - Tekil dosya indirme ve doğrulanmış ZIP indirme akışlarını geliştir.
  - ZIP içinde yalnızca doğrulamadan geçen dosyaların bulunmasını garanti et.
  - İndirme öncesi dosya adları ve toplam boyut özeti göster.

## 3. Erişilebilirlik ve responsive tasarım

- [ ] Tüm etkileşimleri klavye ile kullanılabilir hale getir.
- [ ] Odak göstergelerini, ekran okuyucu etiketlerini ve canlı durum bildirimlerini tamamla.
- [ ] Renk kontrastlarını WCAG 2.2 AA hedefleriyle kontrol et.
- [ ] Mobil, tablet, dizüstü ve geniş ekran düzenlerini test et.
- [ ] Hareket azaltma tercihini ve düşük animasyon modunu destekle.

## 4. Güvenlik, gizlilik ve performans

- [ ] Dosya imzası doğrulamasını ve biçime özgü metadata tarayıcılarını genişlet.
- [ ] Bozuk, kesilmiş veya şüpheli dosya yapılarını güvenli biçimde reddet.
- [ ] İşlem sonrası metadata doğrulamasını zorunlu tut; doğrulanamayan çıktıyı indirmeye açma.
- [ ] Büyük dosya ve yüksek çözünürlüklü görseller için bellek kullanımını izle ve optimize et.
- [ ] Geçici Object URL ve canvas kaynaklarının her hata/iptal akışında temizlendiğini doğrula.
- [ ] Harici font, analitik veya görsel yükleme gereksinimi olmadan yerel işleme ilkesini koru.
- [ ] CSP ve güvenlik başlıklarını uygulama özellikleriyle uyumlu tut.

## 5. Test ve kalite

- [ ] Metadata tarayıcıları için JPEG, PNG ve WEBP regresyon testlerini genişlet.
- [ ] EXIF, IPTC, XMP, GPS ve bozuk segment/chunk senaryolarını kapsa.
- [ ] Yükleme sınırları, yinelenen dosyalar, iptal, yeniden deneme ve eşzamanlı işlem senaryolarını test et.
- [ ] Playwright ile temel uçtan uca kullanıcı akışlarını ekle.
- [ ] Masaüstü ve mobil viewport'larda görsel regresyon kontrolleri oluştur.
- [ ] CI içinde audit, test ve production build adımlarını koru; her yeni değişiklikte sonuçları incele.

## 6. Yayına hazırlık

- [ ] README'yi ekran görüntüleri, özellikler, gizlilik modeli ve kullanım adımlarıyla güncelle.
- [ ] Sürüm notları ve değişiklik günlüğü oluştur.
- [ ] Hata durumları, desteklenen biçimler ve sınırlar için yardım bölümü ekle.
- [ ] Son erişilebilirlik, güvenlik, performans ve tarayıcı uyumluluğu kontrolünü yap.

---

## Uygulama sırası

1. Arayüz tutarlılığı, responsive düzen ve erişilebilirlik.
2. Önizleme ve dosya kuyruğu deneyimi.
3. Metadata raporu ve temizleme profilleri.
4. İşlem geçmişi ve dışa aktarma iyileştirmeleri.
5. Güvenlik, performans ve kapsamlı otomasyon testleri.
6. Dokümantasyon ve yayın hazırlığı.

## Tamamlanma ölçütleri

Bir madde ancak kodu depoya aktarıldığında, ilgili testler çalıştırıldığında ve sonuçlar incelendiğinde tamamlandı olarak işaretlenir. CI sonucu alınmamış veya başarısız olan işler tamamlandı sayılmaz.

**Not:** Bu dosya yaşayan bir yol haritasıdır. Öncelikler, test bulguları ve kullanıcı geri bildirimleri doğrultusunda güncellenmelidir.
