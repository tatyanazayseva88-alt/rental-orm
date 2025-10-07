import type { TextareaHTMLAttributes } from 'react'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label?: string
	isError?: boolean
}

export function TextAreaField({
	label,
	className = '',
	isError,
	...props
}: TextAreaFieldProps) {
	const textAreaClasses = `
    min-h-[100px] px-4 py-2 border rounded-md resize-none
    ${isError ? 'border-red-500' : 'border-[#2b2b2e]'}
    bg-transparent text-white placeholder:text-gray-400
    focus:outline-none focus:border-white transition
    ${className}
  `

	return (
		<div className='flex flex-col w-full max-w-md mx-auto'>
			{label && <label className='text-white mb-1'>{label}</label>}
			<textarea {...props} className={textAreaClasses} />
		</div>
	)
}
