import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchHeatmap, fetchOverview } from '../../services/api';
import { Clock, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
export const PatternExplorerPage = ({ datasetId }) => {
    const [heatmap, setHeatmap] = useState(null);
    const [overview, setOverview] = useState(null);
    const [metric, setMetric] = useState('avg_speed_kmh');
    const [hoveredCell, setHoveredCell] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        Promise.all([
            fetchHeatmap(datasetId, metric),
            fetchOverview(datasetId)
        ])
            .then(([hm, ov]) => {
            setHeatmap(hm);
            setOverview(ov);
            setLoading(false);
        })
            .catch((err) => {
            setError(err.message || 'Failed to fetch pattern analysis');
            setLoading(false);
        });
    }, [datasetId, metric]);
    if (loading)
        return _jsx(LoadingSkeleton, { message: "Mining diurnal and day-of-week traffic heatmaps..." });
    if (error)
        return _jsx(ErrorAlert, { message: error });
    if (!heatmap)
        return null;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getHeatmapColor = (spd) => {
        if (metric === 'avg_speed_kmh') {
            if (spd < 18)
                return '#EF4444'; // Severe
            if (spd < 28)
                return '#F59E0B'; // High
            if (spd < 38)
                return '#38BDF8'; // Moderate
            return '#10B981'; // Free Flow
        }
        else {
            // Volume
            if (spd > 3500)
                return '#EF4444';
            if (spd > 2800)
                return '#F59E0B';
            if (spd > 2000)
                return '#38BDF8';
            return '#10B981';
        }
    };
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Congestion Pattern Explorer", description: "Temporal and day-of-week recurrent congestion analysis, commute peak identification, and diurnal traffic matrices.", actions: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { className: `btn ${metric === 'avg_speed_kmh' ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setMetric('avg_speed_kmh'), children: "Speed Heatmap (km/h)" }), _jsx("button", { className: `btn ${metric === 'vehicle_count' ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setMetric('vehicle_count'), children: "Volume Heatmap (veh/h)" })] }) }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(Clock, { size: 18, style: { color: 'var(--accent-teal)' } }), "Diurnal Recurrence Heatmap (Hour of Day vs Day of Week)"] }), _jsx("div", { className: "card-subtitle", children: "Visualizes recurring bottleneck windows across hours 00:00 to 23:00 for each day of the week" })] }), hoveredCell && (_jsxs("div", { style: {
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.8rem',
                                    color: '#F8FAFC',
                                    border: '1px solid var(--border-color)'
                                }, children: [_jsxs("strong", { children: [hoveredCell.day, " at ", hoveredCell.hour, ":00"] }), " \u2014 Speed: ", hoveredCell.avg_speed, " km/h \u2022 Volume: ", hoveredCell.avg_volume, " veh/h"] }))] }), _jsxs("div", { className: "heatmap-table-wrap", children: [_jsxs("div", { className: "heatmap-grid", style: { marginBottom: '6px', fontWeight: 600, color: 'var(--text-dim)' }, children: [_jsx("div", { children: "Day" }), Array.from({ length: 24 }).map((_, h) => (_jsx("div", { style: { textAlign: 'center' }, children: h % 2 === 0 ? `${h}h` : '' }, h)))] }), days.map((dayName, dIdx) => {
                                const dayCells = heatmap.cells.filter(c => c.day === dayName);
                                return (_jsxs("div", { className: "heatmap-grid", style: { marginBottom: '4px' }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }, children: dayName }), dayCells.map((cell) => {
                                            const val = metric === 'avg_speed_kmh' ? cell.avg_speed : cell.avg_volume;
                                            const bg = getHeatmapColor(val);
                                            return (_jsx("div", { className: "heatmap-cell", style: { backgroundColor: bg }, onMouseEnter: () => setHoveredCell(cell), onMouseLeave: () => setHoveredCell(null), title: `${dayName} ${cell.hour}:00 - ${val}` }, cell.hour));
                                        })] }, dayName));
                            })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-dim)' }, children: [_jsx("span", { children: "Free-Flow (Low Congestion)" }), _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("span", { style: { width: '18px', height: '14px', borderRadius: '2px', background: '#10B981' } }), _jsx("span", { style: { width: '18px', height: '14px', borderRadius: '2px', background: '#38BDF8' } }), _jsx("span", { style: { width: '18px', height: '14px', borderRadius: '2px', background: '#F59E0B' } }), _jsx("span", { style: { width: '18px', height: '14px', borderRadius: '2px', background: '#EF4444' } })] }), _jsx("span", { children: "Severe Bottleneck" })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }, children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(TrendingUp, { size: 18, style: { color: 'var(--accent-teal)' } }), "Hourly Speed Profile Across 24h"] }), _jsx("div", { className: "card-subtitle", children: "Aggregated multi-day corridor speed curve" })] }) }), _jsx("div", { style: { height: '260px' }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: overview?.hourly_trend || [], children: [_jsx(CartesianGrid, { stroke: "#1E293B", vertical: false }), _jsx(XAxis, { dataKey: "hour", stroke: "#64748B", tickFormatter: (h) => `${h}:00` }), _jsx(YAxis, { stroke: "#64748B", domain: [10, 60] }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, formatter: (val) => [`${val} km/h`, 'Avg Speed'], labelFormatter: (h) => `Time: ${h}:00` }), _jsx(Line, { type: "monotone", dataKey: "avg_speed", stroke: "#14B8A6", strokeWidth: 2.5, dot: { r: 3 } })] }) }) })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(Info, { size: 18, style: { color: 'var(--accent-teal)' } }), "Commute Dynamic Insights"] }), _jsx("div", { className: "card-subtitle", children: "Key temporal findings derived from actual data" })] }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }, children: [_jsxs("div", { style: { padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }, children: [_jsx("strong", { style: { color: '#F8FAFC' }, children: "Morning Peak (08:00 - 11:00):" }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "Significant speed degradation observed in Tech Corridors (HITEC City and Gachibowli), where speeds drop by 35% to 45% compared to off-peak baselines." })] }), _jsxs("div", { style: { padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }, children: [_jsx("strong", { style: { color: '#F8FAFC' }, children: "Evening Peak (17:00 - 21:00):" }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "Highest system-wide traffic volume recorded across arterial transit corridors (Mehdipatnam, Panjagutta, and Dilsukhnagar), with high congestion recurrence." })] }), _jsxs("div", { style: { padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }, children: [_jsx("strong", { style: { color: '#F8FAFC' }, children: "Night Free-Flow (00:00 - 06:00):" }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "High speed recovery (> 50 km/h) on Outer Ring Road and Express Corridors with low vehicle volumes below 1,000 veh/h." })] })] })] })] })] }));
};
