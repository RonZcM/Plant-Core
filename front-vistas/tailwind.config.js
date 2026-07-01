/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Colores dinámicos usados en el panel de registros de Operaciones
    {
      pattern: /(bg|text|border|border-l|from)-(green|blue|red|purple|amber|teal|gray)-(50|100|200|400|600|700)/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

