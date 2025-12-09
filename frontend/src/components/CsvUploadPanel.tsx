import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';
import { clsx } from 'clsx';
import { Card } from './ui/Card';

interface CsvUploadPanelProps {
    onSessionCreated: (sessionId: string, columns: any[]) => void;
}

export const CsvUploadPanel: React.FC<CsvUploadPanelProps> = ({ onSessionCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [cols, setCols] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setFileName(file.name);
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/api/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { session_id, columns, preview } = response.data;
            setCols(columns);
            setPreview(preview);
            onSessionCreated(session_id, columns);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Dosya yüklenirken bir hata oluştu.");
            setFileName(null);
        } finally {
            setLoading(false);
        }
    }, [onSessionCreated]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false
    });

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
                {...getRootProps()}
                className={clsx(
                    "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[250px]",
                    isDragActive ? "border-primary bg-primary/10" : "border-slate-600/50 hover:border-primary hover:bg-surface/50",
                )}
            >
                <input {...getInputProps()} />
                {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                ) : fileName ? (
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                ) : (
                    <div className="bg-surface/50 p-4 rounded-full mb-4">
                        <Upload className="w-10 h-10 text-primary" />
                    </div>
                )}

                <p className="text-xl font-medium text-white mb-2">
                    {loading ? "Dosya Analiz Ediliyor..." : fileName ? fileName : "CSV Dosyasını Buraya Sürükleyin"}
                </p>
                {!loading && !fileName && (
                    <p className="text-slate-400">veya dosya seçmek için tıklayın</p>
                )}
            </div>

            {error && (
                <div className="mt-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {cols.length > 0 && (
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="md:col-span-1 bg-background/50 p-6 rounded-2xl border border-white/5 h-96 overflow-y-auto custom-scrollbar">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <FileText className="w-5 h-5 text-primary" />
                            Sütunlar
                        </h3>
                        <div className="space-y-3">
                            {cols.map((col: any) => (
                                <div key={col.name} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg text-sm border border-white/5">
                                    <span className="font-medium truncate max-w-[120px] text-slate-200" title={col.name}>{col.name}</span>
                                    <span className={clsx(
                                        "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider",
                                        col.dtype === 'numeric' && "bg-blue-500/20 text-blue-400",
                                        col.dtype === 'categorical' && "bg-purple-500/20 text-purple-400",
                                        col.dtype === 'datetime' && "bg-orange-500/20 text-orange-400",
                                    )}>
                                        {col.dtype}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-background/50 p-6 rounded-2xl border border-white/5 h-96 overflow-hidden flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 text-white">Veri Önizleme</h3>
                        <div className="overflow-auto flex-1 custom-scrollbar w-full">
                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs text-slate-500 uppercase bg-surface/50 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        {cols.map((c: any) => (
                                            <th key={c.name} className="px-4 py-3 whitespace-nowrap">{c.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i} className="border-b border-slate-700/50 hover:bg-white/5 transition">
                                            {cols.map((c: any) => (
                                                <td key={c.name} className="px-4 py-3 whitespace-nowrap">{String(row[c.name] ?? '')}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
