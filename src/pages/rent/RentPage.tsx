import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { API_URL } from '@/constants/backend.constants'

dayjs.extend(duration)

interface IGear {
	id: number
	name: string
	price: number
	count: number
}

interface ICustomerGear {
	gear_id: number
	count: number
	gear?: IGear
}

type StatusType = 'Аренда' | 'Ожидание' | 'Закончилась'

interface ICustomer {
	id: number
	fullName: string
	phone: string
	rentalDateTime: string
	rentalPeriod: string
	customerGears?: ICustomerGear[]
	totalSum?: number
	status?: StatusType
	timeLeft?: string
}

export function RentPage() {
	const [customers, setCustomers] = useState<ICustomer[]>([])
	const [showModal, setShowModal] = useState(false)
	const [extendHours, setExtendHours] = useState('')
	const [extendSum, setExtendSum] = useState('')
	const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
		null
	)

	useEffect(() => {
		fetchCustomers()
		const interval = setInterval(() => updateTimeLeft(), 1000)
		return () => clearInterval(interval)
	}, [])

	const fetchCustomers = async () => {
		try {
			const { data } = await axios.get<ICustomer[]>(`${API_URL}/api/customer`)
			const mapped = mapCustomers(data)
			setCustomers(sortCustomers(mapped))
		} catch (err) {
			console.error(err)
		}
	}

	const mapCustomers = (data: ICustomer[]) => {
		return data.map(c => {
			const now = dayjs()
			const start = dayjs(c.rentalDateTime)
			const end = start.add(Number(c.rentalPeriod), 'hour')

			let status: StatusType
			if (now.isBefore(start)) status = 'Ожидание'
			else if (now.isBefore(end)) status = 'Аренда'
			else status = 'Закончилась'

			let totalSum = c.totalSum ?? 0
			if (!c.totalSum && c.customerGears) {
				totalSum = c.customerGears.reduce(
					(sum, g) => sum + (g.gear?.price ?? 0) * g.count,
					0
				)
			}

			let timeLeft = ''
			if (status === 'Аренда') {
				const diff = end.diff(now)
				const dur = dayjs.duration(diff)
				const parts = []
				if (dur.days()) parts.push(`${dur.days()} дн`)
				if (dur.hours()) parts.push(`${dur.hours()} ч`)
				if (dur.minutes()) parts.push(`${dur.minutes()} м`)
				if (!dur.days() && !dur.hours()) parts.push(`${dur.seconds()} с`)
				timeLeft = parts.join(' ')
			}

			return { ...c, status, totalSum, timeLeft }
		})
	}

	const updateTimeLeft = () => {
		setCustomers(prev => {
			const updated = mapCustomers(prev)
			return sortCustomers(updated)
		})
	}

	const sortCustomers = (arr: ICustomer[]) => {
		return [...arr].sort((a, b) => {
			const startA = dayjs(a.rentalDateTime)
			const endA = startA.add(Number(a.rentalPeriod), 'hour')
			const startB = dayjs(b.rentalDateTime)
			const endB = startB.add(Number(b.rentalPeriod), 'hour')

			const statusOrder = (status: StatusType) =>
				status === 'Аренда' ? 1 : status === 'Ожидание' ? 2 : 3

			const orderDiff = statusOrder(a.status!) - statusOrder(b.status!)
			if (orderDiff !== 0) return orderDiff

			if (a.status === 'Аренда' && b.status === 'Аренда') return endA.diff(endB)
			if (a.status === 'Ожидание' && b.status === 'Ожидание')
				return startA.diff(startB)
			if (a.status === 'Закончилась' && b.status === 'Закончилась')
				return endB.diff(endA)

			return 0
		})
	}

	const handleExtendClick = (customer: ICustomer) => {
		setSelectedCustomer(customer)
		setExtendHours('')
		setExtendSum('')
		setShowModal(true)
	}

	const handleExtendSave = async () => {
		if (!selectedCustomer) return
		const addHours = Number(extendHours)
		const addSum = Number(extendSum)
		if (!addHours || !addSum) return alert('Укажи корректные данные')

		try {
			const updatedPeriod = String(
				Number(selectedCustomer.rentalPeriod) + addHours
			)
			const updatedSum = (selectedCustomer.totalSum ?? 0) + addSum

			await axios.put(`${API_URL}/api/customer/${selectedCustomer.id}`, {
				rentalPeriod: updatedPeriod,
				totalSum: updatedSum
			})

			setCustomers(prev =>
				prev.map(c =>
					c.id === selectedCustomer.id
						? { ...c, rentalPeriod: updatedPeriod, totalSum: updatedSum }
						: c
				)
			)
			setShowModal(false)
		} catch (err) {
			console.error(err)
			alert('Ошибка при продлении аренды')
		}
	}

	return (
		<Layout>
			<div className='w-full max-w-6xl mx-auto mt-8 px-4'>
				<div className='overflow-x-auto'>
					<table className='min-w-full bg-[#1c1c1f] rounded-xl border border-[#2b2b2e] overflow-hidden'>
						<thead>
							<tr className='bg-[#25252a] text-white'>
								<th className='px-6 py-3 text-left'>ФИО</th>
								<th className='px-6 py-3 text-left'>Телефон</th>
								<th className='px-6 py-3 text-left'>Статус</th>
								<th className='px-6 py-3 text-left'>Сумма</th>
								<th className='px-6 py-3 text-left'>Истекает через</th>
								<th className='px-6 py-3 text-left'>Снаряжение</th>
								<th className='px-6 py-3 text-left'></th>
							</tr>
						</thead>
						<tbody>
							{customers.map(c => (
								<tr key={c.id} className='border-b border-[#2b2b2e]'>
									<td className='px-6 py-3'>{c.fullName}</td>
									<td className='px-6 py-3'>{c.phone}</td>
									<td className='px-6 py-3'>
										<span
											className={`px-2 py-1 rounded-md text-sm font-medium ${
												c.status === 'Аренда'
													? 'bg-orange-500 text-white'
													: c.status === 'Ожидание'
													? 'bg-gray-500 text-white'
													: 'bg-[#3a3a3a] text-white'
											}`}
										>
											{c.status}
										</span>
									</td>
									<td className='px-6 py-3'>{c.totalSum}₽</td>
									<td className='px-6 py-3 text-gray-300'>{c.timeLeft}</td>
									<td className='px-6 py-3'>
										{c.customerGears
											?.map(g => `${g.count} ${g.gear?.name ?? '–'}`)
											.join(', ')}
									</td>
									<td className='px-6 py-3'>
										{c.status === 'Аренда' && (
											<button
												onClick={() => handleExtendClick(c)}
												className='bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm'
											>
												Продлить
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showModal && (
				<div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
					<div className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-xl p-6 w-80 text-white flex flex-col gap-3 shadow-lg'>
						<h2 className='text-lg font-semibold mb-2'>
							Продлить аренду {selectedCustomer?.fullName}
						</h2>
						<input
							type='number'
							placeholder='На сколько часов'
							value={extendHours}
							onChange={e => setExtendHours(e.target.value)}
							className='bg-transparent border border-[#2b2b2e] rounded-md px-3 py-2 outline-none focus:border-orange-500'
						/>
						<input
							type='number'
							placeholder='Сумма продления ₽'
							value={extendSum}
							onChange={e => setExtendSum(e.target.value)}
							className='bg-transparent border border-[#2b2b2e] rounded-md px-3 py-2 outline-none focus:border-orange-500'
						/>
						<div className='flex justify-end gap-3 mt-2'>
							<button
								onClick={() => setShowModal(false)}
								className='px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-700 transition'
							>
								Отмена
							</button>
							<button
								onClick={handleExtendSave}
								className='px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 transition'
							>
								Сохранить
							</button>
						</div>
					</div>
				</div>
			)}
		</Layout>
	)
}
