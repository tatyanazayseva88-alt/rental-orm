import type { PropsWithChildren, ButtonHTMLAttributes } from 'react'

type ButtonProps = PropsWithChildren &
	ButtonHTMLAttributes<HTMLButtonElement> & {
		active?: boolean
	}

export function Button({
	children,
	className,
	active = false,
	...props
}: ButtonProps) {
	return (
		<button
			className={`
        h-10 w-65 flex items-center pl-5 cursor-pointer rounded-md transition
        ${
					active
						? 'bg-[#212126] text-[#2b2b2e]'
						: 'bg-transparent text-white hover:bg-[#212126] hover:text-[#2b2b2e]'
				}
        ${className ?? ''}
      `}
			{...props}
		>
			{children}
		</button>
	)
}
