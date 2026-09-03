# Eşel Mobil

Eşel Mobil; yakıt fiyatı, TÜFE ve asgari ücret değişimlerini belirlenen ağırlıklarla birleştirerek toplu ulaşım tarifeleri için önerilen değişim oranını hesaplayan web tabanlı bir değerleme aracıdır. Uygulama, hesaplanan oranı mevcut bilet fiyatlarına yansıtır ve farklı yuvarlama ile dağıtım seçenekleri üzerinden tarife dengeleme senaryoları oluşturur.

## Temel özellikler

- Yakıt, TÜFE ve asgari ücret değişimlerini dönem bazında hesaplama
- Yapılandırılabilir ağırlıklarla birleşik değişim oranı üretme
- Hesaplanan oranın bilet tarifelerine yansımasını gösterme
- Biniş sayılarına göre tarife dengeleme ve gelir sapması analizi
- TÜFE, asgari ücret, ağırlık ve tarife verilerini yönetme
- Açık/koyu tema ve yazdırılabilir sonuç ekranı
- Tarayıcıda saklanan yerel uygulama verileri

## Teknolojiler

- React 18 ve TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Playwright
- Netlify

## Kurulum ve çalıştırma

Gereksinimler: Node.js 20 veya üzeri ve npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

`.env` dosyasındaki kullanıcı ve yönetici bilgilerini çalıştırmadan önce doldurun:

- `VITE_ADMIN_USER`
- `VITE_ADMIN_PASS`
- `VITE_USER`
- `VITE_USER_PASS`

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

> Not: Mevcut giriş sistemi tamamen tarayıcı tarafında çalışır. `VITE_*` değişkenleri üretim paketinde görülebileceğinden bu yapı gerçek bir güvenlik sınırı olarak değerlendirilmemelidir.

## Komutlar

```powershell
npm run dev              # geliştirme sunucusu
npm run build            # üretim derlemesi
npm run preview          # üretim derlemesini yerel olarak önizleme
npm run lint             # kod kalitesi kontrolü
npm run test:playwright  # uçtan uca tarayıcı testleri
```

## Veri güncelleme

TÜFE, asgari ücret, varsayılan ağırlıklar ve bilet tarifeleri `src/data/constants.json` dosyasında tutulur. Yeni sürümde eklenen TÜFE ve asgari ücret kayıtları, kullanıcıların tarayıcılarında bulunan yerel verilere eksik anahtar olarak otomatik eklenir.

## Dağıtım

Proje Netlify üzerinden yayımlanacak şekilde yapılandırılmıştır. `main` dalına gönderilen değişiklikler, Netlify deposu bu dala bağlıysa otomatik dağıtımı tetikler.

GitHub Actions üretim derlemesini ve Playwright kontrollerini çalıştırır.

[![Playwright E2E](https://github.com/eozel43/hesaplama/actions/workflows/playwright.yml/badge.svg)](https://github.com/eozel43/hesaplama/actions/workflows/playwright.yml)
