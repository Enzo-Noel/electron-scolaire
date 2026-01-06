import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Contact {
  id: string
  name: string // Nom personnalisé du contact
  address: string // URL complète du serveur (ex: http://192.168.1.100:8765/gun)
  lastUsed?: number // Timestamp de dernière utilisation
  favorite?: boolean // Contact favori
}

const STORAGE_KEY = 'p2p-chat-contacts'

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>([])

  // Charger les contacts depuis localStorage
  function loadContacts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        contacts.value = JSON.parse(stored)
        console.log('[Contacts] Contacts chargés:', contacts.value.length)
      }
    } catch (error) {
      console.error('[Contacts] Erreur chargement:', error)
      contacts.value = []
    }
  }

  // Sauvegarder les contacts dans localStorage
  function saveContacts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
      console.log('[Contacts] Contacts sauvegardés:', contacts.value.length)
    } catch (error) {
      console.error('[Contacts] Erreur sauvegarde:', error)
    }
  }

  // Ajouter un nouveau contact
  function addContact(name: string, address: string, favorite = false): Contact {
    const newContact: Contact = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      address: address.trim(),
      lastUsed: Date.now(),
      favorite
    }

    contacts.value.push(newContact)
    saveContacts()

    console.log('[Contacts] Contact ajouté:', newContact)
    return newContact
  }

  // Mettre à jour un contact existant
  function updateContact(id: string, updates: Partial<Omit<Contact, 'id'>>): boolean {
    const index = contacts.value.findIndex((c) => c.id === id)
    if (index === -1) return false

    contacts.value[index] = {
      ...contacts.value[index],
      ...updates
    }

    saveContacts()
    console.log('[Contacts] Contact mis à jour:', contacts.value[index])
    return true
  }

  // Supprimer un contact
  function deleteContact(id: string): boolean {
    const index = contacts.value.findIndex((c) => c.id === id)
    if (index === -1) return false

    const deleted = contacts.value.splice(index, 1)[0]
    saveContacts()

    console.log('[Contacts] Contact supprimé:', deleted)
    return true
  }

  // Marquer un contact comme utilisé récemment
  function markAsUsed(id: string) {
    const contact = contacts.value.find((c) => c.id === id)
    if (contact) {
      contact.lastUsed = Date.now()
      saveContacts()
    }
  }

  // Basculer le statut favori
  function toggleFavorite(id: string): boolean {
    const contact = contacts.value.find((c) => c.id === id)
    if (!contact) return false

    contact.favorite = !contact.favorite
    saveContacts()

    console.log('[Contacts] Favori basculé:', contact)
    return contact.favorite
  }

  // Trouver un contact par adresse
  function findByAddress(address: string): Contact | undefined {
    return contacts.value.find((c) => c.address === address)
  }

  // Contacts triés (favoris en premier, puis par dernière utilisation)
  const sortedContacts = computed(() => {
    return [...contacts.value].sort((a, b) => {
      // Favoris en premier
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1

      // Puis par dernière utilisation
      const aTime = a.lastUsed || 0
      const bTime = b.lastUsed || 0
      return bTime - aTime
    })
  })

  // Contacts favoris uniquement
  const favoriteContacts = computed(() => {
    return contacts.value.filter((c) => c.favorite)
  })

  // Initialiser les contacts au démarrage
  loadContacts()

  return {
    contacts,
    sortedContacts,
    favoriteContacts,
    addContact,
    updateContact,
    deleteContact,
    markAsUsed,
    toggleFavorite,
    findByAddress,
    loadContacts,
    saveContacts
  }
})
