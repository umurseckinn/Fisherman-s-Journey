# Zorluk Eğrisi ve Ekonomi Tasarım Dokümanı (Kod-Tabanlı Güncel Sürüm)

Bu doküman yalnızca kod içinden çıkarılan güncel verileri kullanır. Oyun içi .md dosyaları referans alınmamıştır.

---

## 1) Ekonomi Temeli (Koddan Doğrudan)

### 1.1 Para Birimleri
- Gold Doubloon: oyun içi para
- USD: gerçek para (doubloon ve booster paketleri)

### 1.2 Kalıcı Para Akışı
- Seans içinde kazanılan tüm para %100 oranında kalıcı bakiyeye aktarılır.
- Kalıcı para tekne, upgrade, booster ve fuel/repair giderlerinde harcanır.

### 1.3 Skor Formülü (Run Sonu)
- Base Score = Run boyunca kazanılan toplam coin
- Depth Bonus = maxLevelReached × 50
- King Bonus = kingFishCaught × 500
- Final Score = Base + Depth + King

---

## 2) Fuel, Repair ve Reklam Mekaniği

### 2.1 Fuel Maliyeti
- Her levelın base fuel cost değeri, global çarpanla artırılır.
- Final Fuel = round(Base Fuel × 1.6)

### 2.2 Repair Maliyeti
- Sabit tamir maliyeti: 60 Gold Doubloon

### 2.3 Reklam Ödülü
- Reklam izleme ödülü: +50 Gold Doubloon
- Sınırsız izlenebilir

---

## 3) Gerçek Para Paketleri

### 3.1 Gold Doubloon Paketleri
| Paket | Doubloon | Fiyat |
|------|----------|-------|
| Sailor’s Doubloon Pouch | 1.000 | $0.99 |
| Fisherman’s Doubloon Sack | 3.300 | $2.99 |
| Navigator’s Doubloon Box | 5.800 | $4.99 |
| Captain’s Doubloon Chest | 12.500 | $9.99 |
| Admiral’s Doubloon Vault | 26.000 | $19.99 |
| Poseidon’s Doubloon Hoard | 75.000 | $49.99 |

### 3.2 Booster Paketleri
- Mega Pack: 10x tüm boosterlar = $7.99
- Epic Pack: 3x tüm boosterlar = $2.99
- Tek booster 3x: $0.99
- Tek booster 1x: 500 Gold Doubloon

---

## 4) Balıklar ve Engeller (Ekonomi Değerleri)

### 4.1 Balık Değerleri
| Balık | Base Value | Speed Multiplier | Weight Multiplier |
|------|------------|------------------|------------------|
| bubble_fish | 8 | 1.2 | 2 |
| sakura_fish | 12 | 1.5 | 3 |
| zap_fish | 22 | 3.5 | 4 |
| candy_fish | 30 | 1.8 | 5 |
| moon_fish | 55 | 0.8 | 8 |
| lava_fish | 80 | 2.0 | 12 |
| crystal_fish | 240 | 2.2 | 18 |
| leaf_fish | 160 | 0.6 | 1 |
| tide_fish | 110 | 3.8 | 9 |
| mushroom_fish | 520 | 1.5 | 15 |
| king_fish | 900 | 5.5 | 35 |
| galaxy_fish | 380 | 4.5 | 7 |

### 4.2 Özel Objeler
| Obje | Base Value | Weight Multiplier | Not |
|------|------------|------------------|-----|
| gold_doubloon | 25 | 10 | Değeri dinamik artırılır |
| shell | 20 | 0 | Hafif bonus pickup |
| anchor | 200 | 10 | Ağır obje |
| shark_skeleton | -10 | 4 | Negatif değer |

### 4.3 Engeller
coral, sea_kelp, sea_kelp_horizontal, sea_rock, sea_rock_large, sunken_boat, whirlpool

---

## 5) Tekne Sistemi ve Yükseltmeler

### 5.1 Statlar
- Storage: kapasite (kg)
- Swing Speed: salınım hızı
- Cast Speed: atış hızı
- Return Speed: geri dönüş hızı
- Hook Depth: maksimum derinlik (%)
- Cast Attempts: hata toleransı (deneme hakkı)
- Coral Protection: coral hasar azaltma (max %100)
- Kelp Duration: kelp tuzağı süresi (saniye)

