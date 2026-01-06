import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gun, SEA, generateMessageId, type ChatMessage } from '../gun'
import { useFileTransferStore } from './fileTransfer'

// Secret partagé pour le chiffrement (tous les utilisateurs connectés au même serveur)
const CHAT_SECRET = 'p2p-chat-shared-secret-v1'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isTyping = ref<Map<string, boolean>>(new Map())
  const fileTransferStore = useFileTransferStore()

  // Messages triés par timestamp
  const sortedMessages = computed(() => {
    return messages.value.sort((a, b) => a.timestamp - b.timestamp)
  })

  // Ajouter un message
  function addMessage(message: ChatMessage) {
    const existingIndex = messages.value.findIndex((m) => m.id === message.id)
    if (existingIndex === -1) {
      messages.value.push(message)
    }
  }

  // Envoyer un message
  async function sendMessage(text: string, username: string, userKeyPair: any) {
    if (!userKeyPair) {
      throw new Error('Paire de clés requise pour envoyer des messages')
    }

    const messageId = generateMessageId()

    try {
      // Chiffrer le message avec le secret partagé
      const encryptedText = await SEA.encrypt(text, CHAT_SECRET)

      const message: ChatMessage = {
        id: messageId,
        text: encryptedText,
        username,
        timestamp: Date.now()
      }

      gun.get('chat/messages').set(message)

      // Ajouter le message déchiffré localement
      const decryptedMessage: ChatMessage = {
        ...message,
        text: text // On garde le texte en clair localement
      }
      addMessage(decryptedMessage)

      console.log('[Crypto] Message chiffré et envoyé')
    } catch (error) {
      console.error('Erreur envoi message:', error)
      throw error
    }
  }

  // Envoyer un message avec fichier
  async function sendMessageWithFile(
    text: string,
    file: File,
    username: string,
    userKeyPair: any
  ) {
    if (!userKeyPair) {
      throw new Error('Paire de clés requise pour envoyer des messages')
    }

    const messageId = generateMessageId()

    try {
      // Préparer le fichier (chiffrement, miniature, etc.)
      const fileTransfer = await fileTransferStore.prepareFile(file, messageId)

      // Chiffrer le texte si présent
      let encryptedText = ''
      if (text.trim()) {
        encryptedText = await SEA.encrypt(text, CHAT_SECRET)
      }

      // Sérialiser fileTransfer en JSON pour GunDB
      const fileTransferJson = JSON.stringify(fileTransfer)

      const message: any = {
        id: messageId,
        text: encryptedText,
        username,
        timestamp: Date.now(),
        fileTransferJson // Stocker en JSON
      }

      gun.get('chat/messages').set(message)

      // Ajouter le message déchiffré localement
      const decryptedMessage: ChatMessage = {
        id: messageId,
        text: text.trim(),
        username,
        timestamp: Date.now(),
        fileTransfer // Objet complet localement
      }
      addMessage(decryptedMessage)

      console.log('[Crypto] Message avec fichier chiffré et envoyé')
    } catch (error) {
      console.error('Erreur envoi message avec fichier:', error)
      throw error
    }
  }

  // S'abonner aux messages
  function subscribeToMessages() {
    const unsubscribe = gun
      .get('chat/messages')
      .map()
      .on(async (encryptedMessage: any) => {
        // Vérifier que le message est valide et complet
        if (
          !encryptedMessage ||
          typeof encryptedMessage !== 'object' ||
          !encryptedMessage.id ||
          !encryptedMessage.username ||
          !encryptedMessage.timestamp
        ) {
          return // Ignorer les messages incomplets ou invalides
        }

        // Accepter les messages avec texte OU avec fichier
        if (encryptedMessage.text !== undefined || encryptedMessage.fileTransferJson) {
          try {
            let decryptedText = ''

            // Déchiffrer le texte si présent
            if (encryptedMessage.text && typeof encryptedMessage.text === 'string' && encryptedMessage.text.trim()) {
              decryptedText = await SEA.decrypt(encryptedMessage.text, CHAT_SECRET)
              if (!decryptedText) {
                decryptedText = '[Message chiffré - impossible de déchiffrer]'
              }
            }

            // Désérialiser fileTransfer si présent
            let fileTransfer = undefined
            if (encryptedMessage.fileTransferJson) {
              try {
                fileTransfer = JSON.parse(encryptedMessage.fileTransferJson)
              } catch (e) {
                console.error('[File] Erreur de parsing JSON:', e)
              }
            }

            const decryptedMessage: ChatMessage = {
              id: encryptedMessage.id,
              username: encryptedMessage.username,
              timestamp: encryptedMessage.timestamp,
              text: decryptedText,
              fileTransfer
            }

            addMessage(decryptedMessage)
            console.log('[Crypto] Message déchiffré reçu', {
              hasText: !!decryptedText,
              hasFile: !!fileTransfer
            })
          } catch (error) {
            console.error('[Crypto] Erreur de déchiffrement:', error)
          }
        }
      })

    return () => unsubscribe.off()
  }

  // Définir l'état de frappe
  function setUserTyping(username: string, typing: boolean) {
    gun.get('chat/typing').get(username).put({
      typing,
      timestamp: Date.now()
    })
  }

  // S'abonner aux indicateurs de frappe
  function subscribeToTyping() {
    const unsubscribe = gun
      .get('chat/typing')
      .map()
      .on((data: any, username: string) => {
        if (data && typeof data === 'object' && username) {
          // data contient { typing: boolean, timestamp: number }
          isTyping.value.set(username, data.typing === true)
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

  // Nettoyer les messages (optionnel)
  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    sortedMessages,
    typingUsers,
    addMessage,
    sendMessage,
    sendMessageWithFile,
    subscribeToMessages,
    subscribeToTyping,
    setUserTyping,
    clearMessages
  }
})
