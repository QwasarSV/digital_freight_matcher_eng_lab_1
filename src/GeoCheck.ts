import * as turf from '@turf/turf';

type coord_t = [number, number]


function isWithinDistance(distanceToPoint: number): boolean {
    const maxDistance = 1;
    if (distanceToPoint <= maxDistance ) {
        return true;
    } else {
        return false;
    }
}

export function GeoCheck(newcoord: coord_t, startCoord: coord_t, endCoord: coord_t): boolean  
{   
    const coordToCheck = turf.point(newcoord);
    const start = turf.point(startCoord);
    const end = turf.point(endCoord);
    const lineSegment = turf.lineString([start.geometry.coordinates, end.geometry.coordinates]);
    const nearestPointOnLine = turf.nearestPointOnLine(lineSegment, coordToCheck);
    const distanceToPoint = turf.distance(coordToCheck, nearestPointOnLine, { units: 'kilometers' }); 
    const result = isWithinDistance(distanceToPoint);
    return result;
}