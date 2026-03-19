import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getRequestById } from '../store/quoteStore'
import { getUserData } from '../store/authStore'
import { sendMessage, subscribeMessages, markAsRead } from '../store/chatStore'

function Chat() {
  const { requestId, bizId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [request, setRequest] = useState(null)
  const [bizName, setBizName] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)

      const req = await getRequestById(requestId)
      if (!req) { navigate('/'); return }
      setRequest(req)

      const bizData = await getUserData(bizId)
      setBizName(bizData?.bizProfile?.bizName || '업체')

      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // 메시지 실시간 구독 + 읽음 처리
  useEffect(() => {
    if (!requestId || !bizId || !user) return
    const unsubscribe = subscribeMessages(requestId, bizId, async (msgs) => {
      setMessages(msgs)
      // 채팅방 입장 시 읽음 처리
      await markAsRead(requestId, bizId, user.uid)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })
    return () => unsubscribe()
  }, [requestId, bizId, user])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await sendMessage(requestId, bizId, {
      text: text.trim(),
      id: user.uid,
      name: user.displayName,
    })
    setText('')
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  return (
    <div style={{maxWidth:'680px', margin:'0 auto', padding:'24px',
      height:'calc(100vh - 80px)', display:'flex', flexDirection:'column'}}>
      {/* 채팅방 헤더 */}
      <div className="card" style={{marginBottom:'16px', padding:'16px 24px'}}>
        <div className="flex-between">
          <div>
            <h2 style={{fontWeight:'700', fontSize:'16px', color:'#111827'}}>
              {request?.title}
            </h2>
            <p style={{fontSize:'13px', color:'#6b7280', marginTop:'4px'}}>
              {user?.uid === bizId ? request?.userName : bizName} 와의 대화
            </p>
          </div>
          <button onClick={() => navigate(-1)}
            className="btn btn-secondary" style={{padding:'8px 16px', fontSize:'13px'}}>
            ← 뒤로
          </button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="card" style={{flex:1, overflowY:'auto', padding:'24px', marginBottom:'16px'}}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-text">아직 메시지가 없습니다</p>
            <p style={{fontSize:'13px', color:'#9ca3af', marginTop:'8px'}}>
              첫 메시지를 보내보세요!
            </p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.uid
              return (
                <div key={msg.id} style={{
                  display:'flex',
                  flexDirection:'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start'
                }}>
                  <span style={{fontSize:'12px', color:'#9ca3af', marginBottom:'4px'}}>
                    {msg.senderName}
                  </span>
                  <div style={{
                    display:'flex',
                    alignItems:'flex-end',
                    gap:'6px',
                    flexDirection: isMine ? 'row-reverse' : 'row'
                  }}>
                    <div style={{
                      maxWidth:'70%',
                      padding:'12px 16px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? '#2563eb' : '#f3f4f6',
                      color: isMine ? 'white' : '#111827',
                      fontSize:'14px',
                      lineHeight:'1.5'
                    }}>
                      {msg.text}
                    </div>
                    {/* 읽음/안읽음 표시 */}
                    {isMine && !msg.read && (
                      <span style={{
                        fontSize:'11px',
                        color:'#f59e0b',
                        fontWeight:'700',
                        marginBottom:'4px'
                      }}>
                        1
                      </span>
                    )}
                  </div>
                  {msg.createdAt && (
                    <span style={{fontSize:'11px', color:'#9ca3af', marginTop:'4px'}}>
                      {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="card" style={{padding:'16px'}}>
        <form onSubmit={handleSend} style={{display:'flex', gap:'12px'}}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="input"
            style={{flex:1}}
          />
          <button type="submit" className="btn btn-primary"
            style={{padding:'12px 24px'}} disabled={!text.trim()}>
            전송
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat