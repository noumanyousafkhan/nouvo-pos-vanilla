/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nouvo: {
          green: {
            DEFAULT: '#1B4D3E',
            light: '#7BA88C',
            dark: '#0F2E24',
            50: '#E8F0EC',
            100: '#D1E1D9'
          },
          cream: {
            DEFAULT: '#F5F1E8',
            dark: '#E8E3D6'
          },
          salmon: '#F4A9A8',
          gold: '#D4A84B',
          red: '#E85A5A',
          yellow: '#F5C842',
          ink: '#1A1A1A',
          gray: {
            DEFAULT: '#8A8A8A',
            light: '#B0B0B0',
            border: '#D0D0D0'
          }
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '16px',
        button: '10px',
        input: '10px'
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10)',
        focus: '0 0 0 3px rgba(27, 77, 62, 0.08)'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      }
    }
  },
  plugins: []
}
