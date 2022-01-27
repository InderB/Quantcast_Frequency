let fs = require('fs');
const csv = require('fast-csv');
const moment = require('moment');
const _ = require('lodash');

let d, filename;

function parseArguments() {
    return new Promise((resolve, reject) => {
        const myArgs = process.argv.slice(2);

        filename = myArgs[0];
        d = myArgs[2];

        if (filename == undefined) reject('Filename required');
        if (d == undefined) reject('Date required');

        resolve();
    })
}

function parseDate() {
    return new Promise((resolve, reject) => {
        let dateToParse = d.split('-');
        const year = parseInt(dateToParse[0]);

        const month = parseInt(dateToParse[1]);
        const date = parseInt(dateToParse[2]);

        const startTime = moment().year(year).month(month - 1).date(date).startOf('day').unix();
        const endTime = moment(startTime * 1000).endOf('day').unix();

        resolve({ startTime, endTime });
    });
}

function parseCsv({ startTime, endTime }, filename) {
    return new Promise((resolve, reject) => {
        try {
            let data = [];
            fs.createReadStream(filename)
                .on('error', function() {
                    reject(`Expected csv file. Given file ${filename} not found or it is corrupted`);
                })
                .pipe(csv.parse({ delimiter: '\n' }))
                .on('data', function(csvrow) {
                    let row = csvrow[0].split(',');
                    data.push({ cookie: row[0], time: moment(row[1]).unix() });
                })
                .on('end', function() {
                    resolve({ data, startTime, endTime });
                })

        } catch (error) {
            reject(error);
        }
    });

}

function filterData(data, startTime, endTime) {
    return new Promise((resolve, reject) => {
        let rows = _.filter(data, function(d) { return d.time >= startTime && d.time <= endTime; });
        resolve({ rows });
    });
}

function getMostActive(data) {
    const frequency = [];
    for (let index = 0; index < data.length; index++) {
        const element = data[index].cookie;

        let j = _.findIndex(frequency, { cookie: element });
        if (j > -1) // if present, increement count
            frequency[j]['frequency']++;
        else frequency.push({ cookie: element, frequency: 1 });
    }

    // sort by frequency
    const freq = _.sortBy(frequency, 'frequency');
    // Get most active
    const mostActive = freq[freq.length - 1];
    // Filter out all most active ones
    const l = _.filter(freq, { frequency: mostActive.frequency });

    return _.map(l, 'cookie');
}

parseArguments()
    .then(parseDate)
    .then((date) => parseCsv(date, filename))
    .then(({ data, startTime, endTime }) => filterData(data, startTime, endTime))
    .then(({ rows }) => getMostActive(rows))
    .then((data) => {
        for (let index = 0; index < data.length; index++) {
            console.log(data[index]);
        }
    })
    .catch(error => console.log(error));