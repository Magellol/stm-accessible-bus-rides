const fs = require('fs');
const path = require('path');

function compose(a, b) {
  return (...args) => a(b(...args));
}

function readFile(filename) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, 'data', `${filename}.txt`);

    fs.readFile(fullPath, 'utf8', (error, data) => {
      if (error) {
        return reject(error);
      }

      return resolve(data);
    });
  });
}

module.exports = { compose, readFile };
