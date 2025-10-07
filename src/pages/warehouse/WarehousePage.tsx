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
	const [editingCell, setEditingCell] = useState<{
		id: number
		field: keyof IGear
	} | null>(null)
	const [editedValue, setEditedValue] = useState<string>('')

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
		} catch (err) {
			console.error(err)
		}
	}

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
							{gears.map(g => (
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
														onKeyDown={e => {
															if (e.key === 'Enter') saveEdit(g, field)
														}}
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
