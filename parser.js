/**
 * File: Parser.js
 * Description: Script to parse the provided csv file and return the most active cookie for the given the date
 * Author: Inderjeet Bilkhu
 * 
 */

/** Required header files */
// File reader
let fs = require('fs');
// Csv parser
const csv = require('fast-csv');

// Global variables to store the cli-input
let DATE, FILENAME;

/**
 * @name parseArguments
 * @returns Sets DATE and FILENAME
 */
function parseArguments() {
    return new Promise((resolve, reject) => {
        const myArgs = process.argv.slice(2);

        FILENAME = myArgs[0];
        DATE = myArgs[2];

        if (FILENAME == undefined) reject('Filename required');
        if (DATE == undefined) reject('Date required');

        resolve();
    })
}

/**
 * @name parseDate
 * @param {String} DATE input of the form 2018-12-09
 * @returns {Promise} Start and end time of the given day in unix
 */
function parseDate(DATE) {
    return new Promise((resolve, reject) => {
        try {
            let dateToParse = DATE.split('-');
            const year = parseInt(dateToParse[0]);
            const month = parseInt(dateToParse[1]);
            const date = parseInt(dateToParse[2]);

            // utc start of the day 00:00 in seconds
            const startTime = parseInt(new Date(year, month - 1, date).setUTCHours(0) / 1000);
            // utc end of the day 23:59
            const endTime = startTime + 86400;

            resolve({ startTime, endTime });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @name parseCsv
 * @param {Object} param Start and end time of the given day 
 * @param {String} FILENAME CSV file to be parsed
 * @returns {Promise} Returns data of the given day from the csv with cookie and time in unix
 */
function parseCsv({ startTime, endTime }, FILENAME) {
    return new Promise((resolve, reject) => {
        try {
            let ENTRIES_OF_THE_GIVEN_DAY = [];
            fs.createReadStream(FILENAME)
                .on('error', function() {
                    reject(`Expected csv file. Given file ${FILENAME} not found or it is corrupted`);
                })
                .pipe(csv.parse({ delimiter: '\n' }))
                .on('data', function(csvrow) {
                    // Row with cookie and time properties
                    let row = csvrow[0].split(',');
                    // Convert time into unix
                    let time = parseInt(new Date(row[1]).getTime() / 1000);
                    // If time is of the required day, push it into the array
                    if (time >= startTime && time <= endTime)
                        ENTRIES_OF_THE_GIVEN_DAY.push({ cookie: row[0], time });
                })
                .on('end', function() {
                    resolve({ dataForTheGivenDay: ENTRIES_OF_THE_GIVEN_DAY, startTime, endTime });
                })

        } catch (error) {
            reject(error);
        }
    });

}

/**
 * @name getMostActive
 * @param {Array} data Array of objects each with cookie and time
 * @returns {Array} Array of the most active cookies
 */
function getMostActive(data) {
    try {
        if (data.length == 0) {
            return [];
        } else if (data.length == 1) {
            return data[0];
        } else {
            // Find the frequency of all the cookies
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
    } catch (error) {
        reject(error);
    }
}

parseArguments()
    .then(() => parseDate(DATE))
    .then((date) => parseCsv(date, FILENAME))
    .then(({ dataForTheGivenDay }) => getMostActive(dataForTheGivenDay))
    .then((data) => {
        for (let index = 0; index < data.length; index++) {
            console.log(data[index]);
        }
    })
    .catch(error => console.log(error));