// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        popupIn: {
          '0%': { opacity: '0', transform: 'scale(0.3) rotate(-10deg)', filter: 'blur(10px)' },
          '60%': { transform: 'scale(1.05) rotate(2deg)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        popupOut: {
          '0%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(0.1)', filter: 'blur(10px)' },
        },
      },
      animation: {
        popupIn: 'popupIn 0.5s ease-out forwards',
        popupOut: 'popupOut 0.4s ease-in forwards',
      },
    },
  },
};
