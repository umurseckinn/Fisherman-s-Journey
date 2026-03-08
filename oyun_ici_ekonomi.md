# Fisherman - Oyun İçi Ekonomi ve İlerleme Rehberi

Oyun döngüsü, **"Maksimum gelir hedeflerken batma riskini yönetmek"** üzerine kuruludur (Ağırlık vs. Değer gerilimi). Oyuncu her adada (Bölge) yakıt parasını çıkarmak zorundadır. Yeterli gelir elde edilemezse **Game Over** olur.

---

## 1. Balıkların Ekonomik Değerleri ve Fiziksel Özellikleri

Oyunda 12 farklı balık türü bulunur. Her balığın market değeri, tekneye bindirdiği ağırlık yükü (kg/birim) ve zorluğu dengelenmiştir.

| Balık Türü (Adı) | Market Değeri (Geliri) | Ağırlık (Birim/kg) | Boyut (Birim) | Hız (Birim/sn) | Özel Etki (Tutulunca) |
|:---:|:---:|:---:|:---:|:---:|---|
| **Bubble Fish** | 8 - 15 🪙 | 2 birim | 3x2.5 | 1.2 | Patlar, zararsızdır. |
| **Sakura Fish** | 12 - 25 🪙 | 3 birim | 3.5x3 | 1.5 | Petal efekti, zararsız. |
| **Zap Fish** | 22 - 40 🪙 | 4 birim | 4x2.5 | 3.5 | 3sn elektrik (diğer balıklar %50 kaçabilir). |
| **Candy Fish** | 30 - 55 🪙 | 5 birim | 3.5x4 | 1.8 | Teknedeki tüm yükü -1 birim azaltır. |
| **Moon Fish** | 55 - 80 🪙 | 8 birim | 5x3 | 0.8 | Büyüsüyle 10sn tüm balıkları %40 yavaşlatır. |
| **Lava Fish** | 80 - 110 🪙 | 12 birim | 4.5x4 | 2.0 | 5sn yangın yaratır (Saniyede +1 geçici ağırlık ekler). |
| **Tide Fish** | 110 - 150 🪙 | 9 birim | 5.5x3 | 3.8 | Tekneyi sallar, %20 şansla tekneden random balık düşürür. |
| **Leaf Fish** | 160 - 200 🪙 | 1 birim | 4x3.5 | 0.6 | **Gelir Bonusu:** Tüm balıkların market değerini tek seferlik %10 artırır (max %30). |
| **Crystal Fish**| 240 - 300 🪙 | 18 birim | 4x4 | 2.2 | Değer değişimi: %40 şansla +50🪙, %40 sabit, %20 şansla -30🪙 değer kaybeder. |
| **Galaxy Fish** | 380 - 450 🪙 | 7 birim | 5x3.5 | 4.5 | Bonus: %30 şansla anında +100🪙 veya %30 yakıt +%10. |
| **Mushroom F.** | 520 - 600 🪙 | 15 birim | 4x5 | 1.5 | Rastgele 1 balığın market değerini **2 KATINA** çıkarır. |
| **King Fish** | 900 - 1000 🪙| 35 birim | 7x4 | 5.5 | Efsanevi balık. Yakalandığında tüm değerleri %20 artırır ancak devasa (35 birim) ağırlığı direkt batırma riski taşır. |

*(Not: Tasarım dosyalarında balık gelirleri için ana (base) fiyatlar ve markette dinamik değişebilen tavan/taban fiyat etkileri mevcuttur)*

### Diğer Toplanabilir "Ekonomi" Elementleri
- **Shell (Deniz Kabuğu):** +1 ağırlık. Anında +20🪙 verir. İçinden %25 şansla küçük balık veya %10 şansla Olta Tamiri çıkabilir.
- **Treasure Chest:** +8 ağırlık. Anında 80-200🪙 nakit + %60 nadir balık + %20 tamir verebilir. Ağırlık limiti boş değilse açılması ölümcüldür.
- **Sunken Boat:** +5 ağırlık. %35 basit balık, %25 (50-120🪙 + orta balık), %20 bomboş, %15 Nadir balık, %5 **Lanet**. (Riskli sandık).
- **Shark Skeleton:** Lanet engeli. Çarpıldığında **10🪙 para** nakit olarak silinir, 1 olta hakkı gider ve tüm balıklar 5sn kaçışır (panik modu).

---

## 2. Bölgesel (Level) Market Fiyatları ve Araç Yükseltmeleri

Oyunda her 4 seviyede bir "Ada Marketi" açılır. Oyuncu önce balıklarını bozdurur, parayı alır, isteğe bağlı envanter/yükseltme alır ve **sonraki aşamaya geçmek için zorunlu yakıtı satın almak zorundadır.**

### 🛥 Tekne (Araç Değerleri & Storage Yükseltimi)

Teknenin "Kapasite (Storage)" değeri, teknenin ağırlık limitini belirler. Bu limiti geçerse tekne batar ve ölürsünüz.
* **Tekne Lv1 (Tahta Sandal):** Başlangıç. Fiyat: Ücretsiz. Özellik yok. Base Storage: **60 birim** (max. 100 limitine yükseltmeler ile çıkabilir taban dizaynı 60'dır).
* **Tekne Lv2 (Fiber Tekne):** Fiyat: **180 🪙** (*Bölge 1-2 Marketinde alınabilir*). Kapasite (Storage): **90 birim**. Özellik: Tide Fish sallantı etkisini %50 azaltır.
* **Tekne Lv3 (Kaptan Teknesi):** Fiyat: **380 🪙** (*Bölge 2-4 Marketinde alınabilir*). Kapasite (Storage): **130 birim** (max 220). Özellik: Lava Fish yangın etkisini 3sn'ye düşürür. Whirlpool ağırlık göstergesini bozamaz.

### 🎣 Olta (Rod Yükseltimi & Özellikleri)

Olta yükseltmeleri; atış (cast) hakkını, fırlatma hızını ve yakalama (hitbox) alanını doğrudan artırır.
* **Olta Lv1 (Bambu Olta):** Başlangıç. Hız: Base. Fırlatma: 9 birim/sn. Hitbox: 1.0x. Base Atış Hakkı (Kabiliyet): **3 atış**. (Haklar biterse kanca atılamaz = oyun biter).
* **Olta Lv2 (Karbon Olta):** Fiyat: **100 🪙** (*Bölge 1-2'de açılır*). Fırlatma hızı: +%15 (11 br/sn). Hitbox: 1.2x. Atış Hakkı: **4 atış**. Özellik: Mercan kırıklarında %30 şansla olta hasar almaz.
* **Olta Lv3 (Titanium Olta):** Fiyat: **220 🪙** (*Bölge 2-4'te açılır*). Fırlatma hızı: +%30 (13 br/sn). Hitbox: 1.4x. Atış Hakkı: **5 atış**. Özellik: Sea Kelp %50 daha az süre takılır, Mercanda kırılmama ihtimali %60'tır.

* **Olta Tamiri:** Kırılan atış haklarını onarmak için marketten "+1 Hak onarımı" **30 🪙**, "Tam Full onarım" ise **80 🪙** bedelindedir.

---

## 3. Oyun İçi İlerleme Mantığı ve Market Zorlukları (Progression)

Oyun 5 bölgeye (toplam 20 level) ayrılmıştır. İlerleme mantığı, yakıt enflasyonuna ve daha nadir, daha ağır balıkların ortaya çıkışına dayanır.

| Bölge / Level | Gerekli Yakıt Parası | Market Açılışı (Seviye Sonu) | Eklenen Satın Alımlar / Booster Fiyatları | Tahmini/Gerekli Gelir |
|:---|:---|:---|:---|:---|
| **Bölge 1** (Lv 1-4) | **450 🪙** | Lv 4 sonu | Tekne Lv2(180🪙), Olta Lv2(100🪙), 2x Puan(90🪙), Magnet(110🪙) | Hedef Gelir: 450-900🪙. (Sadece yakıt karşılanabilir, yükseltmeye zor yeter.) |
| **Bölge 2** (Lv 5-8) | **840 🪙** | Lv 8 sonu | Tekne Lv3(380🪙), Olta Lv3(220🪙), Yavaşlatıcı(70🪙) | Hedef Gelir: 840-1800🪙. (Orta ağırlıklı ekonomik baskı başlar.) |
| **Bölge 3** (Lv 9-12) | **1350 🪙** | Lv 12 sonu | Olta Kalkanı(130🪙), Hafifletici(100🪙), Radar(120🪙) | Hedef Gelir: 1350-3000🪙. (Gece başlar, 1350 kazanmak için nadir balık şarttır.)|
| **Bölge 4** (Lv 13-16)| **2100 🪙** | Lv 16 sonu | *Ekipman alımında son şans* | Hedef Gelir: 2100-4500🪙. (King Fish / Crystal çok tutulmalı, ölüm riski had safhada.)|
| **Bölge 5** (Lv 17-20)| **Yok** | Yok (Market Yok) | (Sadece hayatta kalıp, ağırlık dengesini kurmak.) | *Market yok.* Ağırlık batmasından kaçıp final kazanılır. |

👉 **Progression Özeti:** Oyunu bitirebilmek için 20 Seviye boyunca harcanması gereken miktar sadece yakıt hesaba katılırsa **Minimum 4740 🪙** tutarındadır. Ekipman yükseltmeleri (Örn: Olta Lv3 + Tekne Lv3 = +600 🪙) ekstra risk ve başarılı balık yakalaması gerektirir.

---

## 4. Seviyelere Göre Balık Çıkış (Spawn) Miktarları ve Oranları

Her bölgede zorluk ivmelenerek artar ve oyuncunun karşılaştığı balık türleri seyrekleşip/değerlenir. Aynı anda ekranda bulunacak balık limiti artırılmıştır. Bölge ve level arttıkça zorunlu devasa ağırlık riskine girilmelidir.

### Bölge 1 - Başlangıç Körfezi (Level 1-4)
* **Kapasite:** 60 birim
* **Max Ekranda Balık:** 3-6 adet arası.
* **Spawnlar:** Bubble (%90 -> %65'e düşer), Sakura (%70 -> %55), Zap (%30 -> %50'ye çıkar), Candy (%20->%35), Moon (%10->%15 nadir olarak son levellarda görünür).

### Bölge 2 - Mercan Adaları (Level 5-8)
* **Kapasite:** 60-90 birim. (İlk defa tekne alanlar rahatlar).
* **Max Ekranda Balık:** 4-7 adet arası.
* **Spawnlar (Yeni Balıklar):** Lava Fish (%15-%25) ve Tide Fish (%10-%20) oyuna katılır. Yaprak (Leaf) balığı level 7'den itibaren %8-10 oranla gelerek ekonomi stratejisini kökünden değiştirir (Leaf balık, tüm ağırlık/değer metasını esnetir).

### Bölge 3 - Derin Mavi (Level 9-12)
* **Kapasite:** 60, 90 veya alanlar için 130 birim.
* **Max Ekranda Balık:** 5-8 adet arası.
* **Spawnlar (Yeni Balıklar):** Bu bölge kırılma noktasıdır. Crystal Fish (%8-%13) ağır (18kg) ama muazzam değerle (300🪙) gelir. Galaxy Fish (%6-%9), Mushroom Fish (%5-%6 L11'den itibaren) işleri değiştirir.

### Bölge 4 - Fırtına Geçidi (Level 13-16)
* **Max Ekranda Balık:** 6-9 adet arası.
* **Spawnlar (Yeni Balıklar):** Tavan noktası **King Fish** devriyeye başlar. Çıkma oranı %2'den %5'e kadar tırmanır. 60 kapasite birimi olan başlangıç teknesine sahip bir oyuncu King Fish'i (35 ağırlık birimi) yakalamaya çalışırsa neredeyse kesin batar. Bubble balık oranları çöp olur (%22 -> %12'lere kadar ufalır). Oyuncu sadece yakıt toplayabilmek için Lava, Crystal, Moon ve Candy kovalamak zorunda bırakılır.

### Bölge 5 - Efsane Adası (Level 17-20)
* **Max Ekranda Balık:** 7-12 adet arası devasa balık sürüleri göze çarpar.
* **Spawnlar:** Bubble fish %10'dan %3'e kadar iner. Çok nadirlerdir. Okyanus tamamen dev / elit balıklarla doludur (Crystal %20, Galaxy %17, Mushroom %14, King Fish %15 oranına kadar ulaşır). Bu aşamada market kapanır ve oyuncu 20'nci seviyenin sonuna hiçbir şekilde batmadan ulaşarak oyunu kazanmaya çalışır. 
