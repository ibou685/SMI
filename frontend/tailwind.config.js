// frontend/tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        smi: {
          primary: '#DC2626',    // Red SMI
          secondary: '#1F2937',  // Dark gray
          light: '#F3F4F6'       // Light gray
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
}
