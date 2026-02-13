# Ürün Gereksinimleri Dokümanı (PRD)

- Sürüm: 0.1 (Taslak)
- Tarih: YYYY-AA-GG
- Sahip: İsim Soyisim / Ekip

## 1) Özet
[Kısa 3-5 cümlede ürünün ne olduğu ve neden şimdi yapıldığı.]

## 2) Amaç ve Hedefler
- Amaç: [İş problemi ve değer önerisi]
- Hedefler (SMART):
  - [Örn: Kayıt dönüşüm oranını %X artırmak]
  - [Örn: Müşteri destek taleplerini %Y azaltmak]

## 3) Problem Tanımı
[Mevcut durum, kullanıcı ağrıları, fırsat alanı. Varsa veri/kanıt ekleyin.]

## 4) Kapsam
- Kapsam Dahil:
  - [Maddeler]
- Kapsam Dışı:
  - [Maddeler]

## 5) Kullanıcılar ve Personalar
- Birincil Persona: [Rol, motivasyon, hedef]
- İkincil Personalar: [Varsa belirtin]

## 6) Kullanım Senaryoları / User Stories
- Biçim: “Bir [persona] olarak, [ihtiyaç], böylece [fayda].”
- Örnek User Story:
  - Bir yeni kullanıcı olarak, e-postamla hızlı kayıt olmak istiyorum, böylece ürünü hemen deneyebilirim.
  - Kabul Kriterleri:
    - [Kriter 1]
    - [Kriter 2]

## 7) Gereksinimler
### 7.1 Fonksiyonel Gereksinimler
1. [Örn: Kullanıcı e-posta ile kayıt olabilmeli]
2. [Örn: Şifre sıfırlama bağlantısı e-posta ile gönderilmeli]

### 7.2 Fonksiyonel Olmayan Gereksinimler
- Performans: [Örn: P95 yanıt süresi < 300ms]
- Güvenlik: [Örn: Parolalar bcrypt ile hash’lenir]
- Erişilebilirlik: [Örn: WCAG 2.1 AA]
- Uyum/Gizlilik: [Örn: KVKK/GDPR]
- Ölçeklenebilirlik: [Örn: Eşzamanlı 10k kullanıcı]
- Gözlemlenebilirlik: [Loglama, metrikler, alarm eşikleri]

## 8) Akışlar ve Ekranlar
- Başlıca Akışlar: [Kayıt, Giriş, Şifre Sıfırlama, vb.]
- Ekranlar/Mockup: [Link veya dosya adı]

## 9) Veri ve Mimari
- Veri Modelleri: [Örn: User(id, email, created_at, ...)]
- API Uçları: [Örn: POST /api/v1/signup]
- Entegrasyonlar: [3. parti servisler, bağımlılıklar]

## 10) Analitik ve Başarı Ölçütleri (KPI)
- Birincil KPI’lar: [Örn: Aktivasyon oranı, Dönüşüm]
- İkincil KPI’lar: [Örn: Hata oranı, NPS]
- Ölçüm Planı: [Event isimleri, analytics şeması]

## 11) Varsayımlar
- [Örn: Kullanıcıların %X’i e-posta ile kayıt olmayı tercih eder]

## 12) Bağımlılıklar
- [Örn: Kimlik doğrulama servisi, Tasarım sistemi sürümü]

## 13) Riskler ve Azaltım Planı
- Risk: [Örn: E-posta spam filtrelerine takılma] → Azaltım: [Örn: DMARC/DKIM/SPF]
- Risk: [...] → Azaltım: [...]

## 14) Açık Sorular
- [Cevap bekleyen kararlar]

## 15) Zaman Çizelgesi / Yol Haritası
- Milestone 1: [Tanım, tarih]
- Milestone 2: [Tanım, tarih]

## 16) Yayın / Rollout Planı
- Ortamlar: [Staging → Canary → Production]
- Özellik bayrakları: [Varsa]
- Geri alma (rollback) stratejisi: [Kısa plan]

## 17) Kabul Kriterleri / Definition of Done
- Gereksinimler karşılandı
- Testler (birim/entegrasyon) eşiği sağlandı
- Dokümantasyon güncel
- İzleme/alarmlar aktif
- Güvenlik ve gizlilik kontrolleri tamam

## 18) Ekler
- Referanslar, bağlantılar, ilgili dokümanlar
