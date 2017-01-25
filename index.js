// node >= 7.0.0
// TODO re-write using function composition?
// const compose = (a, b) => (...args) => a(b(...args));
// or HOF

const fs = require('fs');
const path = require('path');

// @link http://www.stm.info/en/about/developers/available-data-description
const SERVICE_TYPE_BUS = '3';
const ROUTE_TYPE_LABEL = 'route_type';
const ROUTE_ID_LABEL = 'route_id';
const WHEELCHAIR_ACCESSIBLE_LABEL = 'wheelchair_accessible';

// @link https://developers.google.com/transit/gtfs/reference/trips-file
const WHEELCHAIR_STATUS_UNKNOWN = '0';
const WHEELCHAIR_STATUS_ACCESSIBLE = '1'
const WHEELCHAIR_STATUS_NOT_ACCESSIBLE = '2';

function format(string) {
  const [head, ...rows] = string.split('\n');
  const formattedRows = rows.map(row => row.split(','));

  return [head.split(','), formattedRows];
}

function mapArrayValuesToObjectProps(labels, row) {
  return labels.reduce((acc, current, index) => {
    const prop = current.replace(/_+(.)/g, (match, character) => character.toUpperCase());

    return Object.assign({}, acc, {
      [prop]: row[index]
    })
  }, {});
}

function getBuses([labels, rows]) {
  const typeIndex = labels.indexOf(ROUTE_TYPE_LABEL);

  return rows
    .filter(row => row[typeIndex] === SERVICE_TYPE_BUS)
    .reduce((buses, bus) => {
      const { routeId, routeShortName, routeLongName } = mapArrayValuesToObjectProps(labels, bus);

      return Object.assign({}, buses, {
        [routeId]: { routeShortName, routeLongName }
      });
    }, {});
}

function addTripsToBuses(buses, [labels, trips]) {
  const routeIdIndex = labels.indexOf(ROUTE_ID_LABEL);
  const busIds = Object.keys(buses);

  return trips
    .filter(trip => busIds.includes(trip[routeIdIndex]))
    .reduce((accumulator, trip) => {
      const { routeId, wheelchairAccessible, tripId } = mapArrayValuesToObjectProps(labels, trip);
      const originalBus = accumulator[routeId];
      const prop = originalBus[wheelchairAccessible];

      const bus = Object.assign({}, originalBus, {
        [wheelchairAccessible]: !!prop ? prop + 1 : 1
      });

      return Object.assign({}, accumulator, {
        [routeId]: bus
      });
    }, buses);
}

console.time('time');
const routes = format(fs.readFileSync(path.join(__dirname, 'data', 'routes.txt'), 'utf8'));
const trips = format(fs.readFileSync(path.join(__dirname, 'data', 'trips.txt'), 'utf8'));

const buses = getBuses(routes);
console.log(addTripsToBuses(buses, trips));
console.timeEnd('time');
