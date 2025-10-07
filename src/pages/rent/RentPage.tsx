import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { API_URL } from '@/constants/backend.constants'
import { X, Check } from 'lucide-react'

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
	description?: string
	rentalStart: string | null
	rentalEnd: string | null
	customerGears?: ICustomerGear[]
	totalSum?: number
	status?: StatusType
	timeLeft?: string
	completed?: boolean
}

const getCustomerTimeData = (c: ICustomer) => {
	if (!c.rentalStart || !c.rentalEnd)
		return { status: 'Ожидание' as StatusType, timeLeft: '' }

	const now = dayjs()
	const start = dayjs(c.rentalStart)
	const end = dayjs(c.rentalEnd)

	let status: StatusType
	let timeLeft = ''

	if (now.isBefore(start)) {
		status = 'Ожидание'
		const diff = start.diff(now)
		const dur = dayjs.duration(diff)
		const parts: string[] = []
		if (dur.days()) parts.push(`${dur.days()} дн`)
		if (dur.hours()) parts.push(`${dur.hours()} ч`)
		if (dur.minutes()) parts.push(`${dur.minutes()} м`)
		if (!dur.days() && !dur.hours() && !dur.minutes())
			parts.push(`${dur.seconds()} с`)
		timeLeft = parts.join(' ')
	} else if (now.isBefore(end)) {
		status = 'Аренда'
		const diff = end.diff(now)
		const dur = dayjs.duration(diff)
		const parts: string[] = []
		if (dur.days()) parts.push(`${dur.days()} дн`)
		if (dur.hours()) parts.push(`${dur.hours()} ч`)
		if (dur.minutes()) parts.push(`${dur.minutes()} м`)
		if (!dur.days() && !dur.hours() && !dur.minutes())
			parts.push(`${dur.seconds()} с`)
		timeLeft = parts.join(' ')
	} else {
		status = 'Закончилась'
		timeLeft = c.completed ? '' : '1 с'
	}

	return { status, timeLeft }
}

