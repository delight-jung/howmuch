import { ref, push, onValue, off, serverTimestamp, update, get } from 'firebase/database'
import { rtdb } from '../firebase'

// 채팅방 ID 생성
export const getChatRoomId = (requestId, bizId) => {
  return `${requestId}_${bizId}`
}

// 메시지 전송
export const sendMessage = async (requestId, bizId, sender) => {
  const roomId = getChatRoomId(requestId, bizId)
  const messagesRef = ref(rtdb, `chats/${roomId}`)
  await push(messagesRef, {
    text: sender.text,
    senderId: sender.id,
    senderName: sender.name,
    createdAt: serverTimestamp(),
    read: false,
  })
}

// 메시지 실시간 구독
export const subscribeMessages = (requestId, bizId, callback) => {
  const roomId = getChatRoomId(requestId, bizId)
  const messagesRef = ref(rtdb, `chats/${roomId}`)
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const messages = Object.entries(data).map(([id, msg]) => ({
        id,
        ...msg,
      }))
      callback(messages)
    } else {
      callback([])
    }
  })
  return () => off(messagesRef)
}

// 읽지 않은 메시지 수 가져오기
export const getUnreadCount = async (requestId, bizId, userId) => {
  const roomId = getChatRoomId(requestId, bizId)
  const messagesRef = ref(rtdb, `chats/${roomId}`)
  const snapshot = await get(messagesRef)
  if (!snapshot.exists()) return 0

  const messages = Object.values(snapshot.val())
  return messages.filter(msg => msg.senderId !== userId && !msg.read).length
}

// 메시지 읽음 처리
export const markAsRead = async (requestId, bizId, userId) => {
  const roomId = getChatRoomId(requestId, bizId)
  const messagesRef = ref(rtdb, `chats/${roomId}`)
  const snapshot = await get(messagesRef)
  if (!snapshot.exists()) return

  const updates = {}
  Object.entries(snapshot.val()).forEach(([id, msg]) => {
    if (msg.senderId !== userId && !msg.read) {
      updates[`chats/${roomId}/${id}/read`] = true
    }
  })
  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates)
  }
}

// 채팅방별 읽지 않은 메시지 수 실시간 구독
export const subscribeUnreadCount = (requestId, bizId, userId, callback) => {
  const roomId = getChatRoomId(requestId, bizId)
  const messagesRef = ref(rtdb, `chats/${roomId}`)
  onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) { callback(0); return }
    const messages = Object.values(snapshot.val())
    const count = messages.filter(msg => msg.senderId !== userId && !msg.read).length
    callback(count)
  })
  return () => off(messagesRef)
}