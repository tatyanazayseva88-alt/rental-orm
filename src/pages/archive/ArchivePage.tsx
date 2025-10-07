import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import { ArrowDownUp, Trash2, X } from 'lucide-react'
import { API_URL } from '@/constants/backend.constants'

interface ICustomer {
	id: number
	fullName: string
	phone: string
	source?: { name: string }
	totalSum?: number
	status?: 'Аренда' | 'Закончилась' | 'Ожидание'
	rentalDateTime?: string
	rentalPeriod?: string
	description?: string
}

export function ArchivePage() {
	const [customers, setCustomers] = useState<ICustomer[]>([])
	const [search, setSearch] = useState('')
	const [sortBy, setSortBy] = useState<'name' | 'source' | 'sum'>('name')
	const [editing, setEditing] = useState<{
		id: number
		field: 'fullName' | 'phone' | 'totalSum'
	} | null>(null)
	const [editValue, setEditValue] = useState('')
	const [hoveredId, setHoveredId] = useState<number | null>(null)
	const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
		null
	)

	useEffect(() => {
		fetchCustomers()
	}, [])

	const fetchCustomers = async () => {
		try {
			const { data } = await axios.get<ICustomer[]>(`${API_URL}/api/customer`)
			const filtered = data
				.map(c => {
					const now = new Date()
					const start = c.rentalDateTime
						? new Date(c.rentalDateTime)
						: new Date()
					const periodHours = Number(c.rentalPeriod ?? 0)
					const end = new Date(start.getTime() + periodHours * 60 * 60 * 1000)

					let status: ICustomer['status'] = 'Ожидание'
					if (now < start) status = 'Ожидание'
					else if (now >= start && now <= end) status = 'Аренда'
					else status = 'Закончилась'

					return { ...c, status }
				})
				.filter(c => c.status !== 'Ожидание')

			setCustomers(filtered)
		} catch (err) {
			console.error(err)
		}
	}

	const saveEdit = async (
		id: number,
		field: 'fullName' | 'phone' | 'totalSum'
	) => {
		try {
			const updated = {
				[field]: field === 'totalSum' ? Number(editValue) : editValue
			}
			await axios.put(`${API_URL}/api/customer/${id}`, updated)
			setEditing(null)
			fetchCustomers()
		} catch (err) {
			console.error(err)
		}
	}

	const deleteCustomer = async (id: number) => {
		if (!confirm('Удалить этого клиента?')) return
		try {
			await axios.delete(`${API_URL}/api/customer/${id}`)
			setCustomers(prev => prev.filter(c => c.id !== id))
		} catch (err) {
			console.error(err)
		}
	}

	const filtered = customers
		.filter(c =>
			[c.fullName, c.source?.name].some(f =>
				f?.toLowerCase().includes(search.toLowerCase())
			)
		)
		.sort((a, b) => {
			if (sortBy === 'name') return a.fullName.localeCompare(b.fullName)
			if (sortBy === 'source')
				return (a.source?.name || '').localeCompare(b.source?.name || '')
			if (sortBy === 'sum') return (b.totalSum ?? 0) - (a.totalSum ?? 0)
			return 0
		})

	return (
		<Layout>
			<div className='w-full max-w-6xl mx-auto mt-8 px-4'>
				<div className='flex items-center gap-2 mb-4'>
					<input
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder='Поиск...'
						className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-lg px-3 py-2 text-white w-1/2 outline-none focus:border-orange-500'
					/>
					<div className='flex items-center gap-2 relative'>
						<select
							value={sortBy}
							onChange={e => setSortBy(e.target.value as any)}
							className='bg-[#1c1c1f] text-white border border-[#2b2b2e] rounded-lg px-3 py-2 pr-8 appearance-none outline-none focus:border-orange-500'
						>
							<option value='name'>ФИО</option>
							<option value='source'>Источник</option>
							<option value='sum'>Сумма</option>
						</select>
						<ArrowDownUp className='absolute right-2 text-gray-400 w-4 h-4 pointer-events-none' />
					</div>
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
							</tr>
						</thead>
						<tbody>
							{filtered.map(c => (
								<tr
									key={c.id}
									className='bg-[#1c1c1f] border-b border-[#2b2b2e] relative group'
									onMouseEnter={() => setHoveredId(c.id)}
									onMouseLeave={() => setHoveredId(null)}
								>
									<td
										className='px-6 py-3 cursor-pointer text-gray-200'
										onClick={() => {
											setEditing({ id: c.id, field: 'fullName' })
											setEditValue(c.fullName)
										}}
									>
										{editing?.id === c.id && editing.field === 'fullName' ? (
											<input
												value={editValue}
												onChange={e => setEditValue(e.target.value)}
												onBlur={() => saveEdit(c.id, 'fullName')}
												onKeyDown={e =>
													e.key === 'Enter' && saveEdit(c.id, 'fullName')
												}
												autoFocus
												className='bg-transparent text-white border-b border-white outline-none w-full'
											/>
										) : (
											c.fullName
										)}
									</td>

									<td
										className='px-6 py-3 cursor-pointer text-gray-200'
										onClick={() => {
											setEditing({ id: c.id, field: 'phone' })
											setEditValue(c.phone)
										}}
									>
										{editing?.id === c.id && editing.field === 'phone' ? (
											<input
												value={editValue}
												onChange={e => setEditValue(e.target.value)}
												onBlur={() => saveEdit(c.id, 'phone')}
												onKeyDown={e =>
													e.key === 'Enter' && saveEdit(c.id, 'phone')
												}
												autoFocus
												className='bg-transparent text-white border-b border-white outline-none w-full'
											/>
										) : (
											c.phone
										)}
									</td>

									<td className='px-6 py-3 text-gray-300'>
										{c.source?.name ?? '–'}
									</td>

									<td
										className='px-6 py-3 cursor-pointer text-gray-200'
										onClick={() => {
											setEditing({ id: c.id, field: 'totalSum' })
											setEditValue(String(c.totalSum ?? 0))
										}}
									>
										{editing?.id === c.id && editing.field === 'totalSum' ? (
											<input
												value={editValue}
												onChange={e => setEditValue(e.target.value)}
												onBlur={() => saveEdit(c.id, 'totalSum')}
												onKeyDown={e =>
													e.key === 'Enter' && saveEdit(c.id, 'totalSum')
												}
												autoFocus
												className='bg-transparent text-white border-b border-white outline-none w-full'
											/>
										) : (
											`${c.totalSum ?? 0}₽`
										)}
									</td>

									<td className='px-6 py-3 text-gray-300'>
										{c.description ? (
											<button
												onClick={() => setSelectedCustomer(c)}
												className='text-orange-400 hover:underline'
											>
												{c.description.length > 30
													? c.description.slice(0, 30) + '...'
													: c.description}
											</button>
										) : (
											<span className='text-gray-500'>–</span>
										)}
									</td>

									<td className='px-6 py-3'>
										<span
											className={`px-2 py-1 rounded-md text-sm font-medium ${
												c.status === 'Аренда'
													? 'bg-orange-500 text-white'
													: 'bg-gray-600 text-white'
											}`}
										>
											{c.status}
										</span>
									</td>

									{hoveredId === c.id && (
										<button
											onClick={() => deleteCustomer(c.id)}
											className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition cursor-pointer'
										>
											<Trash2 size={18} />
										</button>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{selectedCustomer && (
				<div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
					<div className='bg-[#1c1c1f] rounded-xl max-w-lg w-full p-6 relative border border-[#2b2b2e]'>
						<button
							onClick={() => setSelectedCustomer(null)}
							className='absolute right-4 top-4 text-gray-400 hover:text-white transition'
						>
							<X size={20} />
						</button>
						<h2 className='text-xl font-semibold text-white mb-4'>
							Описание клиента
						</h2>
						<p className='text-gray-300 whitespace-pre-line'>
							{selectedCustomer.description}
						</p>
					</div>
				</div>
			)}
		</Layout>
	)
}