export function RentPage() {
	const [customers, setCustomers] = useState<ICustomer[]>([])
	const [showExtendModal, setShowExtendModal] = useState(false)
	const [showAddTimeModal, setShowAddTimeModal] = useState(false)
	const [extendHours, setExtendHours] = useState('')
	const [extendSum, setExtendSum] = useState('')
	const [addHours, setAddHours] = useState('')
	const [addSum, setAddSum] = useState('')
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
			setCustomers(sortCustomers(mapCustomers(data)))
		} catch (err) {
			console.error(err)
		}
	}

	const mapCustomers = (data: ICustomer[]) =>
		data.map(c => {
			const { status, timeLeft } = getCustomerTimeData(c)
			let totalSum = c.totalSum ?? 0
			if (!c.totalSum && c.customerGears) {
				totalSum = c.customerGears.reduce(
					(sum, g) => sum + (g.gear?.price ?? 0) * g.count,
					0
				)
			}
			return { ...c, status, totalSum, timeLeft }
		})

	const updateTimeLeft = () => {
		setCustomers(prev =>
			sortCustomers(
				prev.map(c => {
					const { status, timeLeft } = getCustomerTimeData(c)
					return { ...c, status, timeLeft }
				})
			)
		)
	}

	const sortCustomers = (arr: ICustomer[]) => {
		return [...arr].sort((a, b) => {
			const order = (c: ICustomer) => {
				if (c.status === 'Закончилась' && !c.completed) return 0
				if (c.status === 'Аренда') return 1
				if (c.status === 'Ожидание') return 2
				if (c.status === 'Закончилась' && c.completed) return 3
				return 4
			}
			return order(a) - order(b)
		})
	}

	const handleExtendClick = (customer: ICustomer) => {
		setSelectedCustomer(customer)
		setExtendHours('')
		setExtendSum('')
		setShowExtendModal(true)
	}

	const handleAddTimeClick = (customer: ICustomer) => {
		setSelectedCustomer(customer)
		setAddHours('')
		setAddSum('')
		setShowAddTimeModal(true)
	}

	const handleExtendSave = async () => {
		if (!selectedCustomer) return
		const addHours = Number(extendHours)
		const addSum = Number(extendSum)
		if (!addHours || !addSum) return alert('Укажи корректные данные')

		try {
			const updatedEnd = dayjs(selectedCustomer.rentalEnd)
				.add(addHours, 'hour')
				.toISOString()
			const updatedSum = (selectedCustomer.totalSum ?? 0) + addSum

			await axios.put(`${API_URL}/api/customer/${selectedCustomer.id}`, {
				rentalEnd: updatedEnd,
				totalSum: updatedSum
			})

			setCustomers(prev =>
				prev.map(c =>
					c.id === selectedCustomer.id
						? { ...c, rentalEnd: updatedEnd, totalSum: updatedSum }
						: c
				)
			)
			setShowExtendModal(false)
		} catch (err) {
			console.error(err)
			alert('Ошибка при продлении аренды')
		}
	}

	const handleAddTimeSave = async () => {
		if (!selectedCustomer) return
		const addH = Number(addHours)
		const addS = Number(addSum)
		if (!addH || !addS) return alert('Укажи корректные данные')

		try {
			const updatedEnd = dayjs(selectedCustomer.rentalEnd)
				.add(addH, 'hour')
				.toISOString()
			const updatedSum = (selectedCustomer.totalSum ?? 0) + addS

			await axios.put(`${API_URL}/api/customer/${selectedCustomer.id}`, {
				rentalEnd: updatedEnd,
				totalSum: updatedSum
			})

			setCustomers(prev =>
				prev.map(c =>
					c.id === selectedCustomer.id
						? { ...c, rentalEnd: updatedEnd, totalSum: updatedSum }
						: c
				)
			)
			setShowAddTimeModal(false)
		} catch (err) {
			console.error(err)
			alert('Ошибка при добавлении времени')
		}
	}

	const handleConfirm = async (id: number) => {
		try {
			await axios.put(`${API_URL}/api/customer/${id}/confirm`)
			setCustomers(prev =>
				prev.map(c =>
					c.id === id
						? { ...c, completed: true, timeLeft: '', status: 'Закончилась' }
						: c
				)
			)
		} catch (err) {
			console.error(err)
			alert('Ошибка подтверждения')
		}
	}

	const handleCloseEarly = async (id: number) => {
		try {
			const now = dayjs().toISOString()
			await axios.put(`${API_URL}/api/customer/${id}/close-early`)
			setCustomers(prev =>
				sortCustomers(
					prev.map(c =>
						c.id === id
							? { ...c, rentalEnd: now, status: 'Закончилась', timeLeft: '1 с' }
							: c
					)
				)
			)
		} catch (err) {
			console.error(err)
			alert('Ошибка закрытия аренды')
		}
	}

	return (
		<Layout>
			<div className='w-full max-w-6xl mx-auto mt-8 px-4'>
				<div className='overflow-x-auto'>
					<table className='min-w-full bg-[#1c1c1f] rounded-t-xl border border-[#2b2b2e] overflow-hidden'>
						<thead>
							<tr className='bg-[#25252a] text-white'>
								<th className='px-6 py-3 text-left'>ФИО</th>
								<th className='px-6 py-3 text-left'>Телефон</th>
								<th className='px-6 py-3 text-left'>Статус</th>
								<th className='px-6 py-3 text-left'>Сумма</th>
								<th className='px-6 py-3 text-left'>
									Истекает / Начинается через
								</th>
								<th className='px-6 py-3 text-left'>Снаряжение</th>
							</tr>
						</thead>
						<tbody>
							{customers.map(c => (
								<tr
									key={c.id}
									className='border-b border-[#2b2b2e] cursor-pointer hover:bg-[#2a2a2e]'
									onClick={() => setSelectedCustomer(c)}
								>
									<td className='px-6 py-3'>{c.fullName}</td>
									<td className='px-6 py-3'>{c.phone}</td>
									<td className='px-6 py-3'>
										<span
											className={`px-2 py-1 rounded-md text-sm font-medium ${
												c.status === 'Аренда'
													? 'bg-orange-500 text-white'
													: c.status === 'Ожидание'
													? 'bg-gray-500 text-white'
													: c.status === 'Закончилась' && !c.completed
													? 'bg-green-600 text-white'
													: 'bg-[#3a3a3a] text-white'
											}`}
										>
											{c.status === 'Закончилась' && c.completed
												? 'Завершена'
												: c.status}
										</span>
									</td>
									<td className='px-6 py-3'>{c.totalSum}₽</td>
									<td className='px-6 py-3 text-gray-300'>{c.timeLeft}</td>
									<td className='px-6 py-3'>
										{c.customerGears
											?.map(g => `${g.count} ${g.gear?.name ?? '–'}`)
											.join(', ')}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{selectedCustomer && (
				<div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto'>
					<div className='bg-[#1c1c1f] text-white w-full max-w-3xl rounded-xl p-6 shadow-lg relative flex flex-col gap-3'>
						<X
							className='absolute top-4 right-4 cursor-pointer hover:text-gray-300'
							size={24}
							onClick={() => setSelectedCustomer(null)}
						/>
						<h2 className='text-2xl font-bold'>{selectedCustomer.fullName}</h2>
						<div className='flex flex-col gap-2'>
							<p>
								<span className='font-semibold'>Телефон:</span>{' '}
								{selectedCustomer.phone}
							</p>
							<p>
								<span className='font-semibold'>Статус:</span>{' '}
								{selectedCustomer.status}
							</p>
							<p>
								<span className='font-semibold'>Сумма:</span>{' '}
								{selectedCustomer.totalSum}₽
							</p>
							<p>
								<span className='font-semibold'>Время:</span>{' '}
								{selectedCustomer.timeLeft || '–'}
							</p>
							<p>
								<span className='font-semibold'>Снаряжение:</span>{' '}
								{selectedCustomer.customerGears
									?.map(g => `${g.count} ${g.gear?.name ?? '–'}`)
									.join(', ') || '–'}
							</p>
							{selectedCustomer.description && (
								<p>
									<span className='font-semibold'>Описание:</span>{' '}
									{selectedCustomer.description}
								</p>
							)}
						</div>

						<div className='flex gap-3 mt-4 flex-wrap'>
							{selectedCustomer.status === 'Аренда' && (
								<>
									<button
										onClick={() => handleExtendClick(selectedCustomer)}
										className='px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-md text-sm'
									>
										Продлить аренду
									</button>
									<button
										onClick={() => handleAddTimeClick(selectedCustomer)}
										className='px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm'
									>
										Добавить время за сумму
									</button>
									<button
										onClick={() => handleCloseEarly(selectedCustomer.id)}
										className='px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-md text-sm'
									>
										Преждевременно завершить
									</button>
								</>
							)}
							{selectedCustomer.status === 'Закончилась' &&
								!selectedCustomer.completed && (
									<button
										onClick={() => handleConfirm(selectedCustomer.id)}
										className='px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm flex items-center gap-1'
									>
										<Check size={16} /> Завершить аренду
									</button>
								)}
						</div>
					</div>
				</div>
			)}

			{showExtendModal && selectedCustomer && (
				<div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
					<div className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-xl p-6 w-80 text-white flex flex-col gap-3 shadow-lg'>
						<h2 className='text-lg font-semibold mb-2'>
							Продлить аренду {selectedCustomer.fullName}
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
								onClick={() => setShowExtendModal(false)}
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

			{showAddTimeModal && selectedCustomer && (
				<div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
					<div className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-xl p-6 w-80 text-white flex flex-col gap-3 shadow-lg'>
						<h2 className='text-lg font-semibold mb-2'>
							Добавить время {selectedCustomer.fullName}
						</h2>
						<input
							type='number'
							placeholder='Часы'
							value={addHours}
							onChange={e => setAddHours(e.target.value)}
							className='bg-transparent border border-[#2b2b2e] rounded-md px-3 py-2 outline-none focus:border-yellow-500'
						/>
						<input
							type='number'
							placeholder='Сумма ₽'
							value={addSum}
							onChange={e => setAddSum(e.target.value)}
							className='bg-transparent border border-[#2b2b2e] rounded-md px-3 py-2 outline-none focus:border-yellow-500'
						/>
						<div className='flex justify-end gap-3 mt-2'>
							<button
								onClick={() => setShowAddTimeModal(false)}
								className='px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-700 transition'
							>
								Отмена
							</button>
							<button
								onClick={handleAddTimeSave}
								className='px-3 py-1 rounded-md bg-yellow-600 hover:bg-yellow-700 transition'
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
