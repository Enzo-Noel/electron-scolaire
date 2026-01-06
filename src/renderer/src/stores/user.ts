import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gun, SEA, type User, type KeyPair } from '../gun'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<string>('')
  const users = ref<Map<string, User>>(new Map())
  const isLoggedIn = ref<boolean>(false)
  const refreshTrigger = ref(0) // Pour forcer le recalcul de onlineUsers
  const keyPair = ref<KeyPair | null>(null) // Paire de clés de l'utilisateur actuel

  // Liste des utilisateurs en ligne
  const onlineUsers = computed(() => {
    // Force le recalcul en lisant refreshTrigger
    refreshTrigger.value

    const now = Date.now()
    const TIMEOUT = 60000 // 60 secondes (2x le heartbeat de 30s)

    return Array.from(users.value.values()).filter((user) => {
      // Considérer en ligne si:
      // - Marqué online ET
      // - lastSeen récent (moins de 60 secondes)
      return user.online && user.lastSeen && now - user.lastSeen < TIMEOUT
    })
  })

  // Nombre d'utilisateurs en ligne
  const onlineCount = computed(() => onlineUsers.value.length)

  // Se connecter
  async function login(username: string) {
    if (!username || username.trim() === '') {
      throw new Error("Le nom d'utilisateur ne peut pas être vide")
    }

    try {
      // Générer une paire de clés pour l'utilisateur
      const pair = await SEA.pair()
      keyPair.value = pair as KeyPair

      const user: User = {
        username: username.trim(),
        online: true,
        lastSeen: Date.now(),
        publicKey: pair.pub // Stocker la clé publique
      }

      gun.get('chat/users').get(user.username).put(user)

      currentUser.value = username.trim()
      isLoggedIn.value = true

      console.log('[Crypto] Paire de clés générée pour', username.trim())

      // Mettre à jour le statut en ligne périodiquement
      startHeartbeat()
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      throw error
    }
  }

  // Se déconnecter
  async function logout() {
    if (currentUser.value) {
      try {
        gun.get('chat/users').get(currentUser.value).put({ online: false, lastSeen: Date.now() })
        currentUser.value = ''
        isLoggedIn.value = false
        keyPair.value = null // Effacer la paire de clés
        stopHeartbeat()
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }
  }

  // Heartbeat pour maintenir le statut en ligne
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let refreshInterval: ReturnType<typeof setInterval> | null = null

  function startHeartbeat() {
    if (heartbeatInterval) return

    // Mettre à jour le statut toutes les 30 secondes
    heartbeatInterval = setInterval(() => {
      if (currentUser.value) {
        gun
          .get('chat/users')
          .get(currentUser.value)
          .put({ online: true, lastSeen: Date.now() })
      }
    }, 30000)

    // Rafraîchir la liste des utilisateurs en ligne toutes les 10 secondes
    refreshInterval = setInterval(() => {
      refreshTrigger.value++
    }, 10000)
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // S'abonner aux utilisateurs
  function subscribeToUsers() {
    const unsubscribe = gun
      .get('chat/users')
      .map()
      .on((userData: any, username: string) => {
        if (userData && typeof userData === 'object' && username) {
          users.value.set(username, userData as User)
        }
      })

    return () => unsubscribe.off()
  }

  // Ajouter ou mettre à jour un utilisateur
  function updateUser(username: string, userData: User) {
    users.value.set(username, userData)
  }

  // Obtenir un utilisateur
  function getUser(username: string): User | undefined {
    return users.value.get(username)
  }

  return {
    currentUser,
    users,
    isLoggedIn,
    onlineUsers,
    onlineCount,
    keyPair,
    login,
    logout,
    subscribeToUsers,
    updateUser,
    getUser
  }
})
