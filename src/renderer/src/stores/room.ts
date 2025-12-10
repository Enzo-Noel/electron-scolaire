import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gun, type Room } from '../gun'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Map<string, Room>>(new Map())
  const joinedRooms = ref<Set<string>>(new Set(['general']))

  // Liste des rooms publiques
  const publicRooms = computed(() => {
    return Array.from(rooms.value.values()).filter((room) => room.type === 'public')
  })

  // Liste des rooms rejointes
  const myRooms = computed(() => {
    return Array.from(joinedRooms.value).map((roomName) => {
      return rooms.value.get(roomName) || {
        name: roomName,
        description: '',
        created: Date.now(),
        type: 'public' as const
      }
    })
  })

  // Créer une room
  async function createRoom(name: string, description: string, type: 'public' | 'private' = 'public') {
    if (!name || name.trim() === '') {
      throw new Error('Le nom de la room ne peut pas être vide')
    }

    const room: Room = {
      name: name.trim(),
      description: description.trim(),
      created: Date.now(),
      type
    }

    try {
      gun.get('chat/rooms').get(room.name).put(room)
      rooms.value.set(room.name, room)
      joinedRooms.value.add(room.name)
      return room
    } catch (error) {
      console.error('Erreur création room:', error)
      throw error
    }
  }

  // Rejoindre une room
  async function joinRoom(roomName: string, username: string) {
    try {
      gun.get(`chat/rooms/${roomName}/members`).set(username)
      joinedRooms.value.add(roomName)
    } catch (error) {
      console.error('Erreur rejoindre room:', error)
      throw error
    }
  }

  // Quitter une room
  async function leaveRoom(roomName: string, username: string) {
    if (roomName === 'general') {
      throw new Error('Impossible de quitter la room générale')
    }

    try {
      gun.get(`chat/rooms/${roomName}/members`).get(username).put(null)
      joinedRooms.value.delete(roomName)
    } catch (error) {
      console.error('Erreur quitter room:', error)
      throw error
    }
  }

  // S'abonner aux rooms
  function subscribeToRooms() {
    const unsubscribe = gun
      .get('chat/rooms')
      .map()
      .on((roomData: any, roomName: string) => {
        if (roomData && typeof roomData === 'object' && roomName && !roomName.includes('/')) {
          rooms.value.set(roomName, roomData as Room)
        }
      })

    return () => unsubscribe.off()
  }

  // S'abonner aux membres d'une room
  function subscribeToRoomMembers(roomName: string, callback: (members: string[]) => void) {
    const unsubscribe = gun
      .get(`chat/rooms/${roomName}/members`)
      .map()
      .on((memberData: any, memberId: string) => {
        if (memberData) {
          const room = rooms.value.get(roomName)
          if (room) {
            if (!room.members) room.members = []
            if (!room.members.includes(memberId)) {
              room.members.push(memberId)
            }
            rooms.value.set(roomName, room)
            callback(room.members)
          }
        }
      })

    return () => unsubscribe.off()
  }

  // Ajouter ou mettre à jour une room
  function updateRoom(roomName: string, roomData: Room) {
    rooms.value.set(roomName, roomData)
  }

  // Obtenir une room
  function getRoom(roomName: string): Room | undefined {
    return rooms.value.get(roomName)
  }

  return {
    rooms,
    joinedRooms,
    publicRooms,
    myRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    subscribeToRooms,
    subscribeToRoomMembers,
    updateRoom,
    getRoom
  }
})
