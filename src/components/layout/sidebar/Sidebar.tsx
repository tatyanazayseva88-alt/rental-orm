// Sidebar.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button/Button'
import {
	ClockFading,
	FileArchive,
	UserPen,
	Warehouse,
	Menu,
	ArrowLeft,
	Pencil
} from 'lucide-react'
import { useLocation } from 'wouter'

const links = [
	{ label: 'Заявка', icon: <UserPen size={20} />, path: '/' },
	{ label: 'Аренда', icon: <ClockFading size={20} />, path: '/rent' },
	{ label: 'Склад', icon: <Warehouse size={20} />, path: '/warehouse' },
	{ label: 'Архив', icon: <FileArchive size={20} />, path: '/archive' },
	{ label: 'Редактирование', icon: <Pencil size={20} />, path: '/editing' }
]

export function Sidebar() {
	const [location, setLocation] = useLocation()
	const [open, setOpen] = useState(false)

	return (
		<>
			{/* Mobile header */}
			<div className='md:hidden fixed top-0 left-0 right-0 h-12 bg-[#131316] flex items-center z-40 px-4'>
				{!open ? (
					<button onClick={() => setOpen(true)}>
						<Menu size={24} className='text-white' />
					</button>
				) : null}
				<h1 className='absolute left-1/2 transform -translate-x-1/2 text-white text-lg font-roboto'>
					Аренда CRM
				</h1>
			</div>

			{/* Mobile menu overlay */}
			{open && (
				<div className='fixed inset-0 bg-[#131316] z-50 flex flex-col md:hidden'>
					{/* Header внутри overlay */}
					<div className='flex items-center h-12 px-4'>
						<button onClick={() => setOpen(false)}>
							<ArrowLeft size={24} className='text-white' />
						</button>
						<h1 className='absolute left-1/2 transform -translate-x-1/2 text-white text-lg font-roboto'>
							Аренда CRM
						</h1>
					</div>
					{/* Навигация сразу под header */}
					<div className='flex flex-col p-4 gap-2'>
						{links.map(link => (
							<Button
								key={link.label}
								active={location === link.path}
								onClick={() => {
									setLocation(link.path)
									setOpen(false)
								}}
								className='w-full justify-start'
							>
								{link.icon && <span className='mr-3'>{link.icon}</span>}
								{link.label}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Desktop sidebar */}
			<nav className='hidden md:flex w-72 flex-shrink-0 h-full flex-col border-r border-r-[#2b2b2e]'>
				<h1 className='text-white pt-5 text-2xl font-roboto flex justify-center'>
					Аренда CRM
				</h1>
				<ul className='flex flex-col gap-1 select-none pt-5 px-2'>
					{links.map(link => (
						<li key={link.label}>
							<Button
								active={location === link.path}
								onClick={() => setLocation(link.path)}
								className='w-full justify-start'
							>
								{link.icon && <span className='mr-3'>{link.icon}</span>}
								{link.label}
							</Button>
						</li>
					))}
				</ul>
			</nav>
		</>
	)
}
