const { fork } = require('child_process');
const path = require('path');
const mysql = require('mysql');

const credentials = require('./config.json');

const connection = mysql.createConnection(credentials.MYSQL);

const query = connection.query('SELECT beatmap_id FROM beatmap WHERE mode = 0 AND eyup_star_rating IS NULL');
//const query = connection.query('SELECT beatmap_id FROM beatmap WHERE mode = 0');

query
.on('error', function(err) {
    console.error(err);
})
.on('result', function(row) {
    connection.pause();
    
    const worker = fork(path.resolve(__dirname, 'src/beatmap-processor.js'));

    worker.send({
        beatmap_path: `/home/osu/osu-beatmap-database/files/beatmaps/${row.beatmap_id}.osu`,
        beatmap_id: row.beatmap_id
    });

    worker.on('close', code => {
        if(code > 0)
            console.error(code);

        connection.resume();
    });
    
    console.log('score calculated for', row.beatmap_id);
})
.on('end', function() {
    console.log('done calculating score');
    process.exit(0);
});
