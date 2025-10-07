// Layout.tsx
import type { PropsWithChildren } from 'react'
import { Sidebar } from './sidebar/Sidebar'

export function Layout({ children }: PropsWithChildren) {
	return (
		<div className='bg-[#131316] fixed inset-0 top-1 bottom-1 right-1 left-1 rounded-xl border border-[#2b2b2e] flex overflow-hidden'>
			<Sidebar />
			<div className='flex-1 w-full h-full overflow-auto md:ml-0 pt-12 md:pt-0'>
				{children}
			</div>
		</div>
	)
}
