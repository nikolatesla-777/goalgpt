
import LiveFlowClient from './LiveFlowClient'

export default function LiveFlowPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Canlı Veri Akışı</h1>
                <p className="text-slate-500 text-sm">API'ye gelen anlık yapay zeka tahminleri ve bildirim simülasyonları.</p>
            </div>

            <LiveFlowClient />
        </div>
    )
}
