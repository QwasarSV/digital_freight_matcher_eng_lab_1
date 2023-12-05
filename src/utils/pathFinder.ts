// import axios, { AxiosResponse, AxiosError } from 'axios';

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
    coordinates: [number, number][];
    type: string;
}




// const apiKey = process.env["ORS_API_KEY"];
//
// if (!apiKey) {
//     console.error('ORS_API_KEY is not defined in the .env file.');
//     process.exit(1); // Exit the application or handle the error as needed
// }
//
// if (!API_KEY) {
//     console.error("API key not set in environment variables.");
//     process.exit(1);
// }
//
// const startCoords = "8.681495,49.41461";
// const endCoords = "8.687872,49.420318";
//
// const url = `${baseUrl}?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;
//
// axios.get(url, {
//     headers: {
//         'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
//     }
// })
// .then((response: AxiosResponse<GeoJSON>) => {  // <-- Notice the generic type here
//     console.log('Status:', response.status);
//     console.log('Headers:', JSON.stringify(response.headers));
//     console.log('Body:', response.data);
//
//     // Accessing the coordinates of the first feature's geometry:
//     const coordinates = response.data.features[0].geometry.coordinates;
//     console.log('Coordinates:', coordinates);
//
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
