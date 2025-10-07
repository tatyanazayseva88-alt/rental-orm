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
		description: ''
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

	useEffect(() => {
		const fetchSources = async () => {
			try {
				const { data } = await axios.get<ICustomerSource[]>(
					`${API_URL}/api/customer-sources`
				)
				setSources(data)
			} catch (err) {
				console.error('Ошибка при загрузке источников', err)
			}
		}
		fetchSources()
	}, [])

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

		try {
			await axios.post(`${API_URL}/api/customer/create`, {
				fullName: formData.name,
				phone: formData.phone,
				sourceId: formData.sourceId,
				rentalStart: formData.rentalStart,
				rentalEnd: formData.rentalEnd,
				description: formData.description,
				gears: gear
					.filter(g => g.selectedCount > 0)
					.map(g => ({ gear_id: g.id, count: g.selectedCount }))
			})
			setFormData({
				name: '',
				phone: '',
				sourceId: 0,
				rentalStart: '',
				rentalEnd: '',
				description: ''
			})
			setGear(prev => prev.map(g => ({ ...g, selectedCount: 0 })))
			setSuccessMessage('✅ Заявка успешно создана!')
		} catch (err) {
			console.error('Ошибка при создании заявки:', err)
		}
	}

	return (
		<Layout>
			<section className='min-h-screen flex flex-col justify-center items-center gap-3 py-6'>
				<div className='h-auto w-full max-w-md bg-[#1c1c1f] rounded-xl border border-[#2b2b2e] p-4 flex flex-col gap-3'>
					<InputField
						placeholder='Фамилия Имя Отчество'
						value={formData.name}
						onChange={e => setFormData({ ...formData, name: e.target.value })}
						isError={errors.name}
						className='rounded-md'
					/>
					<InputField
						placeholder='Номер телефона'
						value={formData.phone}
						onChange={e => setFormData({ ...formData, phone: e.target.value })}
						isError={errors.phone}
						className='rounded-md'
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
						className='rounded-md'
					/>

					<SelectWidget
						showError={errors.selectWidget}
						onChange={setGear}
						resetSignal={successMessage}
					/>

					<div className='flex flex-col w-full gap-3'>
						<h3 className='ml-1 text-white'>Дата начала аренды</h3>
						<InputField
							type='datetime-local'
							value={formData.rentalStart}
							onChange={e =>
								setFormData({ ...formData, rentalStart: e.target.value })
							}
							isError={errors.rentalStart}
							className='flex-1 min-w-0 rounded-md'
							placeholder='Дата начала аренды'
						/>
						<h3 className='ml-1 text-white'>Дата окончания аренды</h3>
						<InputField
							type='datetime-local'
							value={formData.rentalEnd}
							onChange={e =>
								setFormData({ ...formData, rentalEnd: e.target.value })
							}
							isError={errors.rentalEnd}
							className='flex-1 min-w-0 rounded-md'
							placeholder='Дата окончания аренды'
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
