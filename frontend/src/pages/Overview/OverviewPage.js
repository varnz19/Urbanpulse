import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { TrafficMap } from '../../components/maps/TrafficMap';
import { fetchOverview, fetchCorridorsGeo } from '../../services/api';
import { Gauge, Car, Calendar, CheckCircle, AlertOctagon, MapPin } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
export const OverviewPage = ({ datasetId }) => {
    const [metrics, setMetrics] = useState(null);
    const [corridors, setCorridors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!datasetId)
            return;
        let isMounted = true;
        setLoading(true);
        setError(null);
        Promise.all([
            fetchOverview(datasetId),
            fetchCorridorsGeo(datasetId)
        ])
            .then(([overviewData, geoData]) => {
            if (isMounted) {
                setMetrics(overviewData);
                setCorridors(geoData);
                setLoading(false);
            }
        })
            .catch((err) => {
            if (isMounted) {
                setError(err.message || 'Failed to load command center data');
                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [datasetId]);
    if (loading)
        return _jsx(LoadingSkeleton, { message: "Aggregating mobility metrics across corridors..." });
    if (error)
        return _jsx(ErrorAlert, { message: error, onRetry: () => window.location.reload() });
    if (!metrics)
        return null;
    // Congestion Pie data
    const pieColors = {
        Low: '#10B981',
        Moderate: '#38BDF8',
        High: '#F59E0B',
        Severe: '#EF4444'
    };
    const pieData = Object.entries(metrics.congestion_breakdown).map(([name, value]) => ({
        name,
        value,
        color: pieColors[name] || '#94A3B8'
    }));
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Mobility Command Center", description: "Comprehensive spatial and temporal traffic performance overview computed across monitored urban corridors." }), _jsxs("div", { className: "metrics-grid", children: [_jsx(MetricCard, { label: "Total Observations", value: metrics.total_observations.toLocaleString(), icon: _jsx(Calendar, { size: 18 }), detail: metrics.date_start ? `${metrics.date_start.slice(0, 10)} to ${metrics.date_end?.slice(0, 10)}` : 'Dataset period' }), _jsx(MetricCard, { label: "Monitored Corridors", value: metrics.unique_segments, icon: _jsx(MapPin, { size: 18 }), detail: "Key arterial sectors" }), _jsx(MetricCard, { label: "Network Avg Speed", value: metrics.avg_speed_kmh ? `${metrics.avg_speed_kmh} km/h` : 'N/A', icon: _jsx(Gauge, { size: 18 }), badge: _jsx("span", { className: "badge badge-mod", children: "Monitored Flow" }) }), _jsx(MetricCard, { label: "Avg Hourly Volume", value: metrics.avg_vehicle_volume ? `${metrics.avg_vehicle_volume.toLocaleString()} veh/h` : 'N/A', icon: _jsx(Car, { size: 18 }), detail: "Per corridor window" }), _jsx(MetricCard, { label: "Data Completeness", value: `${metrics.completeness_pct}%`, icon: _jsx(CheckCircle, { size: 18 }), badge: _jsx("span", { className: "badge badge-low", children: "Verified" }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }, children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(MapPin, { size: 18, style: { color: 'var(--accent-teal)' } }), "Spatial Corridor Intelligence"] }), _jsx("div", { className: "card-subtitle", children: "Interactive geospatial locations with measured flow parameters" })] }), _jsxs("span", { className: "badge badge-neutral", children: [corridors.length, " Corridors Plotted"] })] }), _jsx(TrafficMap, { corridors: corridors, height: "420px" })] }), _jsxs("div", { className: "card", style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(AlertOctagon, { size: 18, style: { color: 'var(--accent-teal)' } }), "Congestion Distribution"] }), _jsx("div", { className: "card-subtitle", children: "Observed network congestion states" })] }) }), _jsx("div", { style: { flex: 1, minHeight: '260px' }, children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 90, paddingAngle: 4, dataKey: "value", children: pieData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, itemStyle: { color: '#F8FAFC' } })] }) }) }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }, children: pieData.map(item => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }, children: [_jsx("span", { style: { width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color } }), _jsxs("span", { style: { color: 'var(--text-muted)' }, children: [item.name, ":"] }), _jsx("strong", { style: { color: '#F8FAFC' }, children: item.value })] }, item.name))) })] })] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "24-Hour Diurnal Speed vs Volume Profile" }), _jsx("div", { className: "card-subtitle", children: "System-wide average vehicle speed (km/h) plotted against traffic volume (veh/h) across time of day" })] }) }), _jsx("div", { style: { height: '320px', width: '100%' }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(ComposedChart, { data: metrics.hourly_trend, children: [_jsx(CartesianGrid, { stroke: "#1E293B", strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "hour", stroke: "#64748B", tickFormatter: (h) => `${h}:00` }), _jsx(YAxis, { yAxisId: "left", stroke: "#14B8A6", label: { value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#14B8A6' } }), _jsx(YAxis, { yAxisId: "right", orientation: "right", stroke: "#6366F1", label: { value: 'Volume (veh/h)', angle: 90, position: 'insideRight', fill: '#6366F1' } }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, formatter: (val, name) => [val, name === 'avg_speed' ? 'Avg Speed (km/h)' : 'Traffic Volume (veh/h)'], labelFormatter: (h) => `Time: ${h}:00` }), _jsx(Legend, { wrapperStyle: { paddingTop: '10px' } }), _jsx(Bar, { yAxisId: "right", dataKey: "avg_volume", fill: "rgba(99, 102, 241, 0.45)", name: "Traffic Volume", radius: [4, 4, 0, 0] }), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "avg_speed", stroke: "#14B8A6", strokeWidth: 3, dot: { r: 4, fill: '#14B8A6' }, name: "Avg Speed" })] }) }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }, children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Weekday vs Weekend Profile" }), _jsx("div", { className: "card-subtitle", children: "Commute divergence comparison" })] }) }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: metrics.weekday_vs_weekend.map((d) => (_jsxs("div", { style: {
                                        backgroundColor: 'var(--bg-surface-elevated)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '14px',
                                    }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }, children: [_jsx("strong", { style: { color: '#F8FAFC', fontSize: '0.95rem' }, children: d.day_type }), _jsxs("span", { className: `badge ${d.severe_congestion_pct > 20 ? 'badge-high' : 'badge-low'}`, children: [d.severe_congestion_pct, "% Severe/High Congestion"] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-dim)' }, children: "Mean Speed:" }), _jsxs("div", { style: { color: '#F8FAFC', fontWeight: 600 }, children: [d.avg_speed, " km/h"] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-dim)' }, children: "Avg Volume:" }), _jsxs("div", { style: { color: '#F8FAFC', fontWeight: 600 }, children: [d.avg_volume.toLocaleString(), " veh/h"] })] })] })] }, d.day_type))) })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Highest-Priority Bottleneck Corridors" }), _jsx("div", { className: "card-subtitle", children: "Ranked by composite bottleneck risk score (severe congestion frequency + speed deficit)" })] }) }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Corridor Name" }), _jsx("th", { children: "Avg Speed" }), _jsx("th", { children: "Avg Volume" }), _jsx("th", { children: "Severe Rate" }), _jsx("th", { children: "Dominant State" }), _jsx("th", { children: "Risk Score" })] }) }), _jsx("tbody", { children: metrics.top_priority_corridors.map((p) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 600, color: '#F8FAFC' }, children: p.segment_name }), _jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)' }, children: p.segment_id })] }), _jsx("td", { children: _jsxs("strong", { style: { color: p.avg_speed < 20 ? '#EF4444' : (p.avg_speed < 32 ? '#F59E0B' : '#10B981') }, children: [p.avg_speed, " km/h"] }) }), _jsxs("td", { children: [p.avg_volume.toLocaleString(), " veh/h"] }), _jsxs("td", { children: [p.congestion_rate, "%"] }), _jsx("td", { children: _jsx("span", { className: `badge badge-${p.dominant_congestion.toLowerCase()}`, children: p.dominant_congestion }) }), _jsx("td", { children: _jsx("span", { style: { fontWeight: 700, color: p.risk_score > 40 ? '#EF4444' : '#F59E0B' }, children: p.risk_score }) })] }, p.segment_id))) })] }) })] })] })] }));
};
