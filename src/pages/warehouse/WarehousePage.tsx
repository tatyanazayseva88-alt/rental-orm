import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import { API_URL } from '@/constants/backend.constants'

interface IGear {
	id: number
	name: string
	price: number
	count: number
	available?: number
}

interface ICustomer {
	id: number
	gears?: { gear_id: number; count: number }[]
}

export function WarehousePage() {
	const [gears, setGears] = useState<IGear[]>([])
	const [filtered, setFiltered] = useState<IGear[]>([])
	const [editingCell, setEditingCell] = useState<{
		id: number
		field: keyof IGear
	} | null>(null)
	const [editedValue, setEditedValue] = useState('')
	const [searchValue, setSearchValue] = useState('')
	const [searchField, setSearchField] = useState<keyof IGear>('name')

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		try {
			const [{ data: gearsData }, { data: customersData }] = await Promise.all([
				axios.get<IGear[]>(`${API_URL}/api/gear`),
				axios.get<ICustomer[]>(`${API_URL}/api/customer`)
			])

			const gearMap = gearsData.map(g => {
				const taken = customersData
					.flatMap(c => c.gears ?? [])
					.filter(item => item.gear_id === g.id)
					.reduce((sum, item) => sum + item.count, 0)
				return { ...g, available: g.count - taken }
			})

			setGears(gearMap)
			setFiltered(gearMap)
		} catch (err) {
			console.error(err)
		}
	}

	useEffect(() => {
		const value = searchValue.toLowerCase()
		const filteredList = gears.filter(g => {
			const fieldValue = g[searchField]
			if (fieldValue == null) return false
			if (typeof fieldValue === 'number')
				return String(fieldValue).includes(value)
			return fieldValue.toLowerCase().includes(value)
		})
		setFiltered(filteredList)
	}, [searchValue, searchField, gears])

	const saveEdit = async (gear: IGear, field: keyof IGear) => {
		try {
			const updated = {
				...gear,
				[field]: field === 'name' ? editedValue : Number(editedValue)
			}
			await axios.put(`${API_URL}/api/gear/update/${gear.id}`, updated)
			setEditingCell(null)
			fetchData()
		} catch (err) {
			console.error(err)
		}
	}

	return (
		<Layout>
			<div className='w-full max-w-6xl mx-auto mt-8 px-4'>
				<div className='flex gap-4 mb-4'>
					<select
						value={searchField}
						onChange={e => setSearchField(e.target.value as keyof IGear)}
						className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-lg px-3 py-2 text-white'
					>
						<option value='name'>Название</option>
						<option value='price'>Цена</option>
						<option value='count'>Общее количество</option>
						<option value='available'>Доступно</option>
					</select>
					<input
						type='text'
						value={searchValue}
						onChange={e => setSearchValue(e.target.value)}
						placeholder='Поиск...'
						className='bg-[#1c1c1f] border border-[#2b2b2e] rounded-lg px-3 py-2 text-white w-full'
					/>
				</div>

				<div className='overflow-x-auto'>
					<table className='min-w-full bg-[#1c1c1f] rounded-xl border border-[#2b2b2e] overflow-hidden'>
						<thead>
							<tr className='bg-[#25252a] text-white'>
								<th className='px-6 py-3 text-left'>Название</th>
								<th className='px-6 py-3 text-left'>Цена</th>
								<th className='px-6 py-3 text-left'>Общее количество</th>
								<th className='px-6 py-3 text-left'>Доступно</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(g => (
								<tr
									key={g.id}
									className='bg-[#1c1c1f] border-b border-[#2b2b2e]'
								>
									{(['name', 'price', 'count'] as (keyof IGear)[]).map(
										field => (
											<td
												key={field}
												className='px-6 py-3 cursor-pointer'
												onClick={() => {
													setEditingCell({ id: g.id, field })
													setEditedValue(String(g[field]))
												}}
											>
												{editingCell?.id === g.id &&
												editingCell.field === field ? (
													<input
														value={editedValue}
														onChange={e => setEditedValue(e.target.value)}
														onBlur={() => saveEdit(g, field)}
														onKeyDown={e =>
															e.key === 'Enter' && saveEdit(g, field)
														}
														autoFocus
														className='bg-transparent text-white w-full outline-none border-b border-white'
														style={{ minWidth: '50px' }}
													/>
												) : field === 'price' ? (
													`${g.price}₽`
												) : (
													g[field]
												)}
											</td>
										)
									)}
									<td className='px-6 py-3'>{g.available ?? g.count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</Layout>
	)
}