### 5.2 Rod Upgrade Bonusları (Tüm Tekneler İçin Aynı)
| Rod Lv | Swing Bonus | Cast Bonus | Return Bonus | Depth Bonus | Attempts Bonus | Coral Bonus | Kelp Reduction |
|--------|------------|-----------|-------------|------------|----------------|-------------|----------------|
| 1 | +0.002 | +0.12 | +0.10 | +5 | +0 | +10 | -0.15s |
| 2 | +0.003 | +0.18 | +0.16 | +7 | +1 | +15 | -0.20s |
| 3 | +0.004 | +0.24 | +0.22 | +9 | +1 | +20 | -0.25s |
| 4 | +0.005 | +0.30 | +0.28 | +10 | +1 | +25 | -0.30s |
| 5 | +0.006 | +0.36 | +0.34 | +11 | +1 | +30 | -0.35s |

### 5.3 Özel Tekne Modifikasyonları
- T4: Return Speed ×1.20
- T5: Swing Speed ×1.10
- T10: Boss seviyelerinde value multiplier ×2.5 (normalde ×1.5 veya ×2.0)
- T6: Skeleton ceza çarpanı 0.75 (negatif etki %25 azaltılır)
- T7: King Fish ağırlık gösterimi -5 kg (UI etkisi)
- T8: Radar booster süresi ×2.0
- T9: Sunken Boat pozitif tetiklenme şansı +%5
- Coral Protection %100 üstüne çıkmaz
- Kelp Duration 0’ın altına düşmez

### 5.4 Stat Hesaplama Mantığı (Koddan)
- StorageCapacity = BaseStorage + StorageUpgradeBonus
- SwingSpeed = BaseSwing + RodSwingBonus (T5 ile ×1.10 çarpılır)
- CastSpeed = BaseCast + RodCastBonus
- ReturnSpeed = BaseReturn + RodReturnBonus (T4 ile ×1.20 çarpılır)
- HookDepth = BaseDepth + RodDepthBonus
- CastAttempts = BaseAttempts + RodAttemptBonus
- CoralProtection = min(100, BaseCoral + RodCoralBonus)
- KelpDuration = max(0, BaseKelp + RodKelpReduction)

### 5.5 Tekne Listesi ve Yükseltme Maliyetleri

#### T1 — The Dinghy
- UnlockCost: 0, MinLevel: 1
- Base: Storage 22, Swing 0.007, Cast 0.40, Return 0.35, Depth 50, Attempts 1, Coral 0, Kelp 1.8
- Storage Upgrades: (Lv1 +8 / 20), (Lv2 +13 / 45 / req6), (Lv3 +18 / 90 / req16), (Lv4 +24 / 160 / req31), (Lv5 +32 / 275 / req51)
- Rod Costs: 25, 55, 110, 200, 350 (req: -,11,21,41,61)

#### T2 — The Painted Skiff
- UnlockCost: 100, MinLevel: 1
- Base: Storage 32, Swing 0.009, Cast 0.50, Return 0.45, Depth 56, Attempts 1, Coral 0, Kelp 1.6
- Storage Upgrades: (10/30), (16/70/req6), (22/140/req16), (28/250/req31), (36/425/req51)
- Rod Costs: 38, 85, 165, 300, 525

#### T3 — The Fiberglass
- UnlockCost: 367, MinLevel: 6
- Base: Storage 45, Swing 0.011, Cast 0.62, Return 0.55, Depth 63, Attempts 2, Coral 15, Kelp 1.4
- Storage Upgrades: (13/45), (20/100/req6), (27/200/req16), (34/360/req31), (43/625/req51)
- Rod Costs: 55, 125, 240, 440, 775

#### T4 — The Motor Cruiser
- UnlockCost: 917, MinLevel: 11
- Base: Storage 62, Swing 0.014, Cast 0.76, Return 0.68, Depth 70, Attempts 2, Coral 20, Kelp 1.2
- Storage Upgrades: (16/70), (24/150/req6), (32/290/req16), (42/525/req31), (54/900/req51)
- Rod Costs: 85, 185, 350, 650, 1100

#### T5 — The Speedster
- UnlockCost: 1667, MinLevel: 16
- Base: Storage 78, Swing 0.017, Cast 0.90, Return 0.82, Depth 76, Attempts 3, Coral 25, Kelp 1.0
- Storage Upgrades: (18/100), (28/210/req6), (38/400/req16), (50/725/req31), (64/1250/req51)
- Rod Costs: 120, 260, 500, 925, 1550

