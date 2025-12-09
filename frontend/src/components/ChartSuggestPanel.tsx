import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { BarChart2, TrendingUp, PieChart, Activity, Settings, BarChart } from 'lucide-react';
import api from '../api';
import { clsx } from 'clsx';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SectionTitle } from './ui/SectionTitle';

interface ChartSuggestPanelProps {
    sessionId: string;
    columns: any[];
}

export const ChartSuggestPanel: React.FC<ChartSuggestPanelProps> = ({ sessionId, columns }) => {
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [chartData, setChartData] = useState<any>(null); // Plotly JSON
    const [rendering, setRendering] = useState(false);

    const handleSuggest = async () => {
        setLoadingSuggestions(true);
        setSuggestions([]);
        try {
            const payload: any = { session_id: sessionId };
            if (xAxis) payload.x = xAxis;
            if (yAxis) payload.y = yAxis;

            const res = await api.post('/api/suggest-charts', payload);
            setSuggestions(res.data.suggestions);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleRender = async (chartType: string) => {
        setRendering(true);
        setChartData(null);
        try {
            const payload = {
                session_id: sessionId,
                chart_type: chartType,
                x: xAxis || undefined,
                y: yAxis || undefined,
            };
            const res = await api.post('/api/render-chart', payload);
            setChartData(JSON.parse(res.data.plotly_json));
        } catch (error) {
            console.error(error);
            alert("Grafik oluşturulamadı.");
        } finally {
            setRendering(false);
        }
    };

    const IconMap: any = {
        bar: BarChart2,
        line: TrendingUp,
        scatter: Activity,
        pie: PieChart,
        histogram: BarChart2,
        heatmap: Activity
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <Card>
                <div className="grid md:grid-cols-3 gap-6 mb-8 items-end">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 pl-1">X Ekseni</label>
                        <div className="relative">
                            <select
                                className="w-full bg-background/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition appearance-none"
                                value={xAxis}
                                onChange={e => setXAxis(e.target.value)}
                            >
                                <option value="">Otomatik Seçim</option>
                                {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <Settings className="absolute right-4 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 pl-1">Y Ekseni</label>
                        <div className="relative">
                            <select
                                className="w-full bg-background/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition appearance-none"
                                value={yAxis}
                                onChange={e => setYAxis(e.target.value)}
                            >
                                <option value="">Otomatik Seçim</option>
                                {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <Settings className="absolute right-4 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <Button
                            onClick={handleSuggest}
                            isLoading={loadingSuggestions}
                            variant="secondary"
                            className="w-full h-[50px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none"
                        >
                            ✨ Grafik Öner
                        </Button>
                    </div>
                </div>

                {/* Suggestions Area */}
                {suggestions.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                        {suggestions.map((s, idx) => {
                            const Icon = IconMap[s.chart_type] || Activity;
                            return (
                                <div key={idx} className={clsx(
                                    "p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group flex flex-col",
                                    s.recommended
                                        ? "bg-gradient-to-br from-primary/10 to-blue-900/10 border-primary/50 shadow-lg shadow-cyan-900/20"
                                        : "bg-surface/30 border-white/5 hover:border-white/10"
                                )}>
                                    {s.recommended && (
                                        <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl backdrop-blur-sm">
                                            ÖNERİLEN
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={clsx("p-2 rounded-lg", s.recommended ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400")}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg capitalize text-white">{s.chart_type}</h4>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-5 min-h-[40px] leading-relaxed flex-grow">{s.reason}</p>
                                    <Button
                                        onClick={() => handleRender(s.chart_type)}
                                        variant={s.recommended ? 'primary' : 'outline'}
                                        className="w-full text-sm py-2 h-10 mt-auto"
                                    >
                                        Bu grafiği üret
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-2xl bg-surface/20">
                        <BarChart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Henüz öneri yok</p>
                        <p className="text-sm text-slate-500">Sütunları seçip "Grafik Öner" butonuna basın.</p>
                    </div>
                )}
            </Card>

            {/* Vis Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white pl-4 border-l-4 border-cyan-500">Veri Görselleştirme</h3>

                {rendering && <div className="text-center py-20 text-slate-400 animate-pulse bg-surface/20 rounded-2xl border border-white/5">Grafik oluşturuluyor...</div>}

                {!rendering && !chartData && (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-surface/20 rounded-2xl border border-slate-700/50 text-slate-500">
                        <Activity className="w-16 h-16 opacity-20 mb-4" />
                        <p>Grafik alanı boş</p>
                    </div>
                )}

                {chartData && (
                    <div className="bg-[#0f172a] rounded-2xl p-1 border border-slate-700/50 shadow-2xl relative group overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

                        <div className="p-4">
                            <Plot
                                data={chartData.data}
                                layout={{
                                    ...chartData.layout,
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    font: { color: '#94a3b8', family: 'Inter' },
                                    autosize: true,
                                    margin: { t: 50, r: 20, l: 50, b: 50 }
                                }}
                                useResizeHandler={true}
                                className="w-full h-[500px]"
                                config={{ responsive: true, displayModeBar: true }}
                            />
                        </div>

                        <div className="p-4 border-t border-slate-800 flex justify-center bg-surface/30">
                            <Button variant="primary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 border-none shadow-xl shadow-cyan-900/20 px-8">
                                Bu Grafiğin Aynısını İstiyorum
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
