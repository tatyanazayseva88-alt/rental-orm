import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler']]
			}
		}),
		tailwindcss(),
		tsconfigPaths()
	],
	server: {
		allowedHosts: ['fd023de43480.ngrok-free.app']
	}
})
