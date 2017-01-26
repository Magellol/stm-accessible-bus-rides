if (process.versions.node < '7.2.0') {
  throw new Error('Awww dude, you\'re going to need at least node 7.2.0 to run this bad boy.');
}

const Table = require('cli-table');
const { strictEqual } = require('assert');
const { compose, readDataFile, writeToCache, getPercentage } = require('./helpers');
const {
  SERVICE_TYPE_BUS,
  ROUTE_TYPE_LABEL,
  ROUTE_ID_LABEL,
  WHEELCHAIR_ACCESSIBLE_LABEL,
  WHEELCHAIR_STATUS_UNKNOWN,
  WHEELCHAIR_STATUS_ACCESSIBLE,
  WHEELCHAIR_STATUS_NOT_ACCESSIBLE
} = require('./constants');

/**
 * Formats a raw file string and normalizes it for easier manipulation later on.
 *
 * @param  {Promise}  responseAsPromise Takes a promise that will resolve as the intended string.
 * @return {Promise}                    Returns a promise that's resolving into an array of formatted items.
 */
async function format(responseAsPromise) {
  const string = await responseAsPromise;

  const [head, ...rows] = string.split('\n');
  const formattedHead = head.split(',').map(label => (
    label.replace(/_+(.)/g, (match, character) => character.toUpperCase())
  ));

  const formattedRows = rows.map(row => row.split(','));
  return [formattedHead, formattedRows];
}

/**
 * Normalizes properties from raw inputs.
 * You'd have to pass a `fields` argument to select which properties you wish to receive back.
 *
 * @param  {array} labels       Array of column labels (snake_cased) coming from the data files.
 * @param  {array} row          Array of column items.
 * @param  {array} [fields=[]]  Array of fields you'd wish to receive back.
 * @return {object}             An object where property names are the fields you've asked for
 *                              and values are the actual values from the `row`.
 */
function mapArrayValuesToObjectProps(labels, row, fields = []) {
  return fields.reduce((accumulator, field) => {
    const index = labels.indexOf(field);

    return Object.assign({}, accumulator, {
      [field]: row[index]
    });
  }, {});
}

/**
 * Gets an array of Bus objects.
 *
 * @param  {array} labels     Column labels coming from the raw input.
 * @param  {array} vehicules  Actual items from the input.
 * @return {array}            Array of formatted bus objects.
 */
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

/**
 * Returns the updated bus array we've passed in.
 * This function adds relevant informations such as accessible and non accessible trips to the buses.

 * @param {array} buses   Array of buses.
 * @param {array} labels  Array of trip labels from raw input.
 * @param {array} trips   Array of raw trips.
 */
function addTripsToBuses(buses, [labels, trips]) {
  const formattedTrips = trips.map(trip => mapArrayValuesToObjectProps(labels, trip, ['routeId', 'wheelchairAccessible']));

  return buses.map(bus => {
    const filtered = formattedTrips
      .filter(trip => trip.routeId === bus.routeId)
      .reduce((accumulator, trip) => {
        const { wheelchairAccessible } = trip;
        const prop = accumulator[wheelchairAccessible];

        return Object.assign({}, accumulator, {
          [wheelchairAccessible]: prop ? prop + 1 : 1
        });
      }, {});


    return Object.assign({}, bus, filtered);
  });
}

/**
 * Generate a CLI table we're going to display.
 *
 * @param  {array} buses  Array of buses with their trips.
 * @return {Table}        A full table object, ready to be displayed.
 */
function generateTable(buses) {
  const table = new Table({
    head: ['Bus line', 'Bus line name', 'Total Trips', '% Front-door ramps', '% Rear-door ramps']
  });

  const rows = buses.map(bus => {
    const {
      routeShortName,
      routeLongName,
      [WHEELCHAIR_STATUS_ACCESSIBLE]: accessible = 0,
      [WHEELCHAIR_STATUS_NOT_ACCESSIBLE]: nonAccessible = 0
    } = bus;

    const totalTrips = accessible + nonAccessible;

    return [
      routeShortName,
      routeLongName,
      totalTrips,
      `${getPercentage(accessible, totalTrips)}% (${accessible})`,
      `${getPercentage(nonAccessible, totalTrips)}% (${nonAccessible})`
    ];
  });

  table.push(...rows);
  return table;
}

// Composes a new function out of format and readDataFile.
// It will read the file and returned a Promise that'd resolve in the formatted string.
const readAndFormat = compose(format, readDataFile);
const routesPromise = readAndFormat('routes');
const tripsPromise = readAndFormat('trips');
const cache = readDataFile('cache', 'json');

cache.then(
  (data) => JSON.parse(data),

  // In case we couldn't read from the cache.
  // Let's build it up again.
  async () => {
    const routes = await routesPromise;
    const trips = await tripsPromise;

    const buses = addTripsToBuses(getBuses(routes), trips);
    return writeToCache(buses);
  }
)
.then(buses => {
  const output = generateTable(buses);
  console.log(output.toString());

  // Really simple test to validate potential refactors.
  const busTest = buses.find(bus => bus.routeId === '747'); // ;)
  strictEqual(busTest[WHEELCHAIR_STATUS_ACCESSIBLE], 1163);
  strictEqual(busTest[WHEELCHAIR_STATUS_NOT_ACCESSIBLE], 704);
})
.catch(error => console.error(error));
