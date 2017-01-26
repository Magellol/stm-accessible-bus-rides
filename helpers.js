const fs = require('fs');
const path = require('path');

function compose(a, b) {
  return (...args) => a(b(...args));
}

/**
 * Promisify the readFile() function from node.
 * Ain't nobody got time for callbacks.
 *
 * @param  {string} filename    Name of the file to read.
 * @param  {string} [ext='txt'] Extension will default to `txt`.
 * @return {Promise}            Promise that will resolve with the string representation for the file.
 */
function readDataFile(filename, ext = 'txt') {
  const fullPath = path.join(__dirname, 'data', `${filename}.${ext}`);

  return new Promise((resolve, reject) => {
    fs.readFile(fullPath, 'utf8', (error, data) => {
      if (error) {
        return reject(error);
      }

      return resolve(data);
    });
  });
}


/**
 * Promisify the writeFile() function from node.
 *
 * @param  {object} data An object ready to be JSON stringifi'ed.
 * @return {Promise}     Promise that will resolve with the original data passed in.
 */
function writeToCache(data) {
  const filename = path.join(__dirname, 'data', 'cache.json');

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(data), 'utf8', (error) => {
      if (error) {
        return reject(error);
      }

      return resolve(data);
    });
  });
}

/**
 * Returns the % of a value based on a total number.
 * Also formats it to only include 2 decimals.
 *
 * @param  {Number} n     The main number from which we'd define its percentage.
 * @param  {Number} total The total number.
 * @return {Number}       Float representation of the percentage.
 */
function getPercentage(n, total) {
  return ((n / total) * 100).toFixed(2);
}

module.exports = {
  compose,
  readDataFile,
  writeToCache,
  getPercentage
};
