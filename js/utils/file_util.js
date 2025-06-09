import { AssetTypes, STORY_JSON_FILE } from '../constants.js';
import { Data } from '../data.js';
import { logInfo } from './log_util.js';

function getFile(dir, filename) {
    return dir.getFileHandle(filename)
        .then(handle => handle.getFile());
}

function getJSONFromFile(dir, filename) {
    return getFile(dir, filename)
        .then(file => file.text())
        .then(jsonTxt => JSON.parse(jsonTxt));
}

function getDataUriFromFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.addEventListener('error', function () {
            reject(e);
        })
        reader.addEventListener('load', function () {
            resolve(reader.result);
        });
        reader.readAsDataURL(file);
    });
}

function writeFile(folder, filename, data) {
    let file = null;
    return folder.getFileHandle(filename, { create: true })
        .then(handle => handle.createWritable())
        .then(f => {
            file = f;
            return file.write(data)
        })
        .then(() => file.close());
}

function pacakgeToZip(model, assetFolder) {
    const zipFileStream = new TransformStream();
    const zipFileBlobPromise = new Response(zipFileStream.readable).blob();
    const zipWriter = new zip.ZipWriter(zipFileStream.writable);

    let modelBlobStream = new Blob([JSON.stringify(model)]).stream();
    let assets = model.assets;

    let chain = zipWriter.add(STORY_JSON_FILE, modelBlobStream);
    for (const asset of assets) {
        chain = chain
            .then(() => getFile(assetFolder, asset.filename))
            .then(file => zipWriter.add(asset.filename, file.stream()));
    }

    chain = chain
        .then(() => zipWriter.close())
        // Retrieves the Blob object containing the zip content into `zipFileBlob`.
        .then(() => zipFileBlobPromise)
        .then(zipFileBlob => {
            let outputFile = model.name + '.zip';
            return downloadBlob(outputFile, zipFileBlob);
        });
    return chain;
}

function unpackageAssetsFromZip(zipBlob, assetFolder) {
    const zipFileReader = new zip.BlobReader(zipBlob);
    const zipReader = new zip.ZipReader(zipFileReader);
    return zipReader.getEntries()
        .then(entries => {
            entries.filter(entry => entry.filename != STORY_JSON_FILE)
                .map((entry, i) => {
                    const stream = new TransformStream();
                    const fileDataPromise = new Response(stream.readable).arrayBuffer();
                    return entry.getData(stream.writable)
                        .then(() => fileDataPromise)
                        .then(arrayBuffer => {
                            logInfo('Writing file ' + (i + 1) + '/' + entries.length + ': ' + entry.filename);
                            // this will overwrite files, but only if the name is identical, 
                            // which since we edit imported names with name+time-imported, should
                            // means it's the same file. 
                            return writeFile(assetFolder, entry.filename, arrayBuffer)
                        })
                        .then(() => logInfo('File ' + (i + 1) + '/' + entries.length + ' written'))
                        .catch(e => console.error('Failed to write ' + entry ? entry.filename : 'unnamed files.'));
                })
        })
        .then(proms => Promise.all(proms))
        .then(() => zipReader.close());
}

function getModelFromZip(zipBlob) {
    const zipFileReader = new zip.BlobReader(zipBlob);
    const zipReader = new zip.ZipReader(zipFileReader);
    const stream = new TransformStream();
    const streamPromise = new Response(stream.readable).text();
    return zipReader.getEntries()
        .then(zipEntries => {
            const storyFile = zipEntries.find(entry => entry.filename == STORY_JSON_FILE);
            if (!storyFile) {
                throw new Error('Invalid archieve, story file not found.');
            }
            return storyFile.getData(stream.writable);
        })
        .then(() => zipReader.close())
        .then(() => streamPromise)
        .then((fileText) => {
            let modelJSON = JSON.parse(fileText);
            let model = Data.StoryModel.fromObject(modelJSON);
            return model;
        });
}

function downloadBlob(name, blob) {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = name;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

function downloadPNG(name, canvas) {
    new Promise(resolve => canvas.toBlob(resolve))
        .then(blob => {
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = name + ".png";
            link.click();
            // delete the internal blob reference to clear memory
            URL.revokeObjectURL(link.href);
        })
}

function showFilePicker(accept = null, multiple = false) {
    return new Promise((resolve, reject) => {
        let input = document.createElement('input');
        input.type = 'file';
        if (accept) input.accept = accept;
        if (multiple) input.multiple = true;
        input.addEventListener('change', e => {
            if (multiple) {
                resolve(e.target.files);
            } else {
                resolve(e.target.files[0]);
            }
        });
        input.addEventListener('cancel', e => {
            reject("User Cancelled.");
        });
        input.click();
    });
}

function getTypeFromFile(file) {
    let type;
    let t = file.type.split('/')[0];
    if (t == 'image') {
        type = AssetTypes.IMAGE;
    } else if (t == 'audio') {
        type = AssetTypes.AUDIO;
    } else {
        let extension = file.name.split('.').pop();
        if (extension == 'glb' || extension == 'gltf') {
            type = AssetTypes.MODEL;
        } else {
            throw new Error('Unhandled file type: ' + file.type + " " + extension);
        }
    }
    return type;
}

function cleanFilename(name) {
    let nameBreakdown = name.split(".");
    // simplify name otherwise it causes URL issues. 
    nameBreakdown[0] = nameBreakdown[0].replace(/[^a-zA-Z0-9-_]/g, '');
    nameBreakdown[0] += "-" + Date.now();
    return nameBreakdown.join('.');
}


export const FileUtil = {
    getJSONFromFile,
    getDataUriFromFile,
    getFile,
    writeFile,
    pacakgeToZip,
    unpackageAssetsFromZip,
    getModelFromZip,
    downloadBlob,
    downloadPNG,
    showFilePicker,
    getTypeFromFile,
    cleanFilename,
}

