const { dirname } = require('path');

const rootDir = dirname(dirname(__dirname));

module.exports = {
    instrumentName: 'synth_drum',

    // Location of source wav/mp3/ogg files
    soundsDir: `${rootDir}/examples/soundfont/synth_drum-mp3`,

    // Where JS soundfonts will be created
    outDir: `${rootDir}/build`,

    // Create {instrument}.ogg.js
    createOgg: false,

    // Create {instrument}.ogg.json (non-standard but easier to parse)
    createJson: false,

    // The process creates files in the soundsDir directory. Delete them?
    deleteNewFiles: true,

    // If you have files like "A2v8.mp3", create this function so
    // the generator knows how to find them.
    //formatBasename: key => `${key}v8`,

    encodeCommands: {
        mp3: 'lame -q 0 -V 0 --silent --noreplaygain',
        ogg: 'oggenc -m 32 -M 128',
    },
};
