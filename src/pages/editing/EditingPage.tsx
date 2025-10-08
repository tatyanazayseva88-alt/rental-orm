import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button/Button'
import { InputField } from '@/components/ui/fields/InputField'
import { X } from 'lucide-react'
import { API_URL } from '@/constants/backend.constants'

interface ICustomerSource {
	id: number
	name: string
}

interface IGear {
	id: number
	name: string
	count: number
	price: number
}

export function EditingPage() {
	const [sources, setSources] = useState<ICustomerSource[]>([])
	const [newSource, setNewSource] = useState('')
	const [gears, setGears] = useState<IGear[]>([])
	const [newGear, setNewGear] = useState({
		name: '',
		count: '',
		price: ''
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchSources()
		fetchGears()
	}, [])

	const fetchSources = async () => {
		try {
			const { data } = await axios.get<ICustomerSource[]>(
				`${API_URL}/api/customer-sources`
			)
			setSources(data)
		} catch (err) {
			console.error(err)
			setError('Ошибка при загрузке источников')
		}
	}

	const addSource = async () => {
		if (!newSource.trim()) return
		try {
			setLoading(true)
			await axios.post(`${API_URL}/api/customer-sources`, { name: newSource })
			setNewSource('')
			fetchSources()
		} catch (err) {
			console.error(err)
			setError('Ошибка при добавлении источника')
		} finally {
			setLoading(false)
		}
	}

	const deleteSource = async (id: number) => {
		try {
			setLoading(true)
			await axios.delete(`${API_URL}/api/customer-sources/${id}`)
			fetchSources()
		} catch (err) {
			console.error(err)
			setError('Ошибка при удалении источника')
		} finally {
			setLoading(false)
		}
	}

	const fetchGears = async () => {
		try {
			const { data } = await axios.get<IGear[]>(`${API_URL}/api/gear`)
			setGears(data)
		} catch (err) {
			console.error(err)
			setError('Ошибка при загрузке инвентаря')
		}
	}

	const addGear = async () => {
		if (!newGear.name.trim() || !newGear.count || !newGear.price) return
		try {
			setLoading(true)
			await axios.post(`${API_URL}/api/gear/create`, {
				name: newGear.name,
				count: Number(newGear.count),
				price: Number(newGear.price)
			})
			setNewGear({ name: '', count: '', price: '' })
			fetchGears()
		} catch (err) {
			console.error(err)
			setError('Ошибка при добавлении инвентаря')
		} finally {
			setLoading(false)
		}
	}

	const deleteGear = async (id: number) => {
		try {
			setLoading(true)
			await axios.delete(`${API_URL}/api/gear/${id}`)
			fetchGears()
		} catch (err) {
			console.error(err)
			setError('Ошибка при удалении инвентаря')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Layout>
			<div className='w-full max-w-md mx-auto mt-8 flex flex-col gap-10'>
				<div className='p-6 flex flex-col gap-4 bg-[#1c1c1f] rounded-xl border border-[#2b2b2e]'>
					<h1 className='text-xl font-bold text-white text-center'>
						Источники клиентов
					</h1>
					<div className='flex gap-2'>
						<InputField
							placeholder='Новый источник'
							value={newSource}
							onChange={e => setNewSource(e.target.value)}
							className='flex-1 h-8 rounded-md px-3 text-white bg-[#25252a] placeholder-gray-400 border border-[#2b2b2e] focus:outline-none focus:border-white'
						/>
						<Button
							onClick={addSource}
							active={!loading}
							className='px-3 py-1 rounded-md text-sm'
						>
							Добавить
						</Button>
					</div>
					<ul className='flex flex-col gap-2 mt-2'>
						{sources.map(s => (
							<li
								key={s.id}
								className='flex justify-between items-center bg-[#25252a] p-2 rounded-md border border-[#2b2b2e]'
							>
								<span className='text-white'>{s.name}</span>
								<X
									size={16}
									className='text-gray-400 hover:text-red-500 cursor-pointer'
									onClick={() => deleteSource(s.id)}
								/>
							</li>
						))}
					</ul>
				</div>

				<div className='p-6 flex flex-col gap-4 bg-[#1c1c1f] rounded-xl border border-[#2b2b2e]'>
					<h1 className='text-xl font-bold text-white text-center'>
						Инвентарь
					</h1>
					<div className='flex flex-col gap-2'>
						<InputField
							placeholder='Название'
							value={newGear.name}
							onChange={e => setNewGear({ ...newGear, name: e.target.value })}
							className='h-8 rounded-md px-3 text-white bg-[#25252a] placeholder-gray-400 border border-[#2b2b2e] focus:outline-none focus:border-white'
						/>
						<InputField
							placeholder='Количество'
							value={newGear.count}
							type='number'
							onChange={e => setNewGear({ ...newGear, count: e.target.value })}
							className='h-8 rounded-md px-3 text-white bg-[#25252a] placeholder-gray-400 border border-[#2b2b2e] focus:outline-none focus:border-white'
						/>
						<InputField
							placeholder='Цена аренды'
							value={newGear.price}
							type='number'
							onChange={e => setNewGear({ ...newGear, price: e.target.value })}
							className='h-8 rounded-md px-3 text-white bg-[#25252a] placeholder-gray-400 border border-[#2b2b2e] focus:outline-none focus:border-white'
						/>
						<Button
							onClick={addGear}
							active={!loading}
							className='px-3 py-1 rounded-md text-sm mt-1'
						>
							Добавить
						</Button>
					</div>
					<ul className='flex flex-col gap-2 mt-2'>
						{gears.map(g => (
							<li
								key={g.id}
								className='flex justify-between items-center bg-[#25252a] p-2 rounded-md border border-[#2b2b2e]'
							>
								<div className='flex flex-col'>
									<span className='text-white'>{g.name}</span>
									<span className='text-gray-400 text-sm'>
										• Цена аренды: {g.price}₽ <br />• Кол-во: {g.count}
									</span>
								</div>
								<X
									size={16}
									className='text-gray-400 hover:text-red-500 cursor-pointer'
									onClick={() => deleteGear(g.id)}
								/>
							</li>
						))}
					</ul>
				</div>

				{error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
			</div>
		</Layout>
	)
}
