function hueIncrement(hex, amount = 50) {
    let hsl = hexToHsl(hex)
    hsl[0] = (hsl[0] + amount) % 360
    return hslToHex(...hsl);
}
function hueDecrement(hex, amount = 50) {
    let hsl = hexToHsl(hex)
    hsl[0] = (hsl[0] - amount) % 360
    return hslToHex(...hsl);
}

function satIncrement(hex, amount = 20) {
    let hsl = hexToHsl(hex)
    hsl[1] = Math.min(100, hsl[1] + amount);
    return hslToHex(...hsl);
}
function satDecrement(hex, amount = 20) {
    let hsl = hexToHsl(hex)
    hsl[1] = Math.max(0, hsl[1] - amount);
    return hslToHex(...hsl);
}

function lightIncrement(hex, amount = 20) {
    let hsl = hexToHsl(hex)
    hsl[2] = Math.min(100, hsl[2] + amount);
    return hslToHex(...hsl);
}
function lightDecrement(hex, amount = 20) {
    let hsl = hexToHsl(hex)
    hsl[2] = Math.max(0, hsl[2] - amount);
    return hslToHex(...hsl);
}

function hexToHsl(hex) {
    let split = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    let r = parseInt(split[1], 16);
    let g = parseInt(split[2], 16);
    let b = parseInt(split[3], 16);

    if (r == NaN) r = 0;
    if (g == NaN) g = 0;
    if (b == NaN) b = 0;

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    s = Math.round(s * 100);
    l = Math.round(l * 100);
    h = Math.round(360 * h);

    return [h, s, l]
}

function hslToHex(h, s, l) {
    l /= 100;
    let a = s * Math.min(l, 1 - l) / 100;
    let func = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${func(0)}${func(8)}${func(4)}`;
}

export const ColorUtil = {
    hexToHsl,
    hslToHex,
    hueIncrement,
    hueDecrement,
    satIncrement,
    satDecrement,
    lightIncrement,
    lightDecrement,
}