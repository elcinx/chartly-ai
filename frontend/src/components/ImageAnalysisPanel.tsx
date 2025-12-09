import React, { useState } from 'react';
import { Image as ImageIcon, Search, CheckCircle, AlertTriangle, Upload, XCircle, AlertOctagon } from 'lucide-react';
import api from '../api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { clsx } from 'clsx';

interface ImageAnalysisPanelProps {
    sessionId: string;
}

interface ChartAnalysisResult {
    detected_chart_type: string | null;
    raw_label: string | null;
    confidence: number;
    explanation_tr: string;
    is_compatible: boolean;
    compatibility_reason_tr: string;
    error_code: string | null;
}

export const ImageAnalysisPanel: React.FC<ImageAnalysisPanelProps> = ({ sessionId }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<ChartAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysis(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            formData.append('file', selectedFile);

            const res = await api.post('/api/analyze-chart-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAnalysis(res.data);
        } catch (error) {
            console.error(error);
            // Fallback for network/server errors not caught by backend
            setAnalysis({
                detected_chart_type: "Bağlantı Hatası",
                raw_label: "Error",
                confidence: 0,
                explanation_tr: "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.",
                is_compatible: false,
                compatibility_reason_tr: "Ağ hatası.",
                error_code: "NETWORK_ERROR"
            });
        } finally {
            setLoading(false);
        }
    };

    // Determine Status Badge & Theme
    let badgeText = "BEKLEMEDE";
    let badgeColor = "bg-slate-500/20 text-slate-400";
    let mainColorClass = "text-white";

    if (analysis) {
        if (analysis.error_code) {
            badgeText = "HATA";
            badgeColor = "bg-red-500/20 text-red-400";
            mainColorClass = "text-red-400";
        } else if (analysis.is_compatible) {
            badgeText = "UYUMLU";
            badgeColor = "bg-emerald-500/20 text-emerald-400";
            mainColorClass = "text-emerald-400";
        } else {
            badgeText = "UYUMSUZ";
            badgeColor = "bg-amber-500/20 text-amber-400";
            mainColorClass = "text-amber-400";
        }
    }

    const getConfidenceLabel = (conf: number) => {
        if (conf > 0.9) return "Çok Yüksek Güven";
        if (conf > 0.7) return "Yüksek Güven";
        if (conf > 0.5) return "Orta Güven";
        return "Düşük Güven";
    };

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: Image & Upload */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 min-h-[400px] bg-[#020617] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Chart Preview" className="max-w-full max-h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                    <div className="bg-white/10 p-4 rounded-full backdrop-blur-md">
                                        <Upload className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="sr-only">Resim Değiştir</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </label>
                            </>
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer p-8 text-center h-full w-full">
                                <div className="bg-surface p-6 rounded-full mb-6 group-hover:bg-primary/20 transition duration-300">
                                    <ImageIcon className="w-12 h-12 text-slate-500 group-hover:text-primary transition duration-300" />
                                </div>
                                <p className="text-slate-400 font-medium text-lg">Henüz bir grafik resmi yüklenmedi.</p>
                                <p className="text-slate-600 text-sm mt-2">Analiz etmek için tıklayın veya sürükleyin</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </label>
                        )}
                    </div>

                    <Button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || loading}
                        isLoading={loading}
                        className="w-full py-4 text-base"
                        variant="secondary"
                    >
                        🔍 Grafik Resmi Yükle & Analiz Et
                    </Button>
                </div>

                {/* Right Column: Analysis Detail Card */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <span className={clsx("px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/5", badgeColor)}>
                            {badgeText}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 pr-20">Yapay Zeka Dedektifi</h3>
                    <p className="text-slate-500 text-sm mb-8">Google Gemini 2.0 Vision</p>

                    <div className="space-y-6 flex-1">
                        {/* Detected Type */}
                        <div>
                            <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">TESPİT EDİLEN TÜR</p>
                            <h2 className={clsx("text-3xl lg:text-4xl font-bold tracking-tight capitalize", mainColorClass)}>
                                {analysis ? (analysis.detected_chart_type || "Bilinmiyor") : "---"}
                            </h2>
                            {analysis && analysis.confidence > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{ width: `${analysis.confidence * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs text-cyan-400 font-medium">
                                        %{Math.round(analysis.confidence * 100)} ({getConfidenceLabel(analysis.confidence)})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Explanation */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">ANALİZ SONUCU</p>
                            <p className="text-slate-300 leading-relaxed text-lg">
                                {analysis ? analysis.explanation_tr : "Bir grafik resmi yükleyerek analizi başlatın. Yapay zeka grafiği tanıyacak, türünü belirleyecek ve veri setinizle uyumluluğunu kontrol edecektir."}
                            </p>
                        </div>
                    </div>

                    {/* Compatibility / Error Alert */}
                    <div className="mt-8">
                        {!analysis ? (
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 opacity-50" />
                                <span>Analiz sonucu bekleniyor...</span>
                            </div>
                        ) : analysis.error_code ? (
                            <div className="p-5 rounded-xl border-l-[6px] shadow-lg bg-red-900/20 border-red-500 border-t border-r border-b border-white/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full mt-1 bg-red-500/20 text-red-500">
                                        <AlertOctagon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-red-100">Teknik Sorun Tespit Edildi</h4>
                                        <p className="text-sm leading-relaxed text-red-200/80">
                                            {analysis.explanation_tr}
                                        </p>
                                        <p className="text-xs text-red-400 mt-2 font-mono bg-black/20 p-1 rounded inline-block">
                                            Kod: {analysis.error_code}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={clsx(
                                "p-5 rounded-xl border-l-[6px] shadow-lg",
                                analysis.is_compatible
                                    ? "bg-emerald-900/20 border-emerald-500 border-t border-r border-b border-white/5"
                                    : "bg-amber-900/20 border-amber-500 border-t border-r border-b border-white/5"
                            )}>
                                <div className="flex items-start gap-4">
                                    <div className={clsx("p-2 rounded-full mt-1", analysis.is_compatible ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-500")}>
                                        {analysis.is_compatible ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className={clsx("font-bold text-lg mb-2", analysis.is_compatible ? "text-emerald-100" : "text-amber-100")}>
                                            {analysis.is_compatible ? "Bu grafik tipi veriniz için UYGUN" : "Bu grafik tipi veriniz için UYGUN DEĞİL"}
                                        </h4>
                                        <p className={clsx("text-sm leading-relaxed opacity-90", analysis.is_compatible ? "text-emerald-200/80" : "text-amber-200/80")}>
                                            {analysis.compatibility_reason_tr}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
