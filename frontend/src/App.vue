<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
// App root component
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', sans-serif !important;
}

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #121826;
}

::-webkit-scrollbar-thumb {
  background: #2a3447;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3a4557;
}

/* Gradient backgrounds */
.gradient-primary {
  background: linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%);
}

.gradient-surface {
  background: linear-gradient(135deg, #121826 0%, #1a2332 100%);
}

/* Glass morphism effect */
.glass-card {
  background: rgba(18, 24, 38, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(42, 52, 71, 0.3);
}

/* Animation classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-20px);
}

.slide-leave-to {
  transform: translateX(20px);
}
</style>
