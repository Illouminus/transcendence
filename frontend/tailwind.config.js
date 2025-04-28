/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{js,ts}",
		'./public/pages/**/*.html',
	],
	theme: {
		extend: {
			animation: {
			  'fade-in-up': 'fadeInUp 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
			  'fade-in-down': 'fadeInDown 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
			  'bounce-trophy': 'bounceTrophy 1.2s 1',
			  'bounce-slow': 'bounce 2s infinite',
			  'spin-slow': 'spin 2.5s linear infinite',
			  'dot-bounce1': 'dotBounce 1.2s infinite 0s',
			  'dot-bounce2': 'dotBounce 1.2s infinite 0.2s',
			  'dot-bounce3': 'dotBounce 1.2s infinite 0.4s',
			  'pulse-slow': 'pulse 2.5s infinite',
			},
			keyframes: {
			  fadeInUp: {
				'0%': { opacity: 0, transform: 'translateY(40px)' },
				'100%': { opacity: 1, transform: 'translateY(0)' },
			  },
			  fadeInDown: {
				'0%': { opacity: 0, transform: 'translateY(-40px)' },
				'100%': { opacity: 1, transform: 'translateY(0)' },
			  },
			  bounceTrophy: {
				'0%, 100%': { transform: 'translateY(0)' },
				'30%': { transform: 'translateY(-30px) scale(1.1)' },
				'50%': { transform: 'translateY(-10px) scale(1.05)' },
				'70%': { transform: 'translateY(-20px) scale(1.08)' },
			  },
			  dotBounce: {
				'0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.3 },
				'40%': { transform: 'translateY(-10px)', opacity: 1 },
			  },
			  pulse: {
				'0%, 100%': { opacity: 1 },
				'50%': { opacity: 0.5 },
			  },
			}
		  }
	  },
	plugins: [],
	safelist: [
		'animate-dot-bounce1',
		'animate-dot-bounce2',
		'animate-dot-bounce3',
		'animate-spin-slow',
		'animate-fade-in-up',
		'animate-fade-in-down',
		'animate-pulse-slow',
	  ],
}