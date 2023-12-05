import { Pool } from 'pg'
import dotenv from 'dotenv'
import process from 'process'
import {Routes, RouteStopsLinkedList, StopNode} from '@db/types';

dotenv.config()

class DB {
  private static instance: DB
  private readonly pool: Pool

  private constructor () {
    this.pool = new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DB,
      password: process.env.PG_PW,
      port: Number(process.env.PG_PORT)
    })
  }

  public static getInstance (): DB {
    if (DB.instance === undefined) {
      DB.instance = new DB()
    }
    return DB.instance
  }

  public static async closePool (): Promise<void> {
    await DB.instance.pool.end()
  }

  public async query (text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect()
    let ret: any;
    try {
      const [queryRes] = await Promise.all([client.query(text, params)])
      ret = queryRes;
      client.release()
      return ret;
    } catch (e) {
      console.error(e)
      throw e;
    }
  }

  // method to query for existing routes and stops
  public async fetchRoutesAndStops(): Promise<Routes> {
    let routes: Routes = [];
    const routeResults = await this.query('SELECT * FROM route');
    if (routeResults && routeResults.rows) {
      for (const route of routeResults.rows) {
        const stopsResult = await this.query('SELECT * FROM stop s WHERE route_id = $1 ORDER BY s.previous_stop_id NULLS FIRST', [route.id]);
        const stopsMap = new Map<number, StopNode>();
        for (const stop of stopsResult.rows) {
          stopsMap.set(stop.id, stop);
        }
        const newRoute: RouteStopsLinkedList = {
          id: route.id,
          stops: stopsMap
        }
        routes.push(newRoute);
      }
    }
    return routes;
  }

  public async createTables (): Promise<Error | true> {
    try {
      const getTablesQuery = `
        SELECT * FROM pg_catalog.pg_tables WHERE schemaname = 'public';
      `
      let tables = await this.query(getTablesQuery);

      // if new database, instantiate with the requisite tables
      if (!tables.rowCount) {
        const tableQueries = `
            CREATE TABLE IF NOT EXISTS truck (
                id SERIAL PRIMARY KEY,
                max_weight INT,
                max_volume INT,
                cpm NUMERIC,
                avg_spd INT,
                type VARCHAR(255),
                autonomy VARCHAR(255)
            );
            CREATE TABLE IF NOT EXISTS route (
                id SERIAL PRIMARY KEY,
                truck_id INT,
                max_time INT,
                profitability NUMERIC
            );
            CREATE TABLE IF NOT EXISTS location (
                id SERIAL PRIMARY KEY,
                latitude NUMERIC,
                longitude NUMERIC,
                is_hq BOOLEAN DEFAULT FALSE
            );
            CREATE TABLE IF NOT EXISTS stop (
                id SERIAL PRIMARY KEY,
                location_id INT,
                drop_time INT,
                previous_stop_id INT DEFAULT NULL,
                route_id INT DEFAULT NULL
            );
            CREATE TABLE IF NOT EXISTS client (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255),
                company_client_id INT
            );
            CREATE TABLE IF NOT EXISTS request (
                id SERIAL PRIMARY KEY,
                client_id INT,
                route_id INT DEFAULT NULL,
                origin_stop_id INT,
                destination_stop_id INT,
                pallet_count INT DEFAULT 0,
                package_count INT,
                cargo_cost NUMERIC,
                cargo_weight NUMERIC,
                cargo_volume NUMERIC,
                contract_type VARCHAR(255)
            );
            CREATE TABLE IF NOT EXISTS packagetype (
                id SERIAL PRIMARY KEY,
                volume NUMERIC,
                weight NUMERIC,
                name VARCHAR(255) DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS package (
                id SERIAL PRIMARY KEY,
                request_id INT,
                packagetype_id INT
            );
        `;
        await this.query(tableQueries);

        // now add foreign key constraints
        const foreignKeyQueries = `
              ALTER TABLE route ADD CONSTRAINT fk_route_truck
                  FOREIGN KEY (truck_id) REFERENCES truck(id);
              ALTER TABLE stop ADD CONSTRAINT fk_stop_location
                  FOREIGN KEY (location_id) REFERENCES location(id);
              ALTER TABLE stop ADD CONSTRAINT fk_stop_previous_stop
                  FOREIGN KEY (previous_stop_id) REFERENCES stop(id);
              ALTER TABLE stop ADD CONSTRAINT fk_stop_route
                  FOREIGN KEY (route_id) REFERENCES route(id);
              ALTER TABLE request ADD CONSTRAINT fk_request_client
                  FOREIGN KEY (client_id) REFERENCES client(id);
              ALTER TABLE request ADD CONSTRAINT fk_request_route
                  FOREIGN KEY (route_id) REFERENCES route(id);
              ALTER TABLE request ADD CONSTRAINT fk_request_origin_stop
                  FOREIGN KEY (origin_stop_id) REFERENCES stop(id);
              ALTER TABLE request ADD CONSTRAINT fk_request_destination_stop
                  FOREIGN KEY (destination_stop_id) REFERENCES stop(id);
              ALTER TABLE package ADD CONSTRAINT fk_package_request
                  FOREIGN KEY (request_id) REFERENCES request(id);
              ALTER TABLE package ADD CONSTRAINT fk_package_packagetype
                  FOREIGN KEY (packagetype_id) REFERENCES packagetype(id);
          `;
        await this.query(foreignKeyQueries);

      } else {
        console.log('DB public schema already contains tables')
      }
    } catch (e: any) {
      console.log(`Error creating tables and keys: ${e}`);
      return e;
    }
    return true
  }

  // seed the 5 purchased trucks, if they don't already exist
  public async seedTrucks(): Promise<any> {
    let purchasedTrucks = 5;
    // Truck Constants: max_weight, max_volume, cost_per_mile, average_speed, type, autonomy
    const constants: (number|string|undefined)[] = [process.env.MAX_TRK_WT, process.env.MAX_TRK_VOL, process.env.CPM, process.env.AVG_SPEED, process.env.TRK_TYPE, 'driver']
    try {
      for (let i = 0; i < purchasedTrucks; i++) {
        const exists = await this.checkTruckExists(i + 1)
        if (!exists) {
          await this.query('INSERT INTO truck (max_weight, max_volume, cpm, avg_spd, type, autonomy) VALUES ($1, $2, $3, $4, $5, $6)', constants)
        }
      }
    } catch (e) {
      return e;
    }
    return 'Existing Trucks are seeded in DB.'
  }

  // seed with locations for pre-existing routes if they don't already exist
  public async seedLocations(): Promise<any> {
    const locations = [
      [33.75441382, -84.38752988], // Pickup location
      [34.91612101, -85.11039247], // Remainder are destination locations
      [33.46767162, -81.89207679],
      [32.08152969, -80.97733964],
      [31.57704107, -84.18076688],
      [32.46617101, -85.15879278]
    ];

    for (const loc of locations) {
      const exists = await this.checkLocationExists(loc[0], loc[1]);
      try {
        if (!exists) {
          await this.query('INSERT INTO location (latitude, longitude) VALUES ($1, $2)', loc);
          // set default for location 1 to be HQ
          await this.query('UPDATE location SET is_hq = true WHERE id = 1');
        }
      } catch (e) {
        return e;
      }
    }
    return ('Incurred-Contract Locations are seeded in DB.');
  }

  // seed the 5 initial routes if they don't exist
  public async seedRoutes(): Promise<any> {
    // we have 5 pre-existing routes
    const existingRoutes = 5;
    // profitability is the margins on the existing routes
    const margins = [-0.3224, -0.4353, -0.3788, -0.3224, -0.4918]
    try {
      for (let i = 0; i < existingRoutes; i++) {
        const exists = await this.checkRouteExists(i + 1);
        if (!exists) {
          // to start we are matching truck_id and route_id, with 5 existing trucks for 5 existing routes
          await this.query('INSERT INTO route (truck_id, max_time, profitability) VALUES ($1, $2, $3)',
            [i + 1, process.env.MAX_DAILY_TIME, margins[i]])
        }
      }
    } catch (e) {
      return e;
    }
    return 'Existing Routes are seeded in DB.'
  }
  /*
    - seed the stops from Too-Big-To-Fail contract (including the origin pickup, 5 drops, then return to hq).
    - pre-existing requests/routes will have matching id, 1-5.
    - location_id for the destination stop will be 2-6, accounting for the HQ location id of 1.
  */
  public async seedStops(): Promise<any> {
    const existingStops = [
      { locationId: 1, dropTime: 0, previousStopId: null, routeId: 1 },
      { locationId: 2, dropTime: process.env.DELIVERY_TIME, previousStopId: 1, routeId: 1 },
      { locationId: 1, dropTime: 0, previousStopId: null, routeId: 2 },
      { locationId: 3, dropTime: process.env.DELIVERY_TIME, previousStopId: 3, routeId: 2 },
      { locationId: 1, dropTime: 0, previousStopId: null, routeId: 3 },
      { locationId: 4, dropTime: process.env.DELIVERY_TIME, previousStopId: 5, routeId: 3 },
      { locationId: 1, dropTime: 0, previousStopId: null, routeId: 4 },
      { locationId: 5, dropTime: process.env.DELIVERY_TIME, previousStopId: 7, routeId: 4 },
      { locationId: 1, dropTime: 0, previousStopId: null, routeId: 5 },
      { locationId: 6, dropTime: process.env.DELIVERY_TIME, previousStopId: 9, routeId: 5 },
      // seed the return stops at hq for each route
      { locationId: 1, dropTime: 0, previousStopId: 2, routeId: 1 },
      { locationId: 1, dropTime: 0, previousStopId: 4, routeId: 2 },
      { locationId: 1, dropTime: 0, previousStopId: 6, routeId: 3 },
      { locationId: 1, dropTime: 0, previousStopId: 8, routeId: 4 },
      { locationId: 1, dropTime: 0, previousStopId: 10, routeId: 5 }
    ]
    try {
      for (let i = 0; i < existingStops.length; i++) {
        const exists = await this.checkStopExists(i + 1);
        if (!exists) {
          await this.query('INSERT INTO stop ' +
            '(location_id, drop_time, previous_stop_id, route_id) ' +
            'VALUES ($1, $2, $3, $4)', [
              existingStops[i]['locationId'],
              existingStops[i]['dropTime'],
              existingStops[i]['previousStopId'],
              existingStops[i]['routeId']
            ]
          )
        }
      }
    } catch (e) {
      return e;
    }
    return 'Existing Stops are seeded in DB.'
  }

  // seed the 5 existing requests (which mirror the existing routes as there are no added stops on the routes)
  public async seedRequests(): Promise<any> {
    const existingRequests = [
      { clientId: 1, routeId: 1, originStopId: 1, destinationStopId: 2, cargoCost: 165.8059873, contractType: 'Incurred Contract 1', pallet_count: 20, package_count: 0, cargoWeight: 8800, cargoVolume: 1280 },
      { clientId: 1, routeId: 2, originStopId: 3, destinationStopId: 4, cargoCost: 129.4162244, contractType: 'Incurred Contract 1',  pallet_count: 21, package_count: 0, cargoWeight: 9240, cargoVolume: 1344 },
      { clientId: 1, routeId: 3, originStopId: 5, destinationStopId: 6, cargoCost: 373.2002751, contractType: 'Incurred Contract 1', pallet_count: 22, package_count: 0,  cargoWeight: 9680, cargoVolume: 1408 },
      { clientId: 1, routeId: 4, originStopId: 7, destinationStopId: 8, cargoCost: 298.77911, contractType: 'Incurred Contract 1', pallet_count: 17, package_count: 0, cargoWeight: 7480, cargoVolume: 1088 },
      { clientId: 1, routeId: 5, originStopId: 9, destinationStopId: 10, cargoCost: 131.741886, contractType: 'Incurred Contract 1', pallet_count: 18, package_count: 0, cargoWeight: 7920, cargoVolume: 1152 }
    ]
    try {
      for (let i = 0; i < existingRequests.length; i++) {
        const exists = await this.checkRequestExists(i + 1);
        if (!exists) {
          await this.query('INSERT INTO request' +
            '(client_id, route_id, origin_stop_id, destination_stop_id, cargo_cost, contract_type) ' +
            'VALUES ($1, $2, $3, $4, $5, $6)', [
              existingRequests[i]['clientId'],
              existingRequests[i]['routeId'],
              existingRequests[i]['originStopId'],
              existingRequests[i]['destinationStopId'],
              existingRequests[i]['cargoCost'],
              existingRequests[i]['contractType']
            ]
          )
        }
      }
    } catch (e) {
      return e;
    }
    return 'Existing Requests are seeded in DB.'
  }

  // currently only client is Too-Big-To-Fail company...
  // randomly assigning a companyClientId of 1001, for external Business Management software e.g. Hubspot, etc
  public async seedClient(): Promise<any> {
    try {
      const exists = await this.checkClientExists(1001)
      if (!exists) {
        await this.query('INSERT INTO client (company_name, company_client_id) VALUES ($1, $2)', ['Too-Big-To-Fail', 1001])
      }
    } catch (e) {
      return e;
    }
    return 'Too-Big-To-Fail company is seeded in DB.'
  }

  private async checkLocationExists(latitude: number, longitude: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM location WHERE latitude = $1 AND longitude = $2', [latitude, longitude]);
    return result.rowCount > 0;
  }

  private async checkTruckExists(truckId: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM truck WHERE id = $1', [truckId]);
    return result.rowCount > 0;
  }

  private async checkRouteExists(routeId: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM route WHERE id = $1', [routeId]);
    return result.rowCount > 0;
  }

  private async checkRequestExists(requestId: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM request WHERE id = $1', [requestId]);
    return result.rowCount > 0;
  }

  private async checkStopExists(stopId: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM stop WHERE id = $1', [stopId]);
    return result.rowCount > 0;
  }

  private async checkClientExists(companyClientId: number): Promise<boolean> {
    const result = await this.query('SELECT * FROM client WHERE company_client_id = $1', [companyClientId]);
    return result.rowCount > 0;
  }

  private async addLocationsFromRequest (
    pickup: number[], dropOff: number[],
  ): Promise<Array<any>|Boolean> {
    try {
      const origin = await this.query('INSERT INTO location (latitude, longitude) VALUES($1, $2) RETURNING *', [pickup[0], pickup[1]]);
      const originLocation = origin.rows[0];
      const destination = await this.query('INSERT INTO location (latitude, longitude) VALUES($1, $2) RETURNING *', [dropOff[0], dropOff[1]]);
      const destinationLocation = destination.rows[0];
      return [originLocation, destinationLocation];
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private async addStopsFromRequestLocations(locations: number[]): Promise<Array<any>|Boolean> {
    try {
      const origin = await this.query('INSERT INTO stop (latitude, longitude) VALUES($1, $2) RETURNING *', [pickup[0], pickup[1]]);
      const originLocation = origin.rows[0];
      const destination = await this.query('INSERT INTO location (latitude, longitude) VALUES($1, $2) RETURNING *', [dropOff[0], dropOff[1]]);
      const destinationLocation = destination.rows[0];
      return [originLocation, destinationLocation];
    } catch(e) {
      console.error(e);
      return false;
    }
  }
}

export default DB
