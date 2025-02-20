/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'bounce-once': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'parade-in': {
					'0%': {
						transform: 'translateY(20px) scale(0.5) rotate(10deg)',
						opacity: '0',
					},
					'50%': {
						transform: 'translateY(-10px) scale(1.1) rotate(-5deg)',
					},
					'100%': {
						transform: 'translateY(0) scale(1) rotate(0deg)',
						opacity: '1',
					},
				},
				'parade-in-bounce': {
					'0%': {
						transform: 'translateY(20px) scale(0.5) rotate(10deg)',
						opacity: '0',
					},
					'50%': {
						transform: 'translateY(-15px) scale(1.1) rotate(-5deg)',
						opacity: '1',
					},
					'75%': {
						transform: 'translateY(-5px) scale(1) rotate(2deg)',
						opacity: '1',
					},
					'100%': {
						transform: 'translateY(0) scale(1) rotate(0deg)',
						opacity: '1',
					},
				},
				'float-leaf': {
					'0%': {
						transform: 'translateY(-10px) rotate(0deg)',
						opacity: '0',
					},
					'50%': {
						transform: 'translateY(40vh) rotate(180deg)',
						opacity: '1',
					},
					'100%': {
						transform: 'translateY(90vh) rotate(360deg)',
						opacity: '0',
					},
				},
				'slide-in': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'bounce-once': 'bounce-once 1s ease-in-out',
				'parade-in': 'parade-in 0.8s ease-out forwards',
				'parade-in-bounce':
					'parade-in-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
				'float-leaf': 'float-leaf 10s linear infinite',
				'slide-in': 'slide-in 0.5s ease-out forwards',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
