<template>
  <div class="titlebar">
    <div class="titlebar-drag-region">
      <div class="titlebar-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="app-icon">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>P2P Chat</span>
      </div>
    </div>

    <div class="titlebar-controls">
      <button class="titlebar-button minimize" @click="minimizeWindow" title="Réduire">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect width="10" height="1" x="1" y="6" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button maximize" @click="maximizeWindow" title="Agrandir">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button close" @click="closeWindow" title="Fermer">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path stroke="currentColor" stroke-width="1" d="M1 1 L11 11 M11 1 L1 11"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const minimizeWindow = () => {
  window.p2pChat.window.minimize()
}

const maximizeWindow = () => {
  window.p2pChat.window.maximize()
}

const closeWindow = () => {
  window.p2pChat.window.close()
}
</script>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: #1e1e1e;
  border-bottom: 1px solid #2d2d2d;
  user-select: none;
  -webkit-app-region: drag;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.titlebar-drag-region {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 12px;
}

.titlebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #a0a0a0;
}

.app-icon {
  width: 14px;
  height: 14px;
  color: #667eea;
}

.titlebar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.titlebar-button {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: #a0a0a0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, color 0.15s;
}

.titlebar-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.titlebar-button.close:hover {
  background: #e81123;
  color: #ffffff;
}

.titlebar-button svg {
  pointer-events: none;
}
</style>
