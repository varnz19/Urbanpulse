import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PageHeader = ({ title, description, actions }) => {
    return (_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: title }), _jsx("p", { className: "page-description", children: description })] }), actions && _jsx("div", { children: actions })] }));
};
