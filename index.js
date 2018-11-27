const _ = require('lodash');
const db = require('./lib/db');

module.exports = class GYFVD {
    constructor(options = {}) {
        this.options = _.assign({
            "loud": true,
            "sst_api": "etri",
            "subtitle_auto": true,
            "subtitle_lang": 'ko',
            "subtitle_download": true,
            "subtitle_validation": false,
            "save_video_info": {
                fourccCode: 0x00000021,
                fps: 30,
                w: 120,
                h: 120
            },
            "detect_face_info": {
                w: 40,
                h: 40,
                scaleFactor: 1.2,
                minNeighbors: 10
            },
            "sec_last_trim": 0.1
        }, options);

        if (db.get_priviate("youtube_v3_api_key") == undefined) throw new Error("set youtube_v3_api_key!")
        if ((this.options.subtitle_validation || !this.options.subtitle_download)
            && (db.get_priviate("etri_sst_api_keys") || []).length < 1) throw new Error("set etri_sst_api_keys!")

        db.get_db();
    }

    async start(cnannel_id, num_video = 9999) {
        const num_succ_crawled_video = await this.crawl(cnannel_id, num_video);
        await this.data_process(num_succ_crawled_video);
    }

    async crawl(cnannel_id, num_video = 9999) {
        const crawling = require('./lib/crawl');
        const succ_count = await crawling(cnannel_id, num_video, this.options);
        console.log(`End crawling and succ count: ${succ_count}`);
        return succ_count;
    }

    async data_process(num = 10) {
        const not_hurt_item_len = db.get_len_db();
        let num_diff = (num - not_hurt_item_len);
        if (num_diff > 0) {
            throw new Error(`Available ${not_hurt_item_len}, Need to crawl ${num_diff} firstly.`);
        }
        const data_processing = require('./lib/data_process');
        for (const sample of db.get_sample(num)) {
            await data_processing(sample.path_video, sample.path_subtitle, this.options);
        };
        console.log(`End data_process`);
        return true;
    }

    async clear() {
        // @WARN: This erases all of cache files.
        db.clear_cache_db();
    }
}