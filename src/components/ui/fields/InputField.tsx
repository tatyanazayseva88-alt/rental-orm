import type { InputHTMLAttributes } from 'react'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string
	isError?: boolean
}

export function InputField({
	label,
	className = '',
	isError,
	...props
}: InputFieldProps) {
	const inputClasses = `
    h-10 px-4 border
    ${isError ? 'border-red-500' : 'border-[#2b2b2e]'}
    bg-transparent text-white placeholder:text-gray-400
    focus:outline-none focus:border-white transition
    ${className}
  `

	return (
		<div className='flex flex-col w-full max-w-md mx-auto'>
			{label && <label className='text-white mb-1'>{label}</label>}
			<input {...props} className={inputClasses} />
		</div>
	)
}