#### T6 — The Trawler
- UnlockCost: 3000, MinLevel: 21
- Base: Storage 96, Swing 0.019, Cast 1.02, Return 0.94, Depth 82, Attempts 3, Coral 35, Kelp 0.85
- Special: Skeleton ceza çarpanı 0.75
- Storage Upgrades: (22/140), (34/290/req6), (46/550/req16), (60/975/req31), (78/1650/req51)
- Rod Costs: 165, 350, 675, 1250, 2100

#### T7 — The Captain’s Vessel
- UnlockCost: 4667, MinLevel: 31
- Base: Storage 118, Swing 0.021, Cast 1.16, Return 1.08, Depth 87, Attempts 4, Coral 45, Kelp 0.70
- Special: King Fish ağırlık gösterimi -5 kg
- Storage Upgrades: (26/190), (40/390/req6), (54/725/req16), (70/1300/req31), (92/2200/req51)
- Rod Costs: 220, 460, 900, 1650, 2800

#### T8 — The Research Vessel
- UnlockCost: 7000, MinLevel: 41
- Base: Storage 144, Swing 0.023, Cast 1.30, Return 1.22, Depth 91, Attempts 4, Coral 55, Kelp 0.55
- Special: Radar booster süresi ×2.0
- Storage Upgrades: (30/250), (48/500/req6), (64/950/req16), (84/1700/req31), (110/2850/req51)
- Rod Costs: 290, 600, 1150, 2150, 3600

#### T9 — The Corsair
- UnlockCost: 10834, MinLevel: 61
- Base: Storage 168, Swing 0.025, Cast 1.44, Return 1.36, Depth 94, Attempts 5, Coral 65, Kelp 0.40
- Special: Sunken Boat pozitif tetiklenme şansı +%5
- Storage Upgrades: (34/325), (54/650/req6), (72/1200/req16), (94/2150/req31), (122/3600/req51)
- Rod Costs: 375, 775, 1500, 2800, 4650

#### T10 — The Legend
- UnlockCost: 17500, MinLevel: 81
- Base: Storage 200, Swing 0.028, Cast 1.60, Return 1.52, Depth 97, Attempts 5, Coral 75, Kelp 0.25
- Special: Boss seviyelerinde value multiplier ×2.5
- Storage Upgrades: (38/425), (60/850/req6), (80/1550/req16), (104/2750/req31), (136/4600/req51)
- Rod Costs: 490, 1000, 1950, 3600, 6000

---

## 6) Lanetler ve Boss Çarpanları

### 6.1 Lanet Tipleri (Kodda Tanımlı)
heavy_waters, fast_current, blind_spot, reverse_current, double_damage, economic_crisis, countdown, skeleton_army, fish_escape, time_bomb, dark_matter, chain_reaction, invisible_fish, reverse_market, random_loop, reverse_weight, random_curse, combo_1, combo_2, combo_3, final_1, final_2, final_3, one_chance

### 6.2 Lanet Uygulanan Level’lar
- L62 heavy_waters
- L63 fast_current
- L65 blind_spot
- L66 reverse_current
- L67 double_damage
- L69 economic_crisis
- L72 chain_reaction
- L73 invisible_fish
- L75 countdown
- L76 reverse_market
- L77 skeleton_army
- L79 random_curse
- L82 combo_1
- L83 combo_2
- L86 reverse_weight
- L87 fish_escape
- L89 combo_3
- L92 time_bomb
- L93 dark_matter
- L95 final_1
- L96 final_2
- L97 final_3
- L99 one_chance

### 6.3 Boss Level Çarpanları
- L10, L20, L30, L40, L50, L60, L70: ×1.5
- L80, L90: ×2.0
- L100: ×2.5
- T10 The Legend: boss seviyelerinde ×2.5

---

## 7) Level Bazlı Ekonomi Tablosu (Fuel + Süre)

Kodda tanımlı 8 bölge aralığı:
1) L1–L20  
2) L21–L30  
3) L31–L40  
4) L41–L50  
5) L51–L60  
6) L61–L70  
7) L71–L80  
8) L81–L100

