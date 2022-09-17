const fetch = require('node-fetch');
const mysql = require('mysql');
const util = require('util');

const config = require('./config.json');

const connection = mysql.createConnection(config.MYSQL);
const runSql = util.promisify(connection.query).bind(connection);

async function upsertBeatmap(b) {
    const values = [b.beatmap_id, b.beatmapset_id, b.approved, b.total_length, b.hit_length,
    b.version, b.artist, b.title, b.creator, b.creator_id, b.mode, b.diff_size,
    b.diff_overall, b.diff_approach, b.diff_drain, b.approved_date, b.last_update,
    Math.min(2147483647, b.bpm), b.source, b.tags, b.genre_id, b.language_id, b.max_combo,
    b.difficultyrating, b.favourite_count, b.playcount, b.passcount,
    b.count_normal, b.count_slider, b.count_spinner, Number(b.count_normal) + Number(b.count_slider) + Number(b.count_spinner), b.submit_date, b.packs || '',
    b.rating, b.storyboard, b.video, b.download_unavailable, b.audio_unavailable, b.file_md5
    ];

    const query = `
        INSERT INTO beatmap
           (beatmap_id, beatmapset_id, approved, total_length, hit_length,
            version, artist, title, creator, creator_id, mode, cs, od, ar, hp,
            approved_date, last_updated_date, bpm, source, tags, genre_id,
            language_id, max_combo, star_rating, favorites, plays, passes,
            num_circles, num_sliders, num_spinners, hit_objects, submitted_date, packs,
            rating, storyboard, video, download_unavailable, audio_unavailable, file_md5
        )
        VALUES
            (${"?, ".repeat(values.length - 1)}?)
        ON DUPLICATE KEY UPDATE
            beatmap_id = ?, beatmapset_id = ?, approved = ?, total_length = ?, hit_length = ?,
            version = ?, artist = ?, title = ?, creator = ?, creator_id = ?, mode = ?, cs = ?, od = ?, ar = ?, hp = ?,
            approved_date = ?, last_updated_date = ?, bpm = ?, source = ?, tags = ?, genre_id = ?,
            language_id = ?, max_combo = ?, star_rating = ?, favorites = ?, plays = ?, passes = ?,
            num_circles = ?, num_sliders = ?, num_spinners = ?, hit_objects = ?, submitted_date = ?, packs = ?,
            rating = ?, storyboard = ?, video = ?, download_unavailable = ?, audio_unavailable = ?, file_md5 = ?
    `;

    await runSql(query,
        [...values, ...values]);
}


async function updateBeatmap(beatmap_id) {
    try {
        const response = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${config.OSU_API_KEY}&b=${beatmap_id}`);
        const beatmaps = await response.json();

        for (const beatmap of beatmaps)
            await upsertBeatmap(beatmap);

        return
    } catch (e) {
        console.error(e);
        return
    }
}

async function updateAllBeatmaps() {
    const result = await runSql('SELECT beatmap_id FROM beatmap WHERE approved > 0')

    for (const row of result) {
        await updateBeatmap(row.beatmap_id)
        console.log('updated data for', row.beatmap_id)
    }

    console.log('done updating data')
    process.exit(0);
}

updateAllBeatmaps()
