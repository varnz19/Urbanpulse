import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MetricCard = ({ label, value, icon, detail, badge }) => {
    return (_jsxs("div", { className: "metric-card", children: [_jsxs("div", { className: "metric-card-top", children: [_jsx("span", { className: "metric-label", children: label }), icon && _jsx("div", { className: "metric-icon-wrap", children: icon })] }), _jsx("div", { className: "metric-value", children: value }), (detail || badge) && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }, children: [detail && _jsx("span", { className: "metric-detail", children: detail }), badge] }))] }));
};
