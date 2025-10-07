import { useEffect, useState } from 'react'
import axios from 'axios'
import { InputField } from '../fields/InputField'
import { Plus, Minus, X } from 'lucide-react'
import { API_URL } from '@/constants/backend.constants'

export interface IGear {
	id: number
	name: string
	price: number
	count: number
	selectedCount: number
	available?: number
}

type SelectWidgetProps = {
	showError?: boolean
	onChange?: (gear: IGear[]) => void
	resetSignal?: string | null
}

export function SelectWidget({
	showError,
	onChange,
	resetSignal
}: SelectWidgetProps) {
	const [gear, setGear] = useState<IGear[]>([])
	const [search, setSearch] = useState('')
	const [focused, setFocused] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchGear = async () => {
			try {
				const [{ data: gearsData }, { data: customersData }] =
					await Promise.all([
						axios.get(`${API_URL}/api/gear`),
						axios.get(`${API_URL}/api/customer`)
					])

				const updated = gearsData.map((g: IGear) => {
					const taken = customersData
						.flatMap((c: any) => c.gears ?? [])
						.filter((i: any) => i.gear_id === g.id)
						.reduce((sum: number, i: any) => sum + i.count, 0)
					const available = Math.max(g.count - taken, 0)
					return { ...g, available, selectedCount: 0 }
				})

				setGear(updated)
			} catch (error) {
				console.error('Ошибка при загрузке оборудования:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchGear()
	}, [])

	useEffect(() => {
		if (resetSignal) {
			setGear(prev => prev.map(g => ({ ...g, selectedCount: 0 })))
			setSearch('')
		}
	}, [resetSignal])

	const changeCount = (id: number, delta: number) => {
		setGear(prev =>
			prev.map(item => {
				if (item.id !== id) return item
				const max = item.available ?? item.count
				const newCount = Math.max(0, Math.min(max, item.selectedCount + delta))
				return { ...item, selectedCount: newCount }
			})
		)
	}

	useEffect(() => {
		if (onChange) onChange(gear)
	}, [gear])

	const filtered = gear.filter(item =>
		item.name.toLowerCase().includes(search.toLowerCase())
	)
	const total = gear.reduce(
		(acc, item) => acc + item.price * item.selectedCount,
		0
	)

	return (
		<div
			className={`w-full max-w-md mx-auto rounded-xl overflow-hidden bg-[#1a1a1d] text-white transition-colors ${
				focused
					? 'border border-white'
					: showError
					? 'border border-red-500'
					: 'border border-[#2b2b2e]'
			}`}
		>
			<div className='p-3 border-b border-[#2b2b2e] flex items-center'>
				<InputField
					className='!h-5 flex-1 border-none focus:ring-0'
					placeholder='Поиск'
					value={search}
					onChange={e => setSearch(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
				/>
				{search && (
					<button
						onClick={() => setSearch('')}
						className='ml-2 p-1 text-gray-400 hover:text-white cursor-pointer transition-colors'
					>
						<X size={16} />
					</button>
				)}
			</div>

			{loading ? (
				<div className='p-4 text-center text-gray-400'>Загрузка...</div>
			) : (
				<div className='p-2' style={{ height: '18rem', overflowY: 'auto' }}>
					<div className='grid grid-cols-2 gap-2'>
						{filtered.map(item => (
							<div
								key={item.id}
								className='p-2 rounded-lg border border-[#2b2b2e] bg-[#25252a] flex flex-col justify-between h-auto'
							>
								<div>
									<p className='font-medium'>{item.name}</p>
									<p className='text-gray-400 text-sm'>
										{item.price} ₽ · Доступно: {item.available ?? item.count}
									</p>
								</div>
								<div className='flex items-center justify-between mt-2'>
									<button
										onClick={() => changeCount(item.id, -1)}
										className={`p-1 ${
											item.selectedCount === 0
												? 'text-gray-600 cursor-not-allowed'
												: 'text-gray-400 hover:text-white cursor-pointer transition-colors'
										}`}
										disabled={item.selectedCount === 0}
									>
										<Minus size={16} />
									</button>
									<span className='px-2'>x{item.selectedCount ?? 0}</span>
									<button
										onClick={() => changeCount(item.id, 1)}
										className={`p-1 ${
											item.selectedCount >= (item.available ?? item.count)
												? 'text-gray-600 cursor-not-allowed'
												: 'text-gray-400 hover:text-white cursor-pointer transition-colors'
										}`}
										disabled={
											item.selectedCount >= (item.available ?? item.count)
										}
									>
										<Plus size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className='p-3 border-t border-[#2b2b2e] flex justify-between font-semibold'>
				<span>Итого:</span>
				<span>{total} ₽</span>
			</div>
		</div>
	)
}