| Level | Süre | Base Fuel | Final Fuel |
|------|------|-----------|------------|
| 1 | 50 | 25 | 40 |
| 2 | 50 | 28 | 45 |
| 3 | 50 | 32 | 51 |
| 4 | 49 | 36 | 58 |
| 5 | 49 | 42 | 67 |
| 6 | 47 | 48 | 77 |
| 7 | 52 | 44 | 70 |
| 8 | 48 | 55 | 88 |
| 9 | 46 | 62 | 99 |
| 10 | 52 | 58 | 93 |
| 11 | 48 | 68 | 109 |
| 12 | 47 | 72 | 115 |
| 13 | 53 | 62 | 99 |
| 14 | 46 | 78 | 125 |
| 15 | 46 | 82 | 131 |
| 16 | 48 | 86 | 138 |
| 17 | 47 | 90 | 144 |
| 18 | 47 | 94 | 150 |
| 19 | 45 | 98 | 157 |
| 20 | 58 | 120 | 192 |
| 21 | 48 | 160 | 256 |
| 22 | 47 | 163 | 261 |
| 23 | 43 | 166 | 266 |
| 24 | 54 | 152 | 243 |
| 25 | 48 | 170 | 272 |
| 26 | 47 | 173 | 277 |
| 27 | 47 | 176 | 282 |
| 28 | 46 | 179 | 286 |
| 29 | 54 | 160 | 256 |
| 30 | 58 | 200 | 320 |
| 31 | 48 | 210 | 336 |
| 32 | 47 | 214 | 342 |
| 33 | 44 | 217 | 347 |
| 34 | 54 | 198 | 317 |
| 35 | 48 | 220 | 352 |
| 36 | 46 | 223 | 357 |
| 37 | 47 | 226 | 362 |
| 38 | 46 | 229 | 366 |
| 39 | 44 | 232 | 371 |
| 40 | 60 | 260 | 416 |
| 41 | 48 | 270 | 432 |
| 42 | 47 | 273 | 437 |
| 43 | 46 | 276 | 442 |
| 44 | 54 | 255 | 408 |
| 45 | 48 | 280 | 448 |
| 46 | 46 | 283 | 453 |
| 47 | 47 | 286 | 458 |
| 48 | 46 | 289 | 462 |
| 49 | 44 | 292 | 467 |
| 50 | 62 | 320 | 512 |
| 51 | 50 | 330 | 528 |
| 52 | 48 | 333 | 533 |
| 53 | 55 | 315 | 504 |
| 54 | 48 | 336 | 538 |
| 55 | 47 | 339 | 542 |
| 56 | 47 | 342 | 547 |
| 57 | 46 | 345 | 552 |
| 58 | 46 | 348 | 557 |
| 59 | 45 | 352 | 563 |
| 60 | 65 | 380 | 608 |
| 61 | 50 | 390 | 624 |
| 62 | 48 | 393 | 629 |
| 63 | 48 | 396 | 634 |
| 64 | 55 | 375 | 600 |
| 65 | 48 | 400 | 640 |
| 66 | 48 | 403 | 645 |
| 67 | 47 | 406 | 650 |
| 68 | 55 | 385 | 616 |
| 69 | 47 | 410 | 656 |
| 70 | 68 | 430 | 688 |
| 71 | 50 | 440 | 704 |
| 72 | 48 | 443 | 709 |
| 73 | 48 | 446 | 714 |
| 74 | 55 | 420 | 672 |
| 75 | 48 | 450 | 720 |
| 76 | 48 | 453 | 725 |
| 77 | 47 | 456 | 730 |
| 78 | 55 | 430 | 688 |
| 79 | 46 | 458 | 733 |
| 80 | 70 | 480 | 768 |
| 81 | 50 | 490 | 784 |
| 82 | 48 | 493 | 789 |
| 83 | 47 | 496 | 794 |
| 84 | 55 | 470 | 752 |
| 85 | 35 | 500 | 800 |
| 86 | 48 | 503 | 805 |
| 87 | 47 | 506 | 810 |
| 88 | 54 | 480 | 768 |
| 89 | 46 | 508 | 813 |
| 90 | 72 | 530 | 848 |
| 91 | 50 | 540 | 864 |
| 92 | 48 | 543 | 869 |
| 93 | 47 | 546 | 874 |
| 94 | 55 | 520 | 832 |
| 95 | 47 | 550 | 880 |
| 96 | 46 | 553 | 885 |
| 97 | 46 | 556 | 890 |
| 98 | 45 | 558 | 893 |
| 99 | 48 | 560 | 896 |
| 100 | 75 | 600 | 960 |

---

## 8) Notlar
- Fuel maliyeti her level için sabittir, dinamik olarak değişmez.
- Repair maliyeti sabittir.
- Balık değerleri boss çarpanları ile büyür.
