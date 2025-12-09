import { useState } from 'react'
import { CsvUploadPanel } from './components/CsvUploadPanel'
import { ChartSuggestPanel } from './components/ChartSuggestPanel'
import { ImageAnalysisPanel } from './components/ImageAnalysisPanel'
import { SectionTitle } from './components/ui/SectionTitle'

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);

  const handleSession = (id: string, cols: any[]) => {
    setSessionId(id);
    setColumns(cols);
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-main-gradient text-white flex flex-col font-sans selection:bg-primary/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 p-5 flex justify-between items-center bg-transparent backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent cursor-pointer tracking-tight" onClick={() => window.location.reload()}>
          Chartly
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition">Dokümantasyon</a>
          <a href="#" className="hover:text-white transition">Örnekler</a>
          <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-500 border border-white/5">v1.0 Beta</span>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="py-20 md:py-28 px-6 text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse duration-[10s]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10" />

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-2xl">
          Veri Görselleştirme <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Demo</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Veri setlerinizi modern arayüzle analiz edin. Yapay zeka destekli önerilerle en doğru görselleştirmeyi saniyeler içinde oluşturun.
        </p>
      </header>

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pb-32 space-y-24">

        {/* Step 1: Upload */}
        <section className="space-y-6">
          <SectionTitle number="01" title="CSV Dosyası Yükle" colorClass="border-cyan-500" />
          <CsvUploadPanel onSessionCreated={handleSession} />
        </section>

        {sessionId && (
          <div id="analysis-section" className="space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Step 2: Suggestions & Render */}
            <section className="space-y-6">
              <SectionTitle number="02" title="Grafik Öner ve Çiz" colorClass="border-purple-500" />
              <ChartSuggestPanel sessionId={sessionId} columns={columns} />
            </section>

            {/* Step 3: Image Analysis */}
            <section className="space-y-6">
              <SectionTitle number="03" title="Örnek Grafik Analizi" colorClass="border-pink-500" />
              <ImageAnalysisPanel sessionId={sessionId} />
            </section>
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-slate-500 text-sm border-t border-white/5 bg-[#0b1120]">
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="hover:text-primary transition">Gizlilik</a>
          <a href="#" className="hover:text-primary transition">Kullanım Şartları</a>
          <a href="#" className="hover:text-primary transition">İletişim</a>
        </div>
        <p>Veri Görselleştirme Demo • 2025 • Designed with ❤️ by Chartly AI</p>
      </footer>
    </div>
  )
}

export default App
