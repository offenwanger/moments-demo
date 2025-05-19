// Util to convert from old story format to new story format
// meant to be run as a node file. 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let model = JSON.parse(fs.readFileSync(__dirname + '/story.json', 'utf8'));
fs.writeFileSync(__dirname + '/old_story_' + Date.now() + '.json', JSON.stringify(model), 'utf8');

if (!model.version || model.version < 0.1) {
    (console).log('Migrating model from 0 to 0.1')
    for (let key of Object.keys(model)) {
        (console).log(key, model[key].length);
    }

    for (let assetPose of model.assetPoses) {
        let parent = model.assets.find(a => a.poseIds.includes(assetPose.id));
        if (!parent) parent = model.poseableAssets.find(a => a.poseIds.includes(assetPose.id));
        if (!parent) { console.error("Cannot find parent for " + assetPose.id); } else {
            assetPose.parentId = parent.id;
        }
    }

    for (let poseableAsset of model.poseableAssets) {
        delete poseableAsset.poseIds;

        let moment = model.moments.find(m => m.poseableAssetIds.includes(poseableAsset.id));
        if (!moment) {
            console.error("Cannot find parent for " + poseableAsset.id);
            model.poseableAssets = model.poseableAssets.filter(p => p.id != poseableAsset.id);
        } else {
            poseableAsset.momentId = moment.id;
        }
    }

    for (let picture of model.pictures) {
        let moment = model.moments.find(m => m.pictureIds.includes(picture.id));
        if (!moment) {
            console.error("Cannot find parent for " + picture.id);
            model.pictures = model.pictures.filter(p => p.id != picture.id);
        } else {
            picture.momentId = moment.id;
        }
    }

    for (let audio of model.audios) {
        let moment = model.moments.find(m => m.audioIds.includes(audio.id));
        if (!moment) {
            console.error("Cannot find parent for " + audio.id);
            model.audios = model.audios.filter(p => p.id != audio.id);
        } else {
            audio.momentId = moment.id;
        }
    }

    for (let teleport of model.teleports) {
        let moment = model.moments.find(m => m.teleportIds.includes(teleport.id));
        if (!moment) {
            console.error("Cannot find parent for " + teleport.id);
            model.teleports = model.teleports.filter(p => p.id != teleport.id);
        } else {
            teleport.destinationId = teleport.momentId;
            teleport.momentId = moment.id;
        }
    }

    // surfaces not compatible. Lose them.
    model.surfaces = [];

    for (let photosphere of model.photospheres) {
        photosphere.assetId = photosphere.imageAssetId;
        photosphere.blur = false;

        // information not compatible, delete it.
        delete photosphere.imageAssetId;
        delete photosphere.colorAssetId;
        delete photosphere.blurAssetId;
        delete photosphere.surfaceIds;

        let moment = model.moments.find(m => m.photosphereId == photosphere.id);
        if (!moment) {
            console.error("Cannot find parent for " + photosphere.id);
            model.photospheres = model.photospheres.filter(p => p.id != photosphere.id);
        } else {
            photosphere.momentId = moment.id;
        }
    }

    for (let moment of model.moments) {
        delete moment.poseableAssetIds;
        delete moment.pictureIds;
        delete moment.audioIds;
        delete moment.teleportIds;
        delete moment.photosphereId;
    }

    for (let asset of model.assets) {
        if (asset.type == 'blur' || asset.type == 'color') {
            // remove invalid asset types.
            model.assets = model.assets.filter(p => p.id != asset.id);
        } else {
            delete asset.poseIds;
        }

    }

    model.version = 0.1;
}

fs.writeFileSync(__dirname + '/story.json', JSON.stringify(model), 'utf8');