import axios, { AxiosResponse, AxiosError } from 'axios';
import * as turf from '@turf/turf';
import { Queue } from "./Queue";

type coord_t = [number, number]

interface GeoJSON {
    type: string;
    metadata: {
        attribution: string;
        service: string;
        timestamp: number;
        query: {
            coordinates: [number, number][];
            profile: string;
            format: string;
        };
        engine: {
            version: string;
            build_date: string;
            graph_date: string;
        };
    };
    features: Feature[];
    bbox: number[];
}

interface Feature {
    bbox: number[];
    type: string;
    properties: any; // Use the appropriate type here based on your data
    geometry: Geometry;
}

interface Geometry {
    coordinates: coord_t[];
    type: string;
}


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

export class Path {
 
    private geoData: GeoJSON;
    private static API_KEY: string | undefined;

    constructor()
    {
        this.geoData = this.initializeGeoData();
        Path.API_KEY = process.env.ORS_API_KEY;
    }

    private initializeGeoData(): GeoJSON {
        return {
            type: 'FeatureCollection',
            metadata: {
                attribution: 'Default Attribution',
                service: 'Default Service',
                timestamp: Date.now(),
                query: {
                    coordinates: [],
                    profile: 'Default Profile',
                    format: 'Default Format'
                },
                engine: {
                    version: 'Default Version',
                    build_date: 'Default Build Date',
                    graph_date: 'Default Graph Date'
                }
            },
            features: [],
            bbox: [0, 0, 0, 0]
        };
    }

    public async setPathInfo(startCoord: string, endCoord: string): Promise<void> {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${Path.API_KEY}&start=${startCoord}&end=${endCoord}`;

        axios.get(url, {
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
            }
        })
        .then((response: AxiosResponse<GeoJSON>) => {
            const coordinates = response.data.features[0].geometry.coordinates;
            this.geoData = response.data;
            
        })
        .catch((error: AxiosError) => {
            if (error.response) {
                console.error('Data:', error.response.data);
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error:', error.message);
            }
        });
    }

    public setPathInfoDiagnostic(startCoord: string, endCoord: string): Promise<void> {
        const url = `https://api.openrouteservice.org/v2/directions/driving-hgv?api_key=${Path.API_KEY}&start=${startCoord}&end=${endCoord}`;
    
        return axios.get(url, {
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
            }
        })
        .then((response: AxiosResponse<GeoJSON>) => {  
            console.log('Status:', response.status);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Body:', response.data);
    
            const coordinates = response.data.features[0].geometry.coordinates;
            console.log('Coordinates:', coordinates);
            this.geoData = response.data;
        })
        .catch((error: AxiosError) => {
            if (error.response) {
                console.error('Data:', error.response.data);
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error:', error.message);
            }
            throw error; // Re-throw the error so it can be caught by the caller
        });
    }

    public getGeoData(): coord_t[]
    {
        const coordinates = this.geoData.features[0].geometry.coordinates;
        return coordinates;
    }
}

async function loadAndDisplayPath(queue: Queue<Path>, startCoord: string, endCoord: string) {
    const rspObj = new Path();
    try {
        await rspObj.setPathInfoDiagnostic(startCoord, endCoord);
        console.log(rspObj.getGeoData());
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


export async function loadAndStorePath(queue: Queue<Path>, startCoord: string, endCoord: string) {
    const rspObj = new Path();
    try {
        await rspObj.setPathInfo(startCoord, endCoord);
        queue.enqueue(rspObj);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}





// loadAndDisplayPath()

// const rspObj = new Path();
// rspObj.setPathInfo("8.681495,49.41461", "8.687872,49.420318");
// rspObj.setPathInfoDiagnostic("8.681495,49.41461", "8.687872,49.420318");

// loadAndDisplayPath();

// const API_KEY: string | undefined = process.env.ORS_API_KEY;

// if (!API_KEY) {
//     console.error("API key not set in environment variables.");
//     process.exit(1);
// }

// const startCoords = "8.681495,49.41461";
// const endCoords = "8.687872,49.420318";
// const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${startCoords}&end=${endCoords}`;

// axios.get(url, {
//     headers: {
//         'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
//     }
// })
// .then((response: AxiosResponse<GeoJSON>) => {  // <-- Notice the generic type here
//     console.log('Status:', response.status);
//     console.log('Headers:', JSON.stringify(response.headers));
//     console.log('Body:', response.data);

//     // Accessing the coordinates of the first feature's geometry:
//     const coordinates = response.data.features[0].geometry.coordinates;
//     console.log('Coordinates:', coordinates);

// })
// .catch((error: AxiosError) => {
//     if (error.response) {
//         console.error('Data:', error.response.data);
//         console.error('Status:', error.response.status);
//         console.error('Headers:', error.response.headers);
//     } else if (error.request) {
//         console.error('No response received:', error.request);
//     } else {
//         console.error('Error:', error.message);
//     }
// });