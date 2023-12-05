import DB from '../db/db'
import {
	Route,
	Stop,
	Request,
	Location,
	Package,
	Packagetype,
	Truck,
	Client,
	RouteStopsLinkedList,
	TurfLocation
} from '@db/types'
import { isWithinRouteDeviation } from "../services/routeService";
import * as turf from "@turf/turf";

export async function getLocationByStopId(stopId: number): Promise<Location> {
	const db = DB.getInstance();
	let res = await db.query('SELECT * FROM location l\n' +
		'  JOIN stop s ON s.location_id = l.id\n' +
		'where s.id = $1',
		[stopId]);
	return res.rows[0];
}

export async function getStopByLocationId(locationId: number): Promise<Stop> {
	const db = DB.getInstance();
	let res = await db.query('SELECT * FROM stop WHERE location_id = $1', [locationId]);
	return res.rows[0];
}

export async function getStopById(stopId: number): Promise<Stop> {
	const db = DB.getInstance();
	let res = await db.query('SELECT * FROM stop WHERE id = $1', [stopId]);
	return res.rows[0];
}

// returns an array with each stop on a route and turfLocation for the coordinates of the stop
export async function getStopsAndTurfLocationsForRoute(rtl: RouteStopsLinkedList):Promise<Array<{}>>  {
	let res: {}[] = [];
	const stops = rtl.stops;
	for (let stop of stops) {
		let stopLocation = await getStopByLocationId(stop[1]['location_id']);
		let turfLocation: TurfLocation = [stopLocation[1].longitude, stopLocation[1].latitude];
		res.push({ stopLocation, turfLocation });
	}
	return res;
}

export async function checkProximity(request: Request): Promise <Array<{}>> {
	const db = DB.getInstance();
	let routesAndStops = await db.fetchRoutesAndStops()
	let validRoutes: Array<any> = [];
	const pickup = await getLocationByStopId(request.origin_stop_id);
	const pickupTurfLocation: TurfLocation = [pickup.longitude, pickup.latitude];
	const dropOff = await getLocationByStopId(request.destination_stop_id);
	const dropOffTurfLocation: TurfLocation = [dropOff.longitude, dropOff.latitude];

	for (let route of routesAndStops) {
		let stopsAndTurfLocations = await getStopsAndTurfLocationsForRoute(route);
		let validStopsAfterPickup: Stop[] = []; //
		let validStopsAfterDropOff: Stop[] = [];
		for (let j = 1; j < stopsAndTurfLocations.length; j++) {
			let stopBefore = stopsAndTurfLocations[j-1]
			let currentStop = stopsAndTurfLocations[j]
			let validPickupLocation = isWithinRouteDeviation(pickupTurfLocation, stopBefore['turfLocation'], currentStop['turfLocation']);
			if (validPickupLocation) {
				validStopsAfterPickup.push(stopsAndTurfLocations[j]['stop']);
			}
			let validDropOffLocation = isWithinRouteDeviation(dropOffTurfLocation, stopBefore['turfLocation'], currentStop['turfLocation']);
			if (validDropOffLocation) {
				validStopsAfterDropOff.push(stopsAndTurfLocations[j]['stop']);
			}
		}
		validRoutes.push({ routeId: { locationsBP: validStopsAfterPickup, locationsBD: validStopsAfterDropOff } })
	}
	return validRoutes;
}
