import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import { X } from 'lucide-react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { API_URL } from '@/constants/backend.constants'

dayjs.extend(duration)

type StatusType = 'Аренда' | 'Закончилась' | 'Ожидание'

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

interface ICustomer {
	id: number
	fullName: string
	phone: string
	source?: { name: string }
	totalSum?: number
	status?: StatusType
	description?: string
	rentalStart?: string | null
	rentalEnd?: string | null
	customerGears?: ICustomerGear[]
	timeLeft?: string
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
		const dur = dayjs.duration(start.diff(now))
		const parts: string[] = []
		if (dur.days()) parts.push(`${dur.days()} дн`)
		if (dur.hours()) parts.push(`${dur.hours()} ч`)
		if (dur.minutes()) parts.push(`${dur.minutes()} м`)
		if (!dur.days() && !dur.hours() && !dur.minutes())
			parts.push(`${dur.seconds()} с`)
		timeLeft = parts.join(' ')
	} else if (now.isBefore(end)) {
		status = 'Аренда'
		const dur = dayjs.duration(end.diff(now))
		const parts: string[] = []
		if (dur.days()) parts.push(`${dur.days()} дн`)
		if (dur.hours()) parts.push(`${dur.hours()} ч`)
		if (dur.minutes()) parts.push(`${dur.minutes()} м`)
		if (!dur.days() && !dur.hours() && !dur.minutes())
			parts.push(`${dur.seconds()} с`)
		timeLeft = parts.join(' ')
	} else {
		status = 'Закончилась'
		timeLeft = ''
	}

	return { status, timeLeft }
}

const categories = [
	{ value: 'all', label: 'Все поля' },
	{ value: 'fullName', label: 'ФИО' },
	{ value: 'phone', label: 'Телефон' },
	{ value: 'source', label: 'Источник' },
	{ value: 'totalSum', label: 'Сумма' },
	{ value: 'description', label: 'Описание' },
	{ value: 'status', label: 'Статус' },
	{ value: 'gear', label: 'Снаряжение' }
]

