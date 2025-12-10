<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">P2P Chat Décentralisé</h1>
      <p class="login-subtitle">Propulsé par Gun.js</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Entrez votre pseudo..."
            autocomplete="off"
            required
            :disabled="isLoading"
            @input="error = ''"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="login-button" :disabled="isLoading || !username.trim()">
          <span v-if="isLoading">Connexion...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <div class="login-info">
        <p>Aucune inscription requise</p>
        <p>Vos messages sont décentralisés et synchronisés en temps réel</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  login: [username: string]
}>()

const username = ref('')
const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!username.value.trim()) {
    error.value = 'Veuillez entrer un nom d\'utilisateur'
    return
  }

  if (username.value.trim().length < 2) {
    error.value = 'Le nom doit contenir au moins 2 caractères'
    return
  }

  if (username.value.trim().length > 20) {
    error.value = 'Le nom ne peut pas dépasser 20 caractères'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    emit('login', username.value.trim())
  } catch (err) {
    error.value = 'Erreur lors de la connexion. Veuillez réessayer.'
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #2d2d2d;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 90%;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
  color: #ffffff;
}

.login-subtitle {
  font-size: 14px;
  color: #a0a0a0;
  text-align: center;
  margin: 0 0 32px 0;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ff4444;
  color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-info {
  text-align: center;
  color: #a0a0a0;
  font-size: 13px;
}

.login-info p {
  margin: 8px 0;
}
</style>
