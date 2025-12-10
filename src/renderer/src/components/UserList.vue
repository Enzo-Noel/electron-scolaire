<template>
  <div class="user-list-container">
    <div class="section-header">
      <h3>Utilisateurs</h3>
      <span class="user-count">{{ userStore.onlineCount }}</span>
    </div>

    <div class="user-list">
      <div
        v-for="user in userStore.onlineUsers"
        :key="user.username"
        class="user-item"
        :class="{ 'current-user': user.username === userStore.currentUser }"
      >
        <div class="user-avatar">
          <div class="avatar-circle">{{ getInitials(user.username) }}</div>
          <div class="online-dot" :class="{ online: user.online }"></div>
        </div>
        <div class="user-info">
          <div class="user-name">
            {{ user.username }}
            <span v-if="user.username === userStore.currentUser" class="you-badge">(vous)</span>
          </div>
          <div class="user-status">{{ user.online ? 'En ligne' : 'Hors ligne' }}</div>
        </div>
      </div>

      <div v-if="userStore.onlineUsers.length === 0" class="empty-users">
        <p>Aucun utilisateur en ligne</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const getInitials = (username: string): string => {
  if (!username) return '?'
  const parts = username.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.user-list-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a0a0a0;
}

.user-count {
  background: #3d3d3d;
  color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.user-list {
  overflow-y: auto;
  padding-bottom: 8px;
  flex: 1;
}

.user-list::-webkit-scrollbar {
  width: 4px;
}

.user-list::-webkit-scrollbar-track {
  background: transparent;
}

.user-list::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 2px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #2d2d2d;
}

.user-item.current-user {
  background: #2d2d2d;
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.current-user .avatar-circle {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #252525;
  background: #707070;
}

.online-dot.online {
  background: #4caf50;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.you-badge {
  font-size: 11px;
  font-weight: 400;
  color: #4caf50;
}

.user-status {
  font-size: 12px;
  color: #707070;
}

.empty-users {
  padding: 20px;
  text-align: center;
  color: #707070;
  font-size: 13px;
}

.empty-users p {
  margin: 0;
}
</style>
