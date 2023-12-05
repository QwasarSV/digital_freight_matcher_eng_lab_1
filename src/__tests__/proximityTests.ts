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
import { checkProximity} from "@db/helpers";

let db: DB;
describe('DB Tests', () => {
	beforeAll(async() => {
		db = DB.getInstance()

		let validLocationRequest: Request = {
			id: 1,
			client_id: 1,
			route_id: null,

		}
	})

	afterAll(async() => {
		await DB.closePool()
	})

	/*
	* 1	33.74724197037780	-84.39022107905390	FALSE	pckp
		1	33.5836978160938	-84.33537624692430	FALSE	drpf
		2	33.75933913424680	-84.38265073728390	FALSE	pckp
		2	33.904381133134700	-84.41317279196510	FALSE	drpf
		3	33.75292312092510	-84.39605437112310	TRUE	pckp
		3	33.89527259267490	-84.29011347842590	TRUE	drpf
		*
			interface Request {
			id: number
			client_id: number
			route_id: number // could be null
			origin_stop_id: number
			destination_stop_id: number
			cargo_cost: number
			contract_type: string
		}
	* */

	it('should validate a new location within 5 miles', async () => {

	})
})
