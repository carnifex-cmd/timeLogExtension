<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <AppContent />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { themeOverrides } from '../styles/theme.js'
import AppContent from './AppContent.vue'
</script>

<style>
/* Import global styles */
@import '../styles/global.css';

.app-container {
  min-height: 100vh;
  background: white;
  padding: 16px;
}

/* Override some Naive UI defaults for our extension */
body {
  margin: 0;
  padding: 0;
  background: transparent;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 24, 146, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 24, 146, 0.5);
}

/* Animation for smooth transitions */
.app-container > * {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>