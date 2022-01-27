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

        // utc start of the day 00:00 in seconds
        const startTime = parseInt(new Date(year, month - 1, date).setUTCHours(0) / 1000);
        // utc end of the day 23:59
        const endTime = startTime + 86400;

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
        try {
            const dataForTheGivenDay = [];
            for (let index = 0; index < data.length; index++) {
                if (data[index].time <= endTime) {

                    if (data[index].time >= startTime) {
                        dataForTheGivenDay.push(data[index]);
                    } else break;
                }
            }
            resolve({ dataForTheGivenDay });
        } catch (error) {
            reject(error);
        }
    });
}

function getMostActive(data) {
    if (data.length == 0) {
        return [];
    } else if (data.length == 1) {
        return data[0];
    } else {
        // Find the most active cookie
        const frequency = [];
        for (let index = 0; index < data.length; index++) {
            const element = data[index].cookie;

            // Find if the cookie is already present
            let flag = false;
            for (let j = 0; j < frequency.length; j++) {
                const c = frequency[j];
                // Increement freq
                if (c.cookie == element) {
                    c.frequency++;
                    flag = true;
                }
            }

            // If cookie not present, push it
            if (!flag) {
                frequency.push({ cookie: element, frequency: 1 });
            }
        }

        // sort by frequency
        frequency.sort(function(a, b) { return b.frequency - a.frequency });

        // Get most active
        const mostActiveCookie = frequency[0];

        // Filter out all most active ones
        const mostActiveCookies = frequency.filter(f => f.frequency == mostActiveCookie.frequency);

        // Return list of cookies
        return mostActiveCookies.map(c => c.cookie);
    }
}

parseArguments()
    .then(parseDate)
    .then((date) => parseCsv(date, filename))
    .then(({ data, startTime, endTime }) => filterData(data, startTime, endTime))
    .then(({ dataForTheGivenDay }) => getMostActive(dataForTheGivenDay))
    .then((data) => {
        for (let index = 0; index < data.length; index++) {
            console.log(data[index]);
        }
    })
    .catch(error => console.log(error));