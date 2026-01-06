<template>
  <div class="app-container">
    <TitleBar />
    <div class="app-content">
      <LoginView v-if="!userStore.isLoggedIn" @login="handleLogin" />
      <ChatRoom v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUserStore } from './stores/user'
import TitleBar from './components/TitleBar.vue'
import LoginView from './components/LoginView.vue'
import ChatRoom from './components/ChatRoom.vue'

const userStore = useUserStore()

let unsubscribeUsers: (() => void) | null = null

const handleLogin = async (username: string) => {
  await userStore.login(username)
  setupSubscriptions()
}

const setupSubscriptions = () => {
  // S'abonner aux utilisateurs
  unsubscribeUsers = userStore.subscribeToUsers()
}

onMounted(() => {
  // Si déjà connecté, configurer les abonnements
  if (userStore.isLoggedIn) {
    setupSubscriptions()
  }
})

onUnmounted(() => {
  // Nettoyer les abonnements
  if (unsubscribeUsers) unsubscribeUsers()
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  overflow: hidden;
  margin-top: 32px; /* Hauteur de la titlebar */
}
</style>
