import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { getBizProfile } from '../../store/authStore'
import { getAllRequests, updateQuote, cancelQuote } from '../../store/quoteStore'
import { formatDate, daysLeft, isExpired, formatPrice, parsePrice } from '../../utils/dateUtils'
import { onAuthStateChanged } from 'firebase/auth'
import { subscribeUnreadCount } from '../../store/chatStore'

function UnreadChatButton({ requestId, bizId, userId, onClick }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!requestId || !bizId || !userId) return
    const unsubscribe = subscribeUnreadCount(requestId, bizId, userId, (count) => {
      setUnread(count)
    })
    return () => unsubscribe()
  }, [requestId, bizId, userId])

  return (
    <button onClick={onClick} className="btn btn-secondary"
      style={{fontSize:'12px', padding:'6px 12px', marginBottom:'8px',
        width:'100%', position:'relative'}}>
      💬 채팅
      {unread > 0 && (
        <span style={{
          position:'absolute', top:'-6px', right:'-6px',
          background:'#ef4444', color:'white', borderRadius:'999px',
          width:'20px', height:'20px', fontSize:'11px', fontWeight:'700',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {unread}
        </span>
      )}
    </button>
  )
}

function BusinessDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bizProfile, setBizProfile] = useState(null)
  const [requests, setRequests] = useState([])
  const [myQuotes, setMyQuotes] = useState([])
  const [tab, setTab] = useState('available')
  const [loading, setLoading] = useState(true)

  // 수정 모달 상태
  const [editModal, setEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ price:'', priceDisplay:'', deliveryDate:'', message:'' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const loadData = async (currentUser) => {
    const all = await getAllRequests()
    const available = all.filter(r =>
      r.userId !== currentUser.uid &&
      r.status === 'open' &&
      !isExpired(r.deadline)
    )
    const submitted = all.filter(r =>
      r.quotes && r.quotes.some(q => q.bizId === currentUser.uid)
    )
    setRequests(available)
    setMyQuotes(submitted)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
      const profile = await getBizProfile()
      if (!profile) { navigate('/business/register'); return }
      setBizProfile(profile)
      await loadData(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleEditOpen = (req, quote) => {
    setEditTarget({ requestId: req.id, quoteId: quote.id })
    setEditForm({
      price: quote.price,
      priceDisplay: formatPrice(quote.price),
      deliveryDate: quote.deliveryDate,
      message: quote.message
    })
    setEditError('')
    setEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    if (!editForm.price || !editForm.deliveryDate || !editForm.message) {
      setEditError('모든 항목을 입력해주세요.')
      return
    }
    setEditLoading(true)
    const result = await updateQuote(editTarget.requestId, editTarget.quoteId, {
      price: editForm.price,
      deliveryDate: editForm.deliveryDate,
      message: editForm.message,
    })
    setEditLoading(false)
    if (result.success) {
      setEditModal(false)
      await loadData(user)
    } else {
      setEditError(result.message)
    }
  }

  const handleCancel = async (requestId, quoteId) => {
    if (!window.confirm('견적을 취소하시겠습니까?')) return
    const result = await cancelQuote(requestId, quoteId)
    if (result.success) {
      await loadData(user)
    } else {
      alert(result.message)
    }
  }

  const handleEditChange = (e) => {
    if (e.target.name === 'price') {
      const raw = parsePrice(e.target.value)
      setEditForm({ ...editForm, price: raw, priceDisplay: formatPrice(raw) })
    } else {
      setEditForm({ ...editForm, [e.target.name]: e.target.value })
    }
  }

  const handleFileOpen = (file) => {
    const isPdf = file.format === 'pdf'
    if (isPdf) {
      const pngUrl = file.url.replace('/upload/', '/upload/f_png/')
      const link = document.createElement('a')
      link.href = pngUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const link = document.createElement('a')
      link.href = file.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">업체 대시보드</h1>
         <p className="page-subtitle">
  {bizProfile?.bizName} ·{' '}
  <span style={{color:'#16a34a'}}>✅ 인증완료</span>
</p>
<div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'8px'}}>
  <span style={{color:'#fbbf24', fontSize:'18px'}}>⭐</span>
  <span style={{fontWeight:'700', fontSize:'16px', color:'#111827'}}>
    {bizProfile?.rating > 0 ? bizProfile.rating.toFixed(1) : '0.0'}
  </span>
  <span style={{fontSize:'13px', color:'#9ca3af'}}>
    ({bizProfile?.reviewCount || 0}개 리뷰)
  </span>
  <button
    onClick={() => navigate(`/biz/${user?.uid}`)}
    className="btn btn-secondary"
    style={{fontSize:'12px', padding:'6px 16px', marginLeft:'8px'}}>
    내 프로필 보기 👀
  </button>
</div>
        </div>
        <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'flex-end'}}>
          <div className="card" style={{textAlign:'center', padding:'12px 24px'}}>
            <div style={{fontSize:'22px', fontWeight:'800', color:'#2563eb'}}>{requests.length}</div>
            <div style={{fontSize:'12px', color:'#9ca3af'}}>참여가능</div>
          </div>
          <div className="card" style={{textAlign:'center', padding:'12px 24px'}}>
            <div style={{fontSize:'22px', fontWeight:'800', color:'#16a34a'}}>{myQuotes.length}</div>
            <div style={{fontSize:'12px', color:'#9ca3af'}}>제출완료</div>
          </div>
          <div className="card" style={{textAlign:'center', padding:'12px 24px'}}>
            <div style={{fontSize:'22px', fontWeight:'800', color:'#f59e0b'}}>
              {bizProfile?.rating > 0 ? bizProfile.rating.toFixed(1) : '-'}
            </div>
            <div style={{fontSize:'12px', color:'#9ca3af'}}>평점</div>
          </div>
          <div className="card" style={{textAlign:'center', padding:'12px 24px'}}>
            <div style={{fontSize:'22px', fontWeight:'800', color:'#8b5cf6'}}>
              {bizProfile?.reviewCount || 0}
            </div>
            <div style={{fontSize:'12px', color:'#9ca3af'}}>리뷰수</div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="tabs">
        <button onClick={() => setTab('available')}
          className={`tab ${tab === 'available' ? 'tab-active' : 'tab-inactive'}`}>
          참여 가능한 요청 ({requests.length})
        </button>
        <button onClick={() => setTab('submitted')}
          className={`tab ${tab === 'submitted' ? 'tab-active' : 'tab-inactive'}`}>
          제출한 견적 ({myQuotes.length})
        </button>
      </div>

      {/* 참여 가능한 요청 목록 */}
      {tab === 'available' && (
        requests.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">🔍</div>
            <p className="empty-state-text">현재 참여 가능한 견적 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y">
            {requests.map((req) => (
              <div key={req.id} className="card"
                style={{cursor:'pointer'}}
                onClick={() => navigate(`/business/request/${req.id}`)}>
                <div className="flex-between">
                  <div style={{flex:1}}>
                    <h3 style={{fontWeight:'700', fontSize:'17px', marginBottom:'6px', color:'#111827'}}>
                      {req.title}
                    </h3>
                    <p style={{fontSize:'13px', color:'#6b7280', marginBottom:'12px',
                      overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                      {req.description}
                    </p>
                    <div style={{display:'flex', gap:'16px', fontSize:'13px', color:'#9ca3af'}}>
                      <span>📍 {req.region}</span>
                      <span>💰 희망예산 {Number(req.budget).toLocaleString()}원</span>
                      <span>📅 {formatDate(req.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right', marginLeft:'24px'}}>
                    <span className="badge badge-blue" style={{marginBottom:'8px', display:'inline-block'}}>
                      {daysLeft(req.deadline)}일 남음
                    </span>
                    <div style={{fontSize:'12px', color:'#9ca3af'}}>
                      견적 {req.quotes ? req.quotes.length : 0}개
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 제출한 견적 목록 */}
      {tab === 'submitted' && (
        myQuotes.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">아직 제출한 견적이 없습니다</p>
          </div>
        ) : (
          <div className="space-y">
            {myQuotes.map((req) => {
              const myQuote = req.quotes.find(q => q.bizId === user.uid)
              const isSelected = req.selectedQuoteId === myQuote?.id
              const isClosed = req.status === 'closed' || isExpired(req.deadline)
              return (
                <div key={req.id} className="card">
                  <div className="flex-between">
                    <div style={{flex:1}}>
                      {/* 요청 제목 */}
                      <h3 style={{fontWeight:'700', fontSize:'16px', marginBottom:'12px', color:'#111827'}}>
                        {req.title}
                      </h3>

                      {/* 내가 제출한 견적 상세 */}
                      <div style={{background:'#f9fafb', borderRadius:'12px',
                        padding:'16px', marginBottom:'12px', border:'1px solid #e5e7eb'}}>
                        <p style={{fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'10px'}}>
                          📝 내가 제출한 견적
                        </p>
                        <p style={{fontSize:'22px', fontWeight:'800', color:'#2563eb', marginBottom:'6px'}}>
                          {Number(myQuote?.price).toLocaleString()}원
                        </p>
                        <p style={{fontSize:'13px', color:'#4b5563', marginBottom:'6px', lineHeight:'1.6'}}>
                          {myQuote?.message}
                        </p>
                        <div style={{display:'flex', gap:'16px', fontSize:'12px', color:'#9ca3af'}}>
                          <span>📅 납기일: {formatDate(myQuote?.deliveryDate)}</span>
                          <span>🕐 제출일: {formatDate(myQuote?.createdAt)}</span>
                          {myQuote?.updatedAt && (
                            <span style={{color:'#f59e0b'}}>✏️ 수정됨</span>
                          )}
                        </div>

                        {/* 첨부 파일 */}
                        {myQuote?.attachments && myQuote.attachments.length > 0 && (
                          <div style={{marginTop:'10px'}}>
                            <p style={{fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'6px'}}>
                              📎 첨부 파일 ({myQuote.attachments.length}개)
                            </p>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                              {myQuote.attachments.map((file, index) => (
                                <div key={index}
                                  onClick={() => handleFileOpen(file)}
                                  style={{
                                    display:'flex', alignItems:'center', gap:'6px',
                                    padding:'6px 10px', background:'white',
                                    borderRadius:'8px', border:'1px solid #e5e7eb',
                                    cursor:'pointer', color:'#374151', fontSize:'12px'
                                  }}>
                                  {['jpg','jpeg','png','gif','webp'].includes(file.format?.toLowerCase()) ? (
                                    <img src={file.url} alt={file.name}
                                      style={{width:'24px', height:'24px', objectFit:'cover', borderRadius:'4px'}} />
                                  ) : (
                                    <span>{file.format === 'pdf' ? '📄' : '📋'}</span>
                                  )}
                                  <span style={{maxWidth:'100px', overflow:'hidden',
                                    textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                    {file.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 견적 요청 정보 */}
                      <div style={{background:'#eff6ff', borderRadius:'12px',
                        padding:'12px', border:'1px solid #bfdbfe'}}>
                        <p style={{fontSize:'12px', fontWeight:'700', color:'#1d4ed8', marginBottom:'8px'}}>
                          📋 견적 요청 정보
                        </p>
                        <div style={{display:'flex', gap:'16px', fontSize:'12px', color:'#3b82f6'}}>
                          <span>👤 요청자: {req.userName}</span>
                          <span>📍 지역: {req.region}</span>
                          <span>💰 희망예산: {Number(req.budget).toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>

                    <div style={{textAlign:'right', marginLeft:'24px', minWidth:'120px'}}>
                      {/* 상태 배지 */}
                      {isSelected ? (
                        <span className="badge badge-blue">🎉 선택됨</span>
                      ) : req.status === 'closed' ? (
                        <span className="badge badge-gray">미선택</span>
                      ) : (
                        <span className="badge badge-yellow">검토중</span>
                      )}

                      {/* 채팅 버튼 */}
                      <div style={{marginTop:'12px'}}>
                        <UnreadChatButton
                          requestId={req.id}
                          bizId={user.uid}
                          userId={user?.uid}
                          onClick={() => navigate(`/chat/${req.id}/${user.uid}`)}
                        />
                      </div>

                      {/* 수정/취소 버튼 */}
                      {!isClosed && !isSelected && (
                        <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                          <button
                            onClick={() => handleEditOpen(req, myQuote)}
                            className="btn btn-secondary"
                            style={{fontSize:'12px', padding:'6px 12px'}}>
                            수정
                          </button>
                          <button
                            onClick={() => handleCancel(req.id, myQuote.id)}
                            className="btn btn-red"
                            style={{fontSize:'12px', padding:'6px 12px'}}>
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* 견적 수정 모달 */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize:'18px', fontWeight:'700', marginBottom:'24px'}}>
              견적 수정
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">
                  견적 금액 (원) <span style={{color:'#ef4444'}}>*</span>
                </label>
                <input type="text" name="price" value={editForm.priceDisplay}
                  onChange={handleEditChange}
                  placeholder="예) 450,000" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  납기일 <span style={{color:'#ef4444'}}>*</span>
                </label>
                <input type="date" name="deliveryDate" value={editForm.deliveryDate}
                  onChange={handleEditChange} className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  견적 메시지 <span style={{color:'#ef4444'}}>*</span>
                </label>
                <textarea name="message" value={editForm.message}
                  onChange={handleEditChange}
                  placeholder="견적에 대한 설명을 입력해주세요"
                  rows={4} className="textarea" />
              </div>
              {editError && <p className="form-error">{editError}</p>}
              <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
                <button type="button" onClick={() => setEditModal(false)}
                  className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
                  취소
                </button>
                <button type="submit" className="btn btn-green"
                  style={{flex:1, padding:'14px'}} disabled={editLoading}>
                  {editLoading ? '저장 중...' : '수정 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessDashboard