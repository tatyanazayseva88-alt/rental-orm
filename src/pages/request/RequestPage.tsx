import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button/Button'
import { InputField } from '@/components/ui/fields/InputField'
import { SelectWidget, type IGear } from '@/components/ui/select/SelectWidget'
import { TextAreaField } from '@/components/ui/fields/TextAreaField'
import { API_URL } from '@/constants/backend.constants'

interface ICustomerSource {
	id: number
	name: string
}

export default function RequestPage() {
	const [formData, setFormData] = useState({
		name: '',
		phone: '',
		sourceId: 0,
		rentalStart: '',
		rentalEnd: '',
		description: '',
		discount: ''
	})
	const [errors, setErrors] = useState({
		name: false,
		phone: false,
		sourceId: false,
		rentalStart: false,
		rentalEnd: false,
		selectWidget: false,
		description: false
	})
	const [gear, setGear] = useState<IGear[]>([])
	const [sources, setSources] = useState<ICustomerSource[]>([])
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const discountNum = Number(formData.discount) || 0

	useEffect(() => {
		axios
			.get<ICustomerSource[]>(`${API_URL}/api/customer-sources`)
			.then(res => setSources(res.data))
			.catch(console.error)
	}, [])

	const calculateDays = (start: string, end: string) => {
		if (!start || !end) return 1
		const diff = new Date(end).getTime() - new Date(start).getTime()
		return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
	}

	const handleSubmit = async () => {
		setSuccessMessage(null)
		const newErrors = {
			name: !formData.name.trim(),
			phone: !formData.phone.trim(),
			sourceId: !formData.sourceId,
			rentalStart: !formData.rentalStart.trim(),
			rentalEnd: !formData.rentalEnd.trim(),
			selectWidget: !gear.some(g => g.selectedCount > 0),
			description: !formData.description.trim()
		}
		setErrors(newErrors)
		if (Object.values(newErrors).some(Boolean)) return

		const days = calculateDays(formData.rentalStart, formData.rentalEnd)

		try {
			await axios.post(`${API_URL}/api/customer/create`, {
				fullName: formData.name,
				phone: formData.phone,
				sourceId: formData.sourceId,
				rentalStart: formData.rentalStart,
				rentalEnd: formData.rentalEnd,
				description: formData.description,
				discount: discountNum,
				gears: gear
					.filter(g => g.selectedCount > 0)
					.map(g => ({ gear_id: g.id, count: g.selectedCount, days }))
			})
			setFormData({
				name: '',
				phone: '',
				sourceId: 0,
				rentalStart: '',
				rentalEnd: '',
				description: '',
				discount: ''
			})
			setGear(prev => prev.map(g => ({ ...g, selectedCount: 0 })))
			setSuccessMessage('✅ Заявка успешно создана!')
		} catch (err) {
			console.error(err)
		}
	}

	return (
		<Layout>
			<section className='min-h-screen flex flex-col justify-center items-center gap-3 py-6'>
				<div className='w-full max-w-md bg-[#1c1c1f] rounded-xl border border-[#2b2b2e] p-4 flex flex-col gap-3'>
					<InputField
						placeholder='Фамилия Имя Отчество'
						value={formData.name}
						className='rounded-md'
						onChange={e => setFormData({ ...formData, name: e.target.value })}
						isError={errors.name}
					/>
					<InputField
						placeholder='Номер телефона'
						className='rounded-md'
						value={formData.phone}
						onChange={e => setFormData({ ...formData, phone: e.target.value })}
						isError={errors.phone}
					/>
					<select
						value={formData.sourceId}
						onChange={e =>
							setFormData({ ...formData, sourceId: Number(e.target.value) })
						}
						className={`h-10 px-4 border rounded-md bg-[#1c1c1f] text-white focus:outline-none ${
							errors.sourceId ? 'border-red-500' : 'border-[#2b2b2e]'
						}`}
					>
						<option value={0} disabled>
							Откуда узнали о нас?
						</option>
						{sources.map(s => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>

					<TextAreaField
						label='Описание'
						placeholder='Введите описание аренды...'
						value={formData.description}
						onChange={e =>
							setFormData({ ...formData, description: e.target.value })
						}
						isError={errors.description}
					/>

					<SelectWidget
						showError={errors.selectWidget}
						onChange={(g, _) => setGear(g)}
						resetSignal={successMessage}
						rentalStart={formData.rentalStart}
						rentalEnd={formData.rentalEnd}
						discount={discountNum}
					/>

					<InputField
						label='Скидка (%)'
						type='number'
						value={formData.discount}
						onChange={e =>
							setFormData({ ...formData, discount: e.target.value })
						}
						className='rounded-md'
					/>

					<div className='flex flex-col w-full gap-3'>
						<h3 className='text-white'>Дата начала аренды</h3>
						<InputField
							type='datetime-local'
							value={formData.rentalStart}
							className='rounded-md'
							onChange={e =>
								setFormData({ ...formData, rentalStart: e.target.value })
							}
							isError={errors.rentalStart}
						/>
						<h3 className='text-white'>Дата окончания аренды</h3>
						<InputField
							type='datetime-local'
							value={formData.rentalEnd}
							className='rounded-md'
							onChange={e =>
								setFormData({ ...formData, rentalEnd: e.target.value })
							}
							isError={errors.rentalEnd}
						/>
					</div>

					<Button
						active={true}
						className='border-none border mx-auto flex justify-center items-center !w-45 !pl-0'
						onClick={handleSubmit}
					>
						Создать заявку
					</Button>
				</div>

				{successMessage && (
					<p className='text-green-400 text-center mt-2 font-medium'>
						{successMessage}
					</p>
				)}
			</section>
		</Layout>
	)
}
