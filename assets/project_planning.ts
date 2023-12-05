// Data Models
interface Location {
    lat: number;
    lng: number;
    marked?: boolean; // Is the location already assigned to a route.
}

interface Package {
    volume: number;
    weight: number;
    type: string;
}

interface Cargo {
    packages: Package[];
}

interface Truck {
    autonomy: number;
    capacity: number;
    type: string;
    cargos: Cargo[];
}

interface Route {
    locationOrigin: Location;
    locationDestination: Location;
    orders: Order[];
    profitability: number;
    path: Location[];
}

interface Order {
    locationOrigin: Location;
    locationDestination: Location;
    client: Client;
    cargo: Cargo;
    contractType: string;
}

interface Client {
    locations: Location[];
}


// Core Functions

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * https://en.wikipedia.org/wiki/Haversine_formula
 * @param loc1 First location
 * @param loc2 Second location
 * @returns Distance in kilometers
 */
function calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Radius of the Earth in kilometers
    // Differences in latitude and longitude between the two points, converted from degrees to radians.
    // https://www.mathsisfun.com/geometry/radians.html
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    // https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/math/atan2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Returns distance in kilometers
}

/**
 * Checks if a location is within 1 km of any point on a route.
 * @param location The location to check
 * @param route The route to check against
 * @returns True if the location is within 1 km of the route, otherwise false
 * Research: Haversine formula: https://en.wikipedia.org/wiki/Haversine_formula
 */
function isLocationOnRoute(location: Location, route: Route): boolean {
    // Check against the origin and destination of the route
    if (calculateDistance(location, route.locationOrigin) <= 1 || calculateDistance(location, route.locationDestination) <= 1) {
        return true;
    }

    // Check against each intermediate point on the route
    for (let point of route.path) {
        if (calculateDistance(location, point) <= 1) {
            return true;
        }
    }

    return false;
}

/**
 * Determines if cargo can fit in the truck's compartment.
 * @param truck
 * @param cargo
 * @returns
 */
function canCargoFit(truck: Truck, cargo: Cargo): boolean {
    // TODO: Implement this function.
    return false;
}

/**
 * Calculates deviation time in minutes.
 * @param distance in km.
 * @returns
 */
function deviationTime(distance: number): number {
    return distance * 15; // Assuming 15 minutes for every km.
}

/**
 * Checks if creating a new route is profitable.
 * @param route
 * @returns
 */
function isRouteProfitable(route: Route): boolean {
    // TODO: Implement this function.
    return false;
}

/**
 * Checks if two types of cargo can be transported together.
 * @param type1
 * @param type2
 * @returns
 */
function canCargoTypesBeCombined(type1: string, type2: string): boolean {
    // TODO: Implement this function.
    return false;
}

/**
 * Calculates the total work time for a route in hours.
 * @param route
 * @returns
 */
function calculateWorkTime(route: Route): number {
    // TODO: Implement this function.
    return 0;
}

/*

* Request (input): pickup, drop-off, # of packages
* 	-> input total # of packages into the DB with request ID
*
* // Program Logic
*
* checkRequest(request) {
*			let validRoutes = []
*
* 		// returns the weight upon stop ARRIVAL (before drop or pickup)
* 		getWeightAtStops(routeId) {
* 			let stopWeights = []
* 			get all stops for the route;
* 			totalWeight = 0
* 			for each stop
* 				getRequest
* 				checkPackages
* 				calculate weight change at stop ->
* 				weightChange += totalWeight
* 				stopWeight = { stopId: weight }
* 				push to stopWeights
*
* 			return stopWeights
* 		}
*
* 	 	getVolumeAtStops(routeId) {
* 			let volumeChange = []
* 			// Logic:
* 			// get all stops for the route; for each stop, getRequest, checkPackages ->
* 			// calculate volume change at stop -> volumeChange = { stopId: volumeChange }
* 			// push volume change
*
* 			return volumeChanges
* 		}
*
* 		checkProximity(request, routes, validRoutes)	{
* 			// routes will be an array of all routes where distance is within 1 km, could be empty
*				// for each valid route, push an object into validRoutes: { routeId: [ previousStopId, nextStopId ] }
*
* 			return validRoutes
* 		}
*
* 		checkWeight(request, validRoutes) {
* 			for each validRoute
* 				weightChanges = checkWeightChangesAtStops(route)
* 				use route truckId to get the maxWeight
* 				weight = getRequestWeight(request)
*
*
* 			return validRoutes
* 		}
*
* 		checkVolume(request) ...
*
* 		checkTime(request) ...
*
* 		checkProfitability(request, validRoutes) {
*				forEach route
* 				previousExpense = cost-per-mile * routeLength
* 				totalExpense = previousExpense + (calculated expense for adding new location)
* 				if totalExpense is negative, remove route from validRoutes
*
* 			return validRoutes
* 		}
* }
*
* */




