// TODO re-write using function composition?
// const compose = (a, b) => (...args) => a(b(...args));
// or HOF

if (process.versions.node < '7.2.0') {
  throw new Error('Awww dude, you\'re going to need at least node 7.2.0 to run this bad boy.');
}

console.time('timing');

const { strictEqual } = require('assert');
const { compose, readFile } = require('./helpers');
const {
  SERVICE_TYPE_BUS,
  ROUTE_TYPE_LABEL,
  ROUTE_ID_LABEL,
  WHEELCHAIR_ACCESSIBLE_LABEL,
  WHEELCHAIR_STATUS_UNKNOWN,
  WHEELCHAIR_STATUS_ACCESSIBLE,
  WHEELCHAIR_STATUS_NOT_ACCESSIBLE
} = require('./constants');

function format(responseAsPromise) {
  return responseAsPromise.then(string => {
    const [head, ...rows] = string.split('\n');
    const formattedHead = head.split(',').map(label => (
      label.replace(/_+(.)/g, (match, character) => character.toUpperCase())
    ));

    const formattedRows = rows.map(row => row.split(','));
    return [formattedHead, formattedRows];
  });
}

// Normalizing properties.
function mapArrayValuesToObjectProps(labels, row, fields = []) {
  return fields.reduce((accumulator, field) => {
    const index = labels.indexOf(field);

    return Object.assign({}, accumulator, {
      [field]: row[index]
    });
  }, {});
}

// TODO There is a possibility here to curry the map callback.
function getBuses([labels, vehicules]) {
  const typeIndex = labels.indexOf(ROUTE_TYPE_LABEL);

  return vehicules
    .filter(vehicule => vehicule[typeIndex] === SERVICE_TYPE_BUS)
    .map(bus => {
      return mapArrayValuesToObjectProps(labels, bus, [
        'routeId',
        'routeShortName',
        'routeLongName'
      ]);
    });
}

function addTripsToBuses(buses, [labels, trips]) {
  const busIdIndex = labels.indexOf(ROUTE_ID_LABEL);

  return buses.map(bus => {
    const filtered = trips
      .filter(trip => trip[busIdIndex] === bus.routeId)
      .reduce((accumulator, trip) => {
        const { wheelchairAccessible } = mapArrayValuesToObjectProps(labels, trip, ['wheelchairAccessible']);
        const prop = accumulator[wheelchairAccessible];

        return Object.assign({}, accumulator, {
          [wheelchairAccessible]: prop ? prop + 1 : 1
        });
      }, {});


    return Object.assign({}, bus, filtered);
  });
}

const readAndFormat = compose(format, readFile);
const routesPromise = readAndFormat('routes');
const tripsPromise = readAndFormat('trips');

routesPromise
  .then(async (routes) => {
    const trips = await tripsPromise;
    const buses = addTripsToBuses(getBuses(routes), trips);

    console.timeEnd('timing'); // Some inaccurate benchmark.

    // Simple tests to assert my output after the refactoring.
    const busTest = buses.find(bus => bus.routeId === '747');
    strictEqual(busTest[WHEELCHAIR_STATUS_ACCESSIBLE], 1163);
    strictEqual(busTest[WHEELCHAIR_STATUS_NOT_ACCESSIBLE], 704);
  });
