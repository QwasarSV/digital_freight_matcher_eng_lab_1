// import { GeoCheck } from "./GeoCheck";
import { Queue } from "./Queue";
import { Path } from "./PathFinder"
import { loadAndStorePath } from "./PathFinder"
import * as turf from '@turf/turf';
import { FeatureCollection, Point,Feature, featureCollection, point } from '@turf/helpers';

type coord_t = [number, number]
interface Coord {
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties?: any;
  }

interface Route {
  id: number
  origin: string
  destination: string
  profitability: number
}


export class GeoRoute
{
    private interfaceRoute: Route | null;
    private queue : Queue<coord_t>;
    private pointsFeat:FeatureCollection<Point> | null;
    private SortedRoute : coord_t[];

    constructor() {
        this.queue = new Queue<coord_t>();
        this.SortedRoute = [];
        this.pointsFeat = null;
        this.interfaceRoute = null;
    }

    private isWithinDistance(distanceToPoint: number): boolean {
        const maxDistance = 1;
        if (distanceToPoint <= maxDistance ) {
            return true;
        } else {
            return false;
        }
    }
    
    private GeoCheck(newcoord: coord_t, startCoord: coord_t, endCoord: coord_t): boolean  
    {
        const coordToCheck = turf.point(newcoord);
        const start = turf.point(startCoord);
        const end = turf.point(endCoord);
        const lineSegment = turf.lineString([start.geometry.coordinates, end.geometry.coordinates]);
        const nearestPointOnLine = turf.nearestPointOnLine(lineSegment, coordToCheck);
        const distanceToPoint = turf.distance(coordToCheck, nearestPointOnLine, { units: 'kilometers' }); 
        const result = this.isWithinDistance(distanceToPoint);
        return result;
    }

    public addNewPoint(newCoord:coord_t,  startCoord: coord_t, endCoord: coord_t):boolean {
        console.log("is coordinate within bound ? ");
        if (this.GeoCheck(newCoord, startCoord , endCoord)) {
            console.log("TRUE");
            this.queue.enqueue(newCoord);
            return true;
        } else {
            console.log("FALSE");
            return false;
        }
    }

    public buildFeatureCollection() {
        let pointFeatures = [];
        while (!this.queue.isEmpty()) {
            let coord = this.queue.dequeue();
            if (coord) {
              let pointFeature = turf.point(coord);
              pointFeatures.push(pointFeature);
            }
        }
        this.pointsFeat = turf.featureCollection(pointFeatures);
    }

    public OrganiseRoute(startCoord: coord_t, endCoord: coord_t) {
        let lastCoord = turf.point(startCoord);
        var nearest: Feature <Point>;
        let newCoord: coord_t;

        if (this.pointsFeat == null)
        {
            return;
        }
        while (this.pointsFeat.features.length > 0) {
            nearest = turf.nearestPoint(lastCoord, this.pointsFeat);
            newCoord = nearest.geometry.coordinates as coord_t;
            this.SortedRoute.push(newCoord);
            this.pointsFeat.features = this.pointsFeat.features.filter(
                (feature) => feature.geometry.coordinates[0] !== newCoord[0] || feature.geometry.coordinates[1] !== newCoord[1]
            );
            lastCoord = turf.point(newCoord);
        }
        this.SortedRoute.push(endCoord);
    }

    public setInterfaceRoute(RouteProfile: Route) {
        this.interfaceRoute = RouteProfile;
    }

    public getInterfaceRoute() {
        return this.interfaceRoute;
    }

    public getQueue() {
        return this.queue;
    }

    public getFeatureCollection() {
        return this.pointsFeat;
    }

    public getSortedRoute() {
        return this.SortedRoute;
    }

}


// public GeoCheckRoute(path: Path | undefined, newCoord:coord_t): boolean {
//     if (path !== undefined) {
//         let route: coord_t[] = path.getGeoData();
//         let index: number = 1;
//         while (index < route.length) {
//             if (GeoCheck(newCoord, route[index -1], route[index])) {
//                 return true;
//             }
//             index += 1;
//         }
//     } else {
//         return false;
//     }
//     return false;
// }




// async function BuildRoute(queue: Queue<coord_t>, startCoord: coord_t, endCoord: coord_t) {
//     let newRoute: coord_t[];
//     let currRoute = new Path();
//     let last: coord_t = startCoord;
//     while (!queue.isEmpty()) {
//         await currRoute.setPathInfoDiagnostic("8.681495,49.41461", "8.687872,49.420318");
//         currRoute.getGeoData()
//     }
// }


// async function main() {
//     const queue = new Queue<Path>();

//     await loadAndStorePath(queue, "8.681495,49.41461", "8.687872,49.420318");
//     let path: Path | undefined = queue.dequeue();

//     if (path !== undefined) {
//         console.log(GeoCheckRoute(path, [8.681495,49.41461]));
//     } else
//     {
//         console.log("path is NULL");
//     }
// }|


// function main()
// {
//     const route = new GeoRoute();
//     route.addNewPoint([35.7544138157923, -84.3875298776527], [33.7544138157922, -84.3875298776525], [34.9161210050057, -84.3875298776525]);
//     route.addNewPoint([33.7544138157923, -84.3875298776527], [33.7544138157922, -84.3875298776525], [34.9161210050057, -84.3875298776525]);
//     route.addNewPoint([33.7544138157923, -84.3875298776525], [33.7544138157922, -84.3875298776525], [34.9161210050057, -84.3875298776525]);
//     route.addNewPoint([33.7544138157923, -84.3875298776526], [33.7544138157922, -84.3875298776525], [34.9161210050057, -84.3875298776525]);
//     console.log("Coordinate in queue waiting to be processed as turf point collection:");
//     console.log(route.getQueue());
//     console.log("Creating turf Feature collection:");
//     route.buildFeatureCollection();
//     console.log(route.getFeatureCollection());
//     route.OrganiseRoute([33.7544138157922, -84.3875298776525], [34.9161210050057, -84.3875298776525]);
//     console.log("Sorted array of coordinates:");
//     console.log(route.getSortedRoute());
// }


// main()
