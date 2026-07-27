// See README.md

const zlib = require('node:zlib');
const fs = require('node:fs');
const { basename } = require('node:path');
const childProcess = require('node:child_process');
const { promisify } = require('node:util');

const execPromise = promisify(childProcess.exec);

const {
    instrumentName,
    soundsDir,
    outDir,
    createOgg,
    createJson,
    formatBasename,
    deleteNewFiles,
    encodeCommands,
} = require('./config');

const formatter = formatBasename || (str => str);

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

const outputTypes = createOgg ? ['mp3', 'ogg'] : ['mp3'];
const allTypes = ['wav', ...outputTypes];

const keys = [];

// The range of notes to build.  A0 to C8 is the range of a normal piano and
// of nearly all soundfonts, so it is the default.  midicube itself can play
// any MIDI note from 0x00 (C-1) to 0x7F (G9), so widen these if the source
// samples go further -- e.g. 0x0C (C0) up to 0x78 (C9).
const lowestToBuild = 0x15; // A0
const highestToBuild = 0x6C; // C8
const keysFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const keysSharps1 = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
for (let n = lowestToBuild; n <= highestToBuild; n++) {
    // Math.floor is needed for notes below C0: truncating toward zero (>> 0)
    // would name them octave 0 ('F0') rather than octave -1 ('F-1').
    const octave = Math.floor((n - 12) / 12);
    keys.push({
        number: n,
        key: keysFlats[n % 12] + octave,
        keySharp1: keysSharps1[n % 12] + octave,
        keySharp2: keysSharps1[n % 12].replace('s', '#') + octave,
    });
}

const createdFiles = [];
const missingKeys = {
    mp3: [],
    ogg: [],
};

const promises = keys.map(async ({
    number, key, keySharp1, keySharp2,
}) => {
    // Build set of paths useful for normalizing source filenames
    const paths = {};
    allTypes.forEach(type => {
        paths[type] = `${soundsDir}/${formatter(key)}.${type}`; // Bb3
        paths[`${type}-num`] = `${soundsDir}/${formatter(number)}.${type}`; // 58
        paths[`${type}-s`] = `${soundsDir}/${formatter(keySharp1)}.${type}`; // As3
        paths[`${type}-#`] = `${soundsDir}/${formatter(keySharp2)}.${type}`; // A#3
    });

    // Normalize source files to Bb3.<type>
    for (const type of allTypes) {
        if (fs.existsSync(paths[type])) {
            // Already in needed format
            continue;
        }

        // Copy 58.<type> to Bb4.<type>
        if (fs.existsSync(paths[`${type}-num`])) {
            fs.copyFileSync(paths[`${type}-num`], paths[type]);
            createdFiles.push(paths[type]);
            continue;
        }

        // Copy As4.<type> or A#4.<type> to Bb4.<type>
        for (const num of ['s', '#']) {
            if (fs.existsSync(paths[`${type}-${num}`])) {
                fs.copyFileSync(paths[`${type}-${num}`], paths[type]);
                createdFiles.push(paths[type]);
                break;
            }
        }
    }

    const ret = {};

    await Promise.all(outputTypes.map(async type => {
        if (!fs.existsSync(paths[type]) && fs.existsSync(paths.wav)) {
            // encode WAV to {type}
            try {
                console.log(`Converting ${basename(paths.wav)} to ${type}`);
                await execPromise(`${encodeCommands[type]} '${paths.wav}'`);
            } catch (err) {
                throw new Error(err);
            }
            if (!fs.existsSync(paths[type])) {
                throw new Error(`${type} encoding failed for ${basename(paths.wav)}`);
            }
            createdFiles.push(paths[type]);
        }

        if (fs.existsSync(paths[type])) {
            const buffer = fs.readFileSync(paths[type]);
            ret[type] = {
                key,
                data: `data:audio/mp3;base64,${buffer.toString('base64')}`,
            };
        } else {
            missingKeys[type].push(key);
        }
    }));

    return ret;
});

Promise.all(promises).then(objs => {
    outputTypes.forEach(type => {
        const data = objs.map(obj => obj[type])
            // Only data that was found
            .filter(keyData => Boolean(keyData))
            // Assemble into object
            .reduce(
                (acc, curr) => {
                    acc[curr.key] = curr.data;
                    return acc;
                },
                {}
            );
        writeMidiJs(type, data);
        if (createJson) {
            writeJson(type, data);
        }
    });

    if (deleteNewFiles) {
        createdFiles.forEach(path => fs.rmSync(path));
    }
}).catch(err => {
    console.error(err);
});

function writeMidiJs(type, data) {
    // Note that some parsers require a trailing comma after the last object value,
    // So stringify-ing the whole data will not work.
    const lines = Object.entries(data).map(
        ([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`
    );

    const jsCode = `
if (typeof(MIDI) === "undefined") var MIDI = {};
if (typeof(MIDI.Soundfont) === "undefined") MIDI.Soundfont = {};
MIDI.Soundfont.${instrumentName} = {
${lines.join('\n')}
}
    `.trim();

    const path = `${outDir}/${instrumentName}.${type}.js`;
    fs.writeFileSync(path, jsCode);
    console.log(`Created ${path}`);

    const buf = Buffer.from(jsCode, 'utf-8');
    const res = zlib.gzipSync(buf);
    fs.writeFileSync(path + '.gz', res);
    console.log(`Created ${path}.gz`);

    if (missingKeys[type].length) {
        console.log('The file is missing data for some notes: '
            + missingKeys[type].join(','));
    }
}

function writeJson(type, data) {
    const json = JSON.stringify(data, null, 2);

    const path = `${outDir}/${instrumentName}.${type}.json`;
    fs.writeFileSync(path, json);
    console.log(`Created ${path}`);

    if (missingKeys[type].length) {
        console.log('The file is missing data for some notes: '
            + missingKeys[type].join(','));
    }
}
