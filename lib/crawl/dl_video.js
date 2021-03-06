const fs = require('fs');
const _ = require('lodash');
const youtubedl = require('youtube-dl');

module.exports = async (link, _file_name, _path = __dirname, options) => {
    // @INFO: link is videoId
    if (!_.includes(link, 'http')) link = `http://www.youtube.com/watch?v=${link}`;
    if (!_.includes(_file_name, '.mp4')) _file_name += '.mp4';

    const path_output = `${_path}/${_file_name}`;
    if (await fs.existsSync(path_output)) return Promise.resolve(path_output);

    const logger = options.logger;
    logger.info('[dl_video] reqest', link, _file_name, _path);

    let video = youtubedl(link,
        // Optional arguments passed to youtube-dl.
        ['--format=18'],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname });

    video.pipe(fs.createWriteStream(path_output, { flags: 'a' }));

    return new Promise((resolve) => {
        video.on('error', function (err) {
            throw new Error(err);
        });

        // Will be called when the download starts.
        video.on('info', function (info) {
            logger.debug('Download started');
            logger.debug('filename: ' + info._filename);
            logger.debug('size: ' + info.size);
        });

        video.on('end', function () {
            resolve(path_output);
        });
    });
}