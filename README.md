# Quantcast

## Most Active Cookie Fetcher

Script to get the most active cookies for the given date

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install the dependencies

```bash
npm install
```

## Usage

```bash
node parser.js CSV_FILENAME -d DATE

# Example:
node parser.js log.csv -d 2018-12-08

SAZuXPGUrfbcn5UA
4sMM2LxV07bPJzwf
fbcn5UAVanZf6UtG
```

## Description

The script uses csv parser to parse the rows in the file and filter out the ones of the specified date. Using basic array and string functions it further counts the frequencies of each cookie and then reports the most active cookie(s).
