export function AudioRecorder() {
    const BUFFER_LENGTH = 2048;
    let mIsPlaying = false;
    let mIsRecording = false;

    let mCanvas = document.createElement('canvas');
    const mCtx = mCanvas.getContext("2d");

    let mOnChunkCallback = () => { }

    let mMediaRecorder;

    let mChunks = [];
    const mDataArray = new Uint8Array(BUFFER_LENGTH);

    let mAudioCtx = new AudioContext();
    const mAnalyser = mAudioCtx.createAnalyser();
    mAnalyser.fftSize = BUFFER_LENGTH;

    const mAudio = new Audio();
    mAudio.loop = true

    function init() {
        if (!navigator.mediaDevices.getUserMedia) {
            console.error("MediaDevices.getUserMedia() not supported on browser.");
            return Promise.reject();
        }

        // Audio recording is supported. 
        const constraints = { audio: true };
        return navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                mMediaRecorder = new MediaRecorder(stream);
                const source = mAudioCtx.createMediaStreamSource(stream);
                source.connect(mAnalyser);

                mMediaRecorder.ondataavailable = function (e) {
                    mChunks.push(e.data);
                    mOnChunkCallback(e.data);
                };

                mMediaRecorder.onstart = function (e) {
                    // needed to ensure fresh start.
                    mChunks = [];
                }

                mMediaRecorder.start(1000)
                mMediaRecorder.pause();
            })
            .catch(e => {
                console.error(e);
                console.error('Failed to start audio recorder.');
            });
    }

    function startRecording() {
        mMediaRecorder?.resume();
        mIsRecording = true;
    }

    function stopRecording() {
        mMediaRecorder?.pause();
        mIsRecording = false;
    }

    function clearRecorder() {
        mMediaRecorder?.stop();
        mMediaRecorder?.start(1000);
        mMediaRecorder?.pause();
        // this doesn't actually clear it because
        // the asyncronous stop drops the last chunk, but 
        // do it anyway.
        mChunks = [];
    }

    function playAudioFile() {
        if (mChunks.length == 0) {
            // nothing to play.
            return;
        }

        const blob = new Blob(mChunks, { type: mMediaRecorder.mimeType });
        const audioURL = window.URL.createObjectURL(blob);
        mAudio.src = audioURL;
        mAudio.load();
        mAudio.play();
        mIsPlaying = true;
    }

    function stopAudioFile() {
        mIsPlaying = false;
        mAudio.pause();
    }

    function rewindAudioFile() {
        mAudio.currentTime -= 1
    }

    function forwardAudioFile() {
        mAudio.currentTime += 1
    }

    function animate() {
        const WIDTH = mCanvas.width;
        const HEIGHT = mCanvas.height;
        mAnalyser.getByteTimeDomainData(mDataArray);

        mCtx.fillStyle = "rgb(200, 200, 200)";
        mCtx.fillRect(0, 0, WIDTH, HEIGHT);

        mCtx.lineWidth = 2;
        mCtx.strokeStyle = "rgb(0, 0, 0)";

        mCtx.beginPath();

        let sliceWidth = (WIDTH * 1.0) / BUFFER_LENGTH;
        let x = 0;

        for (let i = 0; i < BUFFER_LENGTH; i++) {
            let v = mDataArray[i] / 128.0;
            let y = (v * HEIGHT) / 2;

            if (i === 0) {
                mCtx.moveTo(x, y);
            } else {
                mCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        mCtx.lineTo(mCanvas.width, mCanvas.height / 2);
        mCtx.stroke();
    }

    function hasContent() {
        return mChunks.length > 1;
    }

    function getAudioBlob() {
        return new Blob(mChunks, { type: mMediaRecorder.mimeType });
    }

    function getExtension() {
        if (mMediaRecorder.mimeType.includes('audio/wav')) {
            return '.wav';
        } else if (mMediaRecorder.mimeType.includes('audio/webm')) {
            return '.weba';
        } else if (mMediaRecorder.mimeType.includes('audio/mpeg')) {
            return '.mp3';
        } else if (mMediaRecorder.mimeType.includes('audio/mp4')) {
            return '.mp4';
        } else {
            console.error('Mimetype extension not known: ' + mMediaRecorder.mimeType);
            return '';
        }
    }

    this.init = init;
    this.startRecording = startRecording;
    this.stopRecording = stopRecording;
    this.clearRecorder = clearRecorder;
    this.playAudioFile = playAudioFile;
    this.stopAudioFile = stopAudioFile;
    this.rewindAudioFile = rewindAudioFile;
    this.forwardAudioFile = forwardAudioFile;
    this.animate = animate;
    this.hasContent = hasContent;
    this.getAudioBlob = getAudioBlob;
    this.getExtension = getExtension;
    this.isPlaying = () => mIsPlaying;
    this.isRecording = () => mIsRecording;
    this.getCanvas = () => mCanvas;
    this.onChunk = (func) => mOnChunkCallback = func;
}