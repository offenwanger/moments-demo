import * as THREE from 'three';
import { THUMBNAIL_SIZE } from "../constants.js";


const renderCanvas = document.createElement("canvas");
renderCanvas.width = THUMBNAIL_SIZE;
renderCanvas.height = THUMBNAIL_SIZE;

const renderer = new THREE.WebGLRenderer({ canvas: renderCanvas });
renderer.setClearColor(0x888888, 1);

const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
camera.position.z = 2;
camera.position.x = 1;
camera.position.y = 1;

const light = new THREE.AmbientLight(0xffffff);

function generateSceneThumbnail(scene) {
    const canvas = document.createElement("canvas");
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext("2d");

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);

    // Calculate the camera's position
    const cameraZ = size.z / 2 / Math.tan(camera.fov * Math.PI / 360);
    camera.position.set(center.x, center.y, cameraZ);

    // Make sure the camera is looking at the center of the bounding box
    camera.lookAt(center);

    scene.add(light);
    renderer.render(scene, camera);
    scene.remove(light);

    ctx.drawImage(renderCanvas, 0, 0);

    return canvas;
}

function generateImageThumbnail(image) {
    const canvas = document.createElement("canvas");
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext("2d");

    let scale = THUMBNAIL_SIZE / Math.max(image.height, image.width);
    let h = image.height * scale;
    let w = image.width * scale;
    ctx.fillStyle = '#888888'
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
    ctx.drawImage(image, (THUMBNAIL_SIZE - w) / 2, (THUMBNAIL_SIZE - h) / 2, w, h);

    return canvas;
}

function generateAudioThumbnail(audioBuffer) {
    const canvas = document.createElement("canvas");
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#888888'
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)

    const channelDataFloat32 = audioBuffer.getChannelData(0);
    // one chunk per thumbnail pixel
    const chunkSize = Math.ceil(channelDataFloat32.length / THUMBNAIL_SIZE)

    const chunks = [];
    for (let i = 0; i < channelDataFloat32.length; i += chunkSize) {
        let slice = channelDataFloat32.slice(i, i + chunkSize);
        chunks.push(Math.max(...slice));
    }

    let max = Math.max(...chunks);
    // silent audio, return canvas;
    if (max == 0) return canvas;
    // add a margin at top and bottom
    max *= 1.1;
    let scale = (THUMBNAIL_SIZE / 2) / max;

    for (let i = 0; i < Math.min(chunks.length, THUMBNAIL_SIZE); i++) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(i, THUMBNAIL_SIZE / 2 - chunks[i] * scale);
        ctx.lineTo(i, THUMBNAIL_SIZE / 2 + chunks[i] * scale);
        ctx.stroke();
    }

    return canvas;
}


export let ThumbnailCreator = {
    generateSceneThumbnail,
    generateImageThumbnail,
    generateAudioThumbnail,
}