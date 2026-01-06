<template>
  <div class="contacts-container">
    <!-- Header avec bouton d'ajout -->
    <div class="contacts-header">
      <h3>Contacts</h3>
      <button @click="showAddModal = true" class="add-contact-btn" title="Ajouter un contact">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Liste des contacts -->
    <div v-if="contactsStore.sortedContacts.length === 0" class="empty-state">
      <p>Aucun contact enregistré</p>
      <p class="hint">Cliquez sur + pour ajouter un contact</p>
    </div>

    <div v-else class="contacts-list">
      <div
        v-for="contact in contactsStore.sortedContacts"
        :key="contact.id"
        class="contact-item"
        :class="{ favorite: contact.favorite }"
      >
        <div class="contact-main" @click="$emit('select-contact', contact)">
          <div class="contact-icon">
            <svg v-if="contact.favorite" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-address">{{ contact.address }}</div>
          </div>
        </div>

        <div class="contact-actions">
          <button
            @click.stop="toggleFavorite(contact.id)"
            class="action-btn"
            :class="{ active: contact.favorite }"
            :title="contact.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" :fill="contact.favorite ? 'currentColor' : 'none'" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            @click.stop="editContact(contact)"
            class="action-btn"
            title="Modifier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click.stop="confirmDelete(contact)"
            class="action-btn delete"
            title="Supprimer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout/édition -->
    <AddContactModal
      v-if="showAddModal || editingContact"
      :contact="editingContact"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Modal de confirmation de suppression -->
    <div v-if="contactToDelete" class="modal-overlay" @click="contactToDelete = null">
      <div class="modal-content delete-modal" @click.stop>
        <h3>Supprimer le contact ?</h3>
        <p>Êtes-vous sûr de vouloir supprimer <strong>{{ contactToDelete.name }}</strong> ?</p>
        <div class="modal-actions">
          <button @click="contactToDelete = null" class="btn-cancel">Annuler</button>
          <button @click="handleDelete" class="btn-delete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useContactsStore, type Contact } from '../stores/contacts'
import AddContactModal from './AddContactModal.vue'

const emit = defineEmits<{
  'select-contact': [contact: Contact]
}>()

const contactsStore = useContactsStore()
const showAddModal = ref(false)
const editingContact = ref<Contact | null>(null)
const contactToDelete = ref<Contact | null>(null)

const toggleFavorite = (id: string) => {
  contactsStore.toggleFavorite(id)
}

const editContact = (contact: Contact) => {
  editingContact.value = contact
}

const confirmDelete = (contact: Contact) => {
  contactToDelete.value = contact
}

const handleDelete = () => {
  if (contactToDelete.value) {
    contactsStore.deleteContact(contactToDelete.value.id)
    contactToDelete.value = null
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingContact.value = null
}

const handleSave = (data: { name: string; address: string; favorite: boolean }) => {
  if (editingContact.value) {
    // Mise à jour
    contactsStore.updateContact(editingContact.value.id, data)
  } else {
    // Ajout
    contactsStore.addContact(data.name, data.address, data.favorite)
  }
  closeModal()
}
</script>

<style scoped>
.contacts-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contacts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #3d3d3d;
}

.contacts-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-contact-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.add-contact-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-contact-btn:active {
  transform: scale(0.95);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  color: #a0a0a0;
}

.empty-state p {
  margin: 4px 0;
  font-size: 14px;
}

.hint {
  font-size: 12px !important;
  color: #707070 !important;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.contacts-list::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-track {
  background: transparent;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 3px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  transition: all 0.2s;
}

.contact-item:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
}

.contact-item.favorite {
  border-color: #667eea;
  background: #2d2d3d;
}

.contact-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 0;
}

.contact-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3d3d3d;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  flex-shrink: 0;
}

.contact-item.favorite .contact-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-address {
  font-size: 11px;
  color: #a0a0a0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.contact-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid #3d3d3d;
  color: #a0a0a0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #3d3d3d;
  color: #e0e0e0;
}

.action-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #ffffff;
}

.action-btn.delete:hover {
  background: #ff4444;
  border-color: #ff4444;
  color: #ffffff;
}

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
}

.modal-content {
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
}

.delete-modal h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #e0e0e0;
}

.delete-modal p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.5;
}

.delete-modal strong {
  color: #e0e0e0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-delete {
  padding: 10px 20px;
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

.btn-delete {
  background: #ff4444;
  color: #ffffff;
}

.btn-delete:hover {
  background: #ff5555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
}
</style>
