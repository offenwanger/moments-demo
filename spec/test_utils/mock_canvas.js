import fs from 'fs';
import { logInfo } from '../../js/utils/log_util.js';
const RUN = Math.random();
let fileCount = 0;

export function mockCanvas() {
    let canvas = { isMockCanvas: true };

    canvas.height = 1
    canvas.width = 1
    canvas.screenx = 0
    canvas.screeny = 0

    canvas.getContext = function (type) {
        let context = new mockContext(type, canvas);
        return context;
    }

    canvas.eventListeners = {}
    canvas.addEventListener = function (event, eventListener) {
        canvas.eventListeners[event] = eventListener;
    }
    canvas.attrs = {}
    canvas.style = {}
    canvas.setAttribute = function (attr, val) {
        canvas.attrs[attr] = val
        if (attr == 'width') canvas.width = val;
        if (attr == 'height') canvas.height = val;
    }
    canvas.getAttribute = function (attr) { return canvas.attrs[attr] }
    canvas.toBlob = function (callback) { callback(canvas); };
    canvas.getBoundingClientRect = () => {
        return {
            x: canvas.screenx,
            y: canvas.screeny,
            width: canvas.width,
            height: canvas.height,
        }
    };

    canvas.toDataURL = function () {
        // mock canvas cannot be converted to dataURI, so return a fake one. 
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAAHgCAYAAAC7J1fdAAAAAXNSR0IArs4c6QAAHAJJREFUeF7t3UuS';
    }

    return canvas;
}

export function mockContext(type, canvas) {
    let ctx = {}
    let commands = []
    ctx.reset = function () {
        canvas.height = canvas.height;
        canvas.width = canvas.width;
    };
    ctx.createLinearGradient = function (...args) {
        return {
            args,
            addColorStop: () => { }
        }
    }
    ctx.fillRect = function (...args) { commands.push({ cmd: 'fillRect', args }) }
    ctx.beginPath = function (...args) { commands.push({ cmd: 'beginPath', args }) }
    ctx.closePath = function (...args) { commands.push({ cmd: 'closePath', args }) }
    ctx.arc = function (...args) { commands.push({ cmd: 'arc', args }) }
    ctx.stroke = function (...args) { commands.push({ cmd: 'stroke', args }) }
    ctx.fill = function (...args) { commands.push({ cmd: 'fill', args }) }
    ctx.drawImage = function (...args) { commands.push({ cmd: 'drawImage', args }) }
    ctx.moveTo = function (...args) { commands.push({ cmd: 'moveTo', args }) }
    ctx.lineTo = function (...args) { commands.push({ cmd: 'lineTo', args }) }
    ctx.translate = function (...args) { commands.push({ cmd: 'translate', args }) }
    ctx.scale = function (...args) { commands.push({ cmd: 'scale', args }) }
    return ctx;
}

export function createCanvas() {
    let canvas = new mockCanvas();
    return canvas;
}