# Chartly - Yapay Zeka Destekli Veri Görselleştirme Platformu

Chartly, verilerinizi dakikalar içinde analiz edip görselleştirmenizi sağlayan, modern ve yapay zeka destekli bir web uygulamasıdır. Hem CSV verilerini analiz eder hem de yüklediğiniz grafik görsellerini Google Gemini Vision AI ile yorumlayarak veri setinizle uyumluluğunu kontrol eder.

![Chartly Screenshot](https://via.placeholder.com/800x450?text=Chartly+Dashboard+Preview)

## 🚀 Özellikler

*   **📂 Akıllı CSV Analizi:** Yüklenen veri setini otomatik tarar, sütun tiplerini (Sayısal, Kategorik, Tarih) algılar ve özetler.
*   **📊 Otomatik Grafik Önerileri:** Veri yapınıza en uygun grafik türlerini (Bar, Line, Scatter, Pie, Heatmap vb.) akıllıca önerir.
*   **🤖 AI Grafik Dedektifi (Powered by Gemini Vision):** Herhangi bir grafik resmini yüklediğinizde:
    *   Grafik türünü tespit eder (örn. Radar Chart, Box Plot).
    *   Grafiğin ne anlattığını Türkçe olarak açıklar.
    *   Mevcut veri setinizle bu grafiği çizip çizemeyeceğinizi (uyumluluk) analiz eder.
*   **🎨 İnteraktif Görselleştirme:** Plotly altyapısı ile dinamik, yakınlaştırılabilir (zoom/pan) grafikler oluşturur.
*   **⚡ Modern Arayüz:** React, TailwindCSS ve Lucide ikonları ile hazırlanmış şık, "Dark Mode" odaklı tasarım.

## 🛠️ Teknolojiler

### Backend (Python)
*   **FastAPI:** Yüksek performanslı, modern web API çatısı.
*   **Google Generative AI (Gemini):** Görüntü işleme ve doğal dil analizi için.
*   **Pandas:** Veri manipülasyonu ve analizi.
*   **Plotly:** Grafik çizim motoru.

### Frontend (React)
*   **Vite:** Hızlı geliştirme ortamı.
*   **TypeScript:** Tip güvenliği.
*   **TailwindCSS:** Modern stil ve tasarım sistemi.
*   **Axios:** API iletişimi.

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Ön Hazırlıklar
*   Python 3.9 veya üzeri
*   Node.js 16 veya üzeri
*   [Google AI Studio](https://ai.google.dev/)'dan alınmış bir API Anahtarı (`GEMINI_API_KEY`).

### 2. Projeyi Klonlayın

```bash
git clone https://github.com/kullaniciadi/yzm_proje.git
cd yzm_proje
```

### 3. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluşturun (Windows)
python -m venv venv
.\venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# .env dosyasını oluşturun
# .env dosyasının içine şunu ekleyin:
# GEMINI_API_KEY=AIzaSy... (Kendi anahtarınız)
```

Backend sunucusunu başlatın:

```bash
# Otomatik yeniden yükleme modu ile başlat (Port 8000)
python -m uvicorn main:app --reload
```

### 4. Frontend Kurulumu

Yeni bir terminal açın ve frontend klasörüne gidin:

```bash
cd frontend

# Paketleri yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı kullanmaya başlayabilirsiniz.

## 🔑 Yapılandırma

Backend klasöründe `.env` dosyasının doğru yapılandırıldığından emin olun.

**Dosya:** `backend/.env`
```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Not:** API anahtarınız yoksa "Örnek Grafik Analizi" özelliği çalışmayacaktır, ancak CSV yükleme ve çizim özellikleri çalışmaya devam eder.

## 🤝 Katkıda Bulunma

1. Bu projeyi Fork'layın.
2. Yeni bir özellik dalı (branch) oluşturun (`git checkout -b ozellik/YeniOzellik`).
3. Değişikliklerinizi yapın ve Commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4. Dalınızı Push'layın (`git push origin ozellik/YeniOzellik`).
5. Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.
