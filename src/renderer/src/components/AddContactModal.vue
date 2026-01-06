<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ contact ? 'Modifier le contact' : 'Nouveau contact' }}</h3>
        <button @click="$emit('close')" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="contact-form">
        <div class="form-group">
          <label for="contact-name">Nom du contact *</label>
          <input
            id="contact-name"
            v-model="form.name"
            type="text"
            placeholder="Ex: Serveur Maison, Bureau, etc."
            required
            autocomplete="off"
          />
        </div>

        <div class="form-group">
          <label for="contact-address">Adresse du serveur *</label>
          <input
            id="contact-address"
            v-model="form.address"
            type="text"
            placeholder="Ex: http://192.168.1.100:8765/gun"
            required
            autocomplete="off"
          />
          <span class="hint">Format: http://IP:PORT/gun</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="form.favorite"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">
              <svg width="16" height="16" viewBox="0 0 24 24" :fill="form.favorite ? 'currentColor' : 'none'" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Ajouter aux favoris
            </span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            Annuler
          </button>
          <button type="submit" class="btn-save">
            {{ contact ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Contact } from '../stores/contacts'

const props = defineProps<{
  contact?: Contact | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; address: string; favorite: boolean }]
}>()

const form = ref({
  name: '',
  address: '',
  favorite: false
})

const handleSubmit = () => {
  if (!form.value.name.trim() || !form.value.address.trim()) return

  emit('save', {
    name: form.value.name.trim(),
    address: form.value.address.trim(),
    favorite: form.value.favorite
  })
}

// Pré-remplir le formulaire si on édite un contact
onMounted(() => {
  if (props.contact) {
    form.value.name = props.contact.name
    form.value.address = props.contact.address
    form.value.favorite = props.contact.favorite || false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #3d3d3d;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #3d3d3d;
  color: #e0e0e0;
}

.contact-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input[type="text"]::placeholder {
  color: #707070;
}

.hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #a0a0a0;
}

.checkbox-group {
  margin-top: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 12px;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  transition: all 0.2s;
}

.checkbox-label:hover {
  border-color: #667eea;
  background: #252525;
}

.checkbox-input {
  display: none;
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #e0e0e0;
  font-weight: 500;
}

.checkbox-text svg {
  color: #a0a0a0;
  transition: all 0.2s;
}

.checkbox-input:checked + .checkbox-text svg {
  color: #667eea;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #3d3d3d;
  color: #e0e0e0;
}

.btn-cancel:hover {
  background: #4a4a4a;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:active {
  transform: translateY(0);
}
</style>