export function ArchivePage() {
	const [customers, setCustomers] = useState<ICustomer[]>([])
	const [search, setSearch] = useState('')
	const [searchCategory, setSearchCategory] = useState('all')
	const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
		null
	)
	const [editCustomer, setEditCustomer] = useState<ICustomer | null>(null)

	useEffect(() => {
		fetchCustomers()
	}, [])

	const fetchCustomers = async () => {
		try {
			const { data } = await axios.get<ICustomer[]>(`${API_URL}/api/customer`)
			const mapped = data.map(c => {
				const { status, timeLeft } = getCustomerTimeData(c)
				let totalSum = c.totalSum ?? 0
				if (!c.totalSum && c.customerGears) {
					totalSum = c.customerGears.reduce(
						(sum, g) => sum + (g.gear?.price ?? 0) * g.count,
						0
					)
				}
				return { ...c, status, timeLeft, totalSum }
			})
			setCustomers(mapped)
		} catch (err) {
			console.error(err)
		}
	}

	const handleSave = async () => {
		if (!editCustomer) return
		try {
			await axios.put(
				`${API_URL}/api/customer/${editCustomer.id}`,
				editCustomer
			)
			setSelectedCustomer(null)
			setEditCustomer(null)
			fetchCustomers()
		} catch (err) {
			console.error(err)
		}
	}

	const filtered = customers.filter(c => {
		const term = search.toLowerCase()
		const gearStr = c.customerGears?.map(g => g.gear?.name).join(' ') || ''
		if (searchCategory === 'all') {
			return (
				c.fullName.toLowerCase().includes(term) ||
				c.phone.toLowerCase().includes(term) ||
				(c.source?.name || '').toLowerCase().includes(term) ||
				(c.description || '').toLowerCase().includes(term) ||
				String(c.totalSum || '').includes(term) ||
				(c.status || '').toLowerCase().includes(term) ||
				gearStr.toLowerCase().includes(term)
			)
		} else if (searchCategory === 'gear') {
			return gearStr.toLowerCase().includes(term)
		} else if (searchCategory === 'source') {
			return (c.source?.name || '').toLowerCase().includes(term)
		} else if (searchCategory === 'description') {
			return (c.description || '').toLowerCase().includes(term)
		} else if (searchCategory === 'status') {
			return (c.status || '').toLowerCase().includes(term)
		} else if (searchCategory === 'totalSum') {
			return String(c.totalSum || '').includes(term)
		} else if (searchCategory === 'phone') {
			return c.phone.toLowerCase().includes(term)
		} else if (searchCategory === 'fullName') {
			return c.fullName.toLowerCase().includes(term)
		}
		return true
	})

	const handleDelete = async () => {
		if (!editCustomer) return
		if (!confirm(`Удалить клиента ${editCustomer.fullName}?`)) return
		try {
			await axios.delete(`${API_URL}/api/customer/${editCustomer.id}`)
			setSelectedCustomer(null)
			setEditCustomer(null)
			fetchCustomers()
		} catch (err) {
			console.error(err)
			alert('Ошибка при удалении')
		}
	}

	return (
		<Layout>
			<div className='w-full max-w-6xl mx-auto mt-8 px-4'>
				<div className='flex items-center gap-2 mb-4'>
					<select
						value={searchCategory}
						onChange={e => setSearchCategory(e.target.value)}
						className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-lg px-3 py-2 text-white outline-none'
					>
						{categories.map(c => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
					<input
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder='Поиск...'
						className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-lg px-3 py-2 text-white w-full outline-none focus:border-orange-500'
					/>
				</div>

				<div className='overflow-x-auto'>
					<table className='min-w-full bg-[#1c1c1f] rounded-xl border border-[#2b2b2e] overflow-hidden'>
						<thead>
							<tr className='bg-[#25252a] text-white'>
								<th className='px-6 py-3 text-left'>ФИО</th>
								<th className='px-6 py-3 text-left'>Телефон</th>
								<th className='px-6 py-3 text-left'>Источник</th>
								<th className='px-6 py-3 text-left'>Сумма</th>
								<th className='px-6 py-3 text-left'>Описание</th>
								<th className='px-6 py-3 text-left'>Статус</th>
								<th className='px-6 py-3 text-left'>Снаряжение</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(c => (
								<tr
									key={c.id}
									className='border-b border-[#2b2b2e] cursor-pointer hover:bg-[#2a2a2e]'
									onClick={() => {
										setSelectedCustomer(c)
										setEditCustomer({ ...c })
									}}
								>
									<td className='px-6 py-3'>{c.fullName}</td>
									<td className='px-6 py-3'>{c.phone}</td>
									<td className='px-6 py-3'>{c.source?.name || '–'}</td>
									<td className='px-6 py-3'>{c.totalSum}₽</td>
									<td className='px-6 py-3'>{c.description || '–'}</td>
									<td className='px-6 py-3'>{c.status}</td>
									<td className='px-6 py-3'>
										{c.customerGears
											?.map(g => `${g.count} ${g.gear?.name ?? '–'}`)
											.join(', ') || '–'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{selectedCustomer && editCustomer && (
				<div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto'>
					<div className='bg-[#1c1c1f] text-white w-full max-w-3xl rounded-xl p-6 shadow-lg relative flex flex-col gap-3'>
						<X
							className='absolute top-4 right-4 cursor-pointer hover:text-gray-300'
							size={24}
							onClick={() => {
								setSelectedCustomer(null)
								setEditCustomer(null)
							}}
						/>
						<h2 className='text-2xl font-bold'>Редактирование клиента</h2>
						<div className='flex flex-col gap-2'>
							<label>
								ФИО:
								<input
									type='text'
									value={editCustomer.fullName}
									onChange={e =>
										setEditCustomer({
											...editCustomer,
											fullName: e.target.value
										})
									}
									className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-md px-2 py-1 w-full outline-none focus:border-orange-500'
								/>
							</label>
							<label>
								Телефон:
								<input
									type='text'
									value={editCustomer.phone}
									onChange={e =>
										setEditCustomer({ ...editCustomer, phone: e.target.value })
									}
									className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-md px-2 py-1 w-full outline-none focus:border-orange-500'
								/>
							</label>
							<label>
								Сумма:
								<input
									type='number'
									value={editCustomer.totalSum || 0}
									onChange={e =>
										setEditCustomer({
											...editCustomer,
											totalSum: Number(e.target.value)
										})
									}
									className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-md px-2 py-1 w-full outline-none focus:border-orange-500'
								/>
							</label>
							<label>
								Описание:
								<textarea
									rows={4}
									value={editCustomer.description || ''}
									onChange={e =>
										setEditCustomer({
											...editCustomer,
											description: e.target.value
										})
									}
									className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-md px-2 py-1 w-full outline-none focus:border-orange-500 resize-none'
								/>
							</label>
							<label>
								Снаряжение:
								<ul className='pl-4 list-disc'>
									{editCustomer.customerGears?.map(g => (
										<li key={g.gear_id}>
											{g.count} {g.gear?.name ?? '–'}
										</li>
									)) || <li>–</li>}
								</ul>
							</label>
						</div>
						<div className='flex justify-end gap-3 mt-4'>
							<button
								onClick={() => {
									setSelectedCustomer(null)
									setEditCustomer(null)
								}}
								className='px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-700 transition cursor-pointer'
							>
								Отмена
							</button>
							<button
								onClick={handleSave}
								className='px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 transition cursor-pointer'
							>
								Сохранить изменения
							</button>
							<button
								onClick={handleDelete}
								className='px-3 py-1 rounded-md bg-red-600 hover:bg-red-800 transition cursor-pointer'
							>
								Удалить
							</button>
						</div>
					</div>
				</div>
			)}
		</Layout>
	)
}
