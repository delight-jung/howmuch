import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { getRequestById, selectQuote, addReview, hasReviewed } from '../../store/quoteStore'
import { formatDate, daysLeft, isExpired } from '../../utils/dateUtils'
import { onAuthStateChanged } from 'firebase/auth'
import { subscribeUnreadCount } from '../../store/chatStore'
import ReviewModal from '../../components/ReviewModal'

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
      style={{padding:'10px 16px', position:'relative', whiteSpace:'nowrap'}}>
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

function QuoteList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [request, setRequest] = useState(null)
  const [sortBy, setSortBy] = useState('price')
  const [selectedQuoteId, setSelectedQuoteId] = useState(null)
  const [reportModal, setReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
      const req = await getRequestById(id)
      if (!req || req.userId !== currentUser.uid) {
        navigate('/consumer/dashboard')
        return
      }
      setRequest(req)
      setSelectedQuoteId(req.selectedQuoteId || null)
      const alreadyReviewed = await hasReviewed(id, currentUser.uid)
      setReviewed(alreadyReviewed)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const getSortedQuotes = () => {
    if (!request || !request.quotes) return []
    const quotes = [...request.quotes]
    if (sortBy === 'price') return quotes.sort((a, b) => a.price - b.price)
    if (sortBy === 'rating') return quotes.sort((a, b) => b.bizRating - a.bizRating)
    return quotes
  }

  const handleSelect = async (quoteId) => {
    if (request.status === 'closed') return
    if (window.confirm('이 업체의 견적을 선택하시겠습니까?')) {
      await selectQuote(id, quoteId)
      setSelectedQuoteId(quoteId)
      setRequest({ ...request, status: 'closed', selectedQuoteId: quoteId })
    }
  }

  const handleReviewOpen = (quote) => {
    setReviewTarget(quote)
    setReviewModal(true)
  }

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewTarget) return
    const result = await addReview(id, reviewTarget.bizId, {
      rating,
      comment,
      reviewerName: user.displayName,
      reviewerId: user.uid,
    })
    if (result.success) {
      setReviewModal(false)
      setReviewed(true)
      alert('리뷰가 성공적으로 작성되었습니다! 감사합니다 😊')
    } else {
      alert(result.message)
    }
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  if (!request) return null

  return (
    <div className="page">
      {/* 요청 정보 카드 */}
      <div className="card" style={{marginBottom:'24px'}}>
        <div style={{marginBottom:'16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px'}}>
            <h1 style={{fontSize:'18px', fontWeight:'700', color:'#111827', flex:1, marginRight:'12px'}}>
              {request.title}
            </h1>
            {request.status === 'closed' ? (
              <span className="badge badge-gray">마감</span>
            ) : isExpired(request.deadline) ? (
              <span className="badge badge-red">기간만료</span>
            ) : (
              <span className="badge badge-blue">{daysLeft(request.deadline)}일 남음</span>
            )}
          </div>
          <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'12px', lineHeight:'1.6'}}>
            {request.description}
          </p>
          <div style={{display:'flex', flexWrap:'wrap', gap:'12px', fontSize:'13px', color:'#9ca3af'}}>
            <span>📍 {request.region}</span>
            <span>💰 {Number(request.budget).toLocaleString()}원</span>
            <span>📅 {formatDate(request.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 견적 목록 헤더 */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
        <h2 style={{fontWeight:'700', fontSize:'16px', color:'#111827'}}>
          받은 견적 <span style={{color:'#2563eb'}}>{request.quotes ? request.quotes.length : 0}개</span>
        </h2>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="select" style={{width:'auto', padding:'8px 16px'}}>
          <option value="price">가격 낮은순</option>
          <option value="rating">평점 높은순</option>
        </select>
      </div>

      {/* 견적 카드 목록 */}
      {!request.quotes || request.quotes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">⏳</div>
          <p className="empty-state-text">아직 제출된 견적이 없습니다</p>
          <p style={{fontSize:'13px', color:'#9ca3af', marginTop:'8px'}}>
            업체들의 견적을 기다려주세요
          </p>
        </div>
      ) : (
        <div className="space-y">
          {getSortedQuotes().map((quote) => (
            <div key={quote.id} className="card"
              style={{border: selectedQuoteId === quote.id ? '2px solid #2563eb' : '2px solid transparent'}}>

              {/* 업체 정보 */}
              <div style={{marginBottom:'12px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap'}}>
                  <h3
                    onClick={() => navigate(`/biz/${quote.bizId}`)}
                    style={{fontWeight:'700', fontSize:'16px', color:'#2563eb',
                      cursor:'pointer', textDecoration:'underline'}}>
                    {quote.bizName}
                  </h3>
                  {selectedQuoteId === quote.id && (
                    <span className="badge badge-blue">✓ 선택됨</span>
                  )}
                  <span className="badge badge-green">✅ 인증업체</span>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'4px', marginBottom:'10px'}}>
                  <span style={{color:'#fbbf24'}}>⭐</span>
                  <span style={{fontSize:'14px', fontWeight:'600', color:'#374151'}}>
                    {quote.bizRating > 0 ? quote.bizRating.toFixed(1) : '신규'}
                  </span>
                  <span style={{fontSize:'12px', color:'#9ca3af'}}>
                    ({quote.bizReviewCount}개 리뷰)
                  </span>
                </div>

                <p style={{fontSize:'14px', color:'#4b5563', marginBottom:'8px', lineHeight:'1.6'}}>
                  {quote.message}
                </p>

                {/* 업체 첨부 파일 */}
                {quote.attachments && quote.attachments.length > 0 && (
                  <div style={{marginTop:'8px', marginBottom:'8px'}}>
                    <p style={{fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'6px'}}>
                      📎 첨부 파일 ({quote.attachments.length}개)
                    </p>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                      {quote.attachments.map((file, index) => (
                        <div key={index}
                          onClick={() => {
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
                          }}
                          style={{
                            display:'flex', alignItems:'center', gap:'6px',
                            padding:'6px 10px', background:'#f9fafb',
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

                <p style={{fontSize:'12px', color:'#9ca3af'}}>
                  납기일: {formatDate(quote.deliveryDate)}
                </p>
              </div>

              {/* 가격 + 버튼 */}
              <div style={{borderTop:'1px solid #f3f4f6', paddingTop:'12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                  <div style={{fontSize:'24px', fontWeight:'800', color:'#2563eb'}}>
                    {Number(quote.price).toLocaleString()}원
                  </div>
                  <div style={{fontSize:'12px', color:'#9ca3af'}}>
                    제출일: {formatDate(quote.createdAt)}
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                  <UnreadChatButton
                    requestId={request.id}
                    bizId={quote.bizId}
                    userId={user?.uid}
                    onClick={() => navigate(`/chat/${request.id}/${quote.bizId}`)}
                  />

                  {request.status !== 'closed' && !isExpired(request.deadline) && (
                    <button onClick={() => handleSelect(quote.id)}
                      className="btn btn-primary"
                      style={{padding:'10px 16px', whiteSpace:'nowrap'}}>
                      이 견적 선택
                    </button>
                  )}

                  {request.status === 'closed' && selectedQuoteId === quote.id && (
                    reviewed ? (
                      <span className="badge badge-green"
                        style={{display:'flex', alignItems:'center', padding:'10px 16px'}}>
                        ✅ 리뷰 완료
                      </span>
                    ) : (
                      <button onClick={() => handleReviewOpen(quote)}
                        className="btn"
                        style={{padding:'10px 16px', background:'#f59e0b',
                          color:'white', border:'none', fontWeight:'600', whiteSpace:'nowrap'}}>
                        ⭐ 리뷰 작성
                      </button>
                    )
                  )}

                  <button onClick={() => { setReportTarget(quote.bizName); setReportModal(true) }}
                    className="btn btn-secondary"
                    style={{padding:'10px 16px', whiteSpace:'nowrap'}}>
                    신고
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 리뷰 모달 */}
      {reviewModal && reviewTarget && (
        <ReviewModal
          bizName={reviewTarget.bizName}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewModal(false)}
        />
      )}

      {/* 신고 모달 */}
      {reportModal && (
        <div className="modal-overlay" onClick={() => setReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize:'18px', fontWeight:'700', marginBottom:'8px'}}>신고하기</h3>
            <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'16px'}}>
              <strong style={{color:'#111827'}}>{reportTarget}</strong> 업체를 신고합니다
            </p>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
              placeholder="신고 사유를 입력해주세요"
              rows={4} className="textarea" style={{marginBottom:'16px'}} />
            <div style={{display:'flex', gap:'12px'}}>
              <button onClick={() => setReportModal(false)}
                className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
                취소
              </button>
              <button onClick={() => {
                alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.')
                setReportModal(false)
                setReportReason('')
              }}
                className="btn btn-red" style={{flex:1, padding:'14px'}}>
                신고 접수
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuoteList