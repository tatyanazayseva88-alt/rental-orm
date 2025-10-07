import { Switch, Route } from 'wouter'
import { RentPage } from './pages/rent/RentPage'
import { WarehousePage } from './pages/warehouse/WarehousePage'
import { ArchivePage } from './pages/archive/ArchivePage'
import RequestPage from './pages/request/RequestPage'
import { EditingPage } from './pages/editing/EditingPage'

export function App() {
	return (
		<Switch>
			<Route path='/' component={RequestPage} />
			<Route path='/rent' component={RentPage} />
			<Route path='/warehouse' component={WarehousePage} />
			<Route path='/archive' component={ArchivePage} />
			<Route path='/editing' component={EditingPage} />
		</Switch>
	)
}
