
export function mockAudioContext() {

    return {
        createGain: function () {
            return {
                connect: function () { },
                gain: { setTargetAtTime: function () { } }
            }
        },
        createMediaStreamSource: function () {
            return { connect: function () { } }
        },
        createPanner: function () {
            return { connect: function () { } }
        },
        createAnalyser: function () {
            return {
                getByteTimeDomainData: () => { }
            }
        },
        decodeAudioData: function (bufferCopy, callback) {
            // returns an audio buffer, we're just going to return the array buffer...
            let returnable = Promise.resolve();
            try {
                callback(new mockAudioBuffer(bufferCopy));
            } catch (err) {
                console.error(err);
            }
            return returnable;
        },
        createBufferSource: function () {
            return {
                start: function () { },
                stop: function () { },
                connect: function () { },
                playbackRate: { setTargetAtTime: function () { } }
            };
        }
    }
}

function mockAudioBuffer(arrayBuffer) {
    this.buf = arrayBuffer;
    this.getChannelData = function () { return Float32Array.from(this.buf); }
}