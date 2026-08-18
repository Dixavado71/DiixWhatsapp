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
</style>
