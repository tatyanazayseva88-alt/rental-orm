import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'

type NumberSelectFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string
	isError?: boolean
	selectOptions: { value: string; label: string }[]
	valueSelect: string
	onChangeSelect: (value: string) => void
}

export function NumberSelectField({
	label,
	className = '',
	isError,
	selectOptions,
	valueSelect,
	onChangeSelect,
	...props
}: NumberSelectFieldProps) {
	const [isFocused, setIsFocused] = useState(false)
	const containerClasses = `flex border rounded-md overflow-hidden ${
		isError ? 'border-red-500' : isFocused ? 'border-white' : 'border-[#2b2b2e]'
	} ${className}`

	return (
		<div className='flex flex-col w-full max-w-md'>
			{label && <label className='text-white mb-1'>{label}</label>}
			<div className={containerClasses}>
				<input
					{...props}
					type='text'
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className='flex-1 px-4 h-6 bg-transparent text-white placeholder:text-gray-400 focus:outline-none'
				/>
				<select
					value={valueSelect}
					onChange={e => onChangeSelect(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className='h-6 bg-[#1f1f23] text-white border-l border-[#2b2b2e] px-2 focus:outline-none appearance-none'
				>
					{selectOptions.map(opt => (
						<option
							key={opt.value}
							value={opt.value}
							className='bg-[#1f1f23] text-white'
						>
							{opt.label}
						</option>
					))}
				</select>
			</div>
		</div>
	)
}
