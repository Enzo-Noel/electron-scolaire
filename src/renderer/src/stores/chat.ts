import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gun, generateMessageId, type ChatMessage } from '../gun'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const currentRoom = ref<string>('general')
  const isTyping = ref<Map<string, boolean>>(new Map())

  // Messages filtrés par room actuelle
  const currentRoomMessages = computed(() => {
    return messages.value
      .filter((msg) => msg.room === currentRoom.value)
      .sort((a, b) => a.timestamp - b.timestamp)
  })

  // Ajouter un message
  function addMessage(message: ChatMessage) {
    const existingIndex = messages.value.findIndex((m) => m.id === message.id)
    if (existingIndex === -1) {
      messages.value.push(message)
    }
  }

  // Envoyer un message
  async function sendMessage(text: string, username: string) {
    const messageId = generateMessageId()
    const message: ChatMessage = {
      id: messageId,
      text,
      username,
      timestamp: Date.now(),
      room: currentRoom.value
    }

    try {
      gun.get(`chat/rooms/${message.room}/messages`).set(message)
      addMessage(message)
    } catch (error) {
      console.error('Erreur envoi message:', error)
      throw error
    }
  }

  // S'abonner aux messages d'une room
  function subscribeToRoom(roomName: string) {
    currentRoom.value = roomName

    const unsubscribe = gun
      .get(`chat/rooms/${roomName}/messages`)
      .map()
      .on((message: any) => {
        if (message) {
          addMessage(message as ChatMessage)
        }
      })

    return () => unsubscribe.off()
  }

  // Définir l'état de frappe
  function setUserTyping(username: string, typing: boolean) {
    gun.get(`chat/rooms/${currentRoom.value}/typing`).get(username).put({
      typing,
      timestamp: Date.now()
    })
  }

  // S'abonner aux indicateurs de frappe
  function subscribeToTyping(roomName: string) {
    const unsubscribe = gun
      .get(`chat/rooms/${roomName}/typing`)
      .map()
      .on((data: any) => {
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([username, typing]) => {
            isTyping.value.set(username, typing as boolean)
          })
        }
      })

    return () => unsubscribe.off()
  }

  // Obtenir les utilisateurs en train de taper
  const typingUsers = computed(() => {
    return Array.from(isTyping.value.entries())
      .filter(([_, typing]) => typing)
      .map(([username]) => username)
  })

  // Changer de room
  function changeRoom(roomName: string) {
    currentRoom.value = roomName
  }

  // Nettoyer les messages (optionnel)
  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    currentRoom,
    currentRoomMessages,
    typingUsers,
    addMessage,
    sendMessage,
    subscribeToRoom,
    subscribeToTyping,
    setUserTyping,
    changeRoom,
    clearMessages
  }
})
