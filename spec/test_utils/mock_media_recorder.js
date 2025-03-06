export function mockMediaRecorder(stream) {
    // silent WAV
    // data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA
    return {
        start: function () { this.onstart() },
        pause: function () { },
        resume: function () {
            this.ondataavailable({ data: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKw' });
            this.ondataavailable({ data: 'AAIhYAQACABAAAABkYXRhAgAAAAEA' });
        },
        stop: function () { },
        mimeType: 'audio/wav',
    }
}