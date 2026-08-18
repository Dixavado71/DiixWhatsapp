// Vuetify configuration with Dark Cyber theme (Blue, Cyan, Purple)
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const darkCyberTheme = {
  dark: true,
  colors: {
    background: '#0a0e1a',
    surface: '#121826',
    'surface-variant': '#1a2332',
    primary: '#00bcd4',      // Cyan
    'primary-darken-1': '#0097a7',
    secondary: '#7c4dff',    // Purple
    'secondary-darken-1': '#651fff',
    accent: '#00e5ff',       // Bright Cyan
    error: '#ff5252',
    warning: '#ffb74d',
    info: '#4fc3f7',
    success: '#66bb6a',
    text: '#e0e0e0',
    'text-secondary': '#b0b0b0',
    border: '#2a3447',
    'on-background': '#e0e0e0',
    'on-surface': '#e0e0e0',
    'on-primary': '#000000',
    'on-secondary': '#ffffff',
    'on-accent': '#000000',
  },
  variables: {
    'border-color': '#2a3447',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#ffffff',
    'theme-code': '#1a2332',
    'theme-on-code': '#e0e0e0',
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'darkCyber',
    themes: {
      darkCyber: darkCyberTheme
    }
  },
  defaults: {
    VBtn: {
      variant: 'flat',
      rounded: 'lg'
    },
    VCard: {
      variant: 'tonal',
      rounded: 'lg'
    },
    VTextField: {
      variant: 'outlined',
      color: 'primary'
    },
    VSelect: {
      variant: 'outlined',
      color: 'primary'
    }
  }
})
