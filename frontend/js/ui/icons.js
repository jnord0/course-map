// Icons Module - Lucide SVG string generator for use in JS template literals
// Requires Lucide to be loaded via CDN (window.lucide) before this script runs.
//
// Usage in template literals:
//   `<button>${icon('x', { size: 14 })} Remove</button>`
//   `<h3>${icon('bar-chart-2', { size: 20 })} Analytics</h3>`

window.icon = function(name, { size = 16, className = '', style = '' } = {}) {
    if (!window.lucide) return '';

    // Convert kebab-case name to PascalCase to look up in the lucide namespace
    const pascalName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const iconDef = window.lucide[pascalName];
    if (!iconDef) return '';

    function nodeToHtml([tag, attrs, children]) {
        const finalAttrs = tag === 'svg'
            ? {
                ...attrs,
                width: size,
                height: size,
                'aria-hidden': 'true',
                style: `display:inline-block;vertical-align:middle;${style ? style : ''}`,
                ...(className ? { class: className } : {})
              }
            : { ...attrs };

        const attrStr = Object.entries(finalAttrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
        const childHtml = (children || []).map(nodeToHtml).join('');
        return `<${tag} ${attrStr}>${childHtml}</${tag}>`;
    }

    return nodeToHtml(iconDef);
};
