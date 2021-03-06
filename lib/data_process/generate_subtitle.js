const fs = require('fs');
const cp = require('child_process');
const utils = require('./utils');
const _ = require('lodash');
module.exports = async (path_subtitle, path_mp3, info, options) => {
    const logger = options.logger;
    const name_audio = info.name_video;

    return new Promise(async (resolve) => {
        const time_table = split_audio_by_silence(path_mp3, info, options);
        logger.info('End split_audio_by_silence');

        const paths_mp3 = await utils.generate_splited_audio(time_table, path_mp3, name_audio);
        logger.info('End generate_splited_audio');

        const word_set = await utils.call_stt_api(options.sst_api, paths_mp3, options.subtitle_lang);
        logger.info('End sst_api_func', time_table.length, '==', word_set.length);

        if (time_table.length != word_set.length) throw new Error("Not equal times and words counts");

        let json = [];
        for (let i = 0, l = time_table.length; i < l; i++) {
            json.push(_.merge({
                "id": i,
                "start": time_table[i].start,
                "end": time_table[i].end
            }, word_set[i]));
        }
        await fs.writeFileSync(path_subtitle, JSON.stringify(json, null, 4), 'utf8');
        logger.debug('generate subtile path:', path_subtitle);

        resolve(path_subtitle);
    });
}

function split_audio_by_silence(path_mp3, info, options) {
    const { start_time, duration } = info;
    const silence_info = options.silence_info;
    let out = cp.spawnSync(silence_info.ffmpegPath, [
        '-i', `${path_mp3}`,
        '-af', `silencedetect=noise=${silence_info.maxNoiseLevel}dB:d=${silence_info.minSilenceLength}`,
        '-f', 'null',
        '-'
    ], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'pipe',
            encoding: 'utf-8'
        });

    out = out.output.toString();
    let pattern = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g;
    let m, start = start_time, end = 0;
    let time_table = [];
    function add_time_table(start, end) {
        const duration = (end - start);
        if (duration > 0.1) {
            time_table.push({ start, end });
        }
    }
    while (m = pattern.exec(out)) {
        const silence_start = m[1], silence_end = m[2];
        end = silence_start;
        add_time_table(start, end);
        start = silence_end;
    };
    add_time_table(start, duration); // last

    return time_table;
}