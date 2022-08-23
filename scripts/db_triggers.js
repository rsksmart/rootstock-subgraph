require('dotenv').config();
const { Client } = require('pg')
var fs = require('fs');
var triggerSql = fs.readFileSync('scripts/sql/db_triggers.sql').toString();
var cleanupSql = fs.readFileSync('scripts/sql/candle_cleanup.sql').toString();

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: 5432,
})
client.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    client.query(triggerSql, function (err, result) {
        if (err) {
            console.log('error: ', err);
            process.exit(1);
        } else {
            console.log('Database triggers added')
        }
    });
    client.query(cleanupSql, function (err, result) {
        if (err) {
            console.log('error: ', err);
            process.exit(1);
        } else {
            console.log('Candle cleanup sql finished')
        }
        process.exit(0);
    });
});