import DB from '../db/db'
import process from 'process'
import {
	Route,
	Stop,
	Request,
	Location,
	Package,
	Packagetype,
	Truck,
	Client,
	Routes,
	StopNode,
	RouteLinkedList,
	TurfLocation
} from '@db/types'
import { getStopsAndTurfLocationsForRoute, getLocationById, checkProximity } from "@db/helpers";
import * as turf from "@turf/turf";

export function isWithinRouteDeviation(newLocation: TurfLocation, previousLocation: TurfLocation, nextLocation: TurfLocation): boolean {
	const location = turf.point(newLocation);
	const start = turf.point(previousLocation);
	const end = turf.point(nextLocation);
	const lineSegment = turf.lineString([start.geometry.coordinates, end.geometry.coordinates]);
	const nearestPointOnLine = turf.nearestPointOnLine(lineSegment, location);
	const distanceToPoint = turf.distance(location, nearestPointOnLine, { units: 'kilometers' });
	return distanceToPoint <= Number(process.env.LOCATION_DEVIATION);
}

const db = DB.getInstance();
async function getRoutes() { return await db.fetchRoutesAndStops() }
const routes = await getRoutes();


