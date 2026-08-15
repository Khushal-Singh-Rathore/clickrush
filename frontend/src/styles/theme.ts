/**
 * Centralized Dynamic Theme Token Configuration
 * Easily update color hex codes and font families here to re-theme the entire application.
 */

export const themeTokens = {
  palette: {
    cream: '#F8F1EA',
    sand: '#E2CFC0',
    clay: '#C49C85',
    coffee: '#7B5A49',
    espresso: '#2A1F1A',
  },
  fonts: {
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    heading: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
};

export type ThemeTokens = typeof themeTokens;
