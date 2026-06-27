"use strict";
exports.__esModule = true;
var BADGE_STYLE = {
    VERIFICADO: { cls: 'verified', text: '✓ VERIFICADO' },
    LIMITADO: { cls: 'limited' },
    'DROP PRIVADO': { cls: 'private' },
    SEMINUEVO: { cls: 'preowned' },
    'POCO STOCK': { cls: 'lowstock' },
    NUEVO: { cls: 'new' },
    DESTACADO: { cls: 'limited' }
};
function Badges(_a) {
    var product = _a.product;
    if (!product.badges || !product.badges.length)
        return null;
    return (React.createElement("div", { className: "prod-badges" }, product.badges.map(function (b) {
        var _a, _b;
        var key = b.toUpperCase();
        var style = (_a = BADGE_STYLE[key]) !== null && _a !== void 0 ? _a : { cls: 'fallback' };
        return React.createElement("span", { key: b, className: "badge " + style.cls }, (_b = style.text) !== null && _b !== void 0 ? _b : key);
    })));
}
exports["default"] = Badges;
