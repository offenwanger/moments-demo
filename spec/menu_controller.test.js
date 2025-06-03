
import { cleanup, setup } from './test_utils/test_environment.js';

import { AssetTypes, MenuNavButtons } from '../js/constants.js';
import { canvasClickMenuButton, createAndOpenStoryMoment, testmodel, uploadImageAsset } from './test_utils/test_actions.js';


describe('Test menu buttons', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should open a story',  function () {
             createAndOpenStoryMoment();
        });
    });

    describe('add tests', function () {
        it('should add a story picture',  function () {
             createAndOpenStoryMoment();
             uploadImageAsset();
            let assetId = testmodel().assets.find(a => a.type == AssetTypes.IMAGE).id;

             canvasClickMenuButton(MenuNavButtons.ADD);
             canvasClickMenuButton(MenuNavButtons.ADD_PICTURE);
             canvasClickMenuButton(assetId);

            expect(testmodel().pictures.length).toBe(1);
             canvasClickMenuButton(assetId);
             canvasClickMenuButton(assetId);
            expect(testmodel().pictures.length).toBe(3);
        });
    });
});