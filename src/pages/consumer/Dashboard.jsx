import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { getMyRequests, updateRequest, deleteRequest } from '../../store/quoteStore'
import { formatDate, daysLeft, isExpired, formatPrice, parsePrice } from '../../utils/dateUtils'
import { onAuthStateChanged } from 'firebase/auth'

const REGIONS = ['전국','서울','경기','인천','부산','대구','대전','광주','울산','강원','충북','충남','전북','전남','경북','경남','제주']

function ConsumerDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // 수정 모달 상태
  const [editModal, setEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: '',
    budgetDisplay: '',
    region: '전국'
  })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const loadData = async (currentUser) => {
    const myRequests = await getMyRequests(currentUser.uid)
    setRequests(myRequests)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
      await loadData(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // 수정 모달 열기
  const handleEditOpen = (req) => {
    setEditTarget(req)
    setEditForm({
      title: req.title,
      description: req.description,
      budget: req.budget,
      budgetDisplay: formatPrice(req.budget),
      region: req.region,
    })
    setEditError('')
    setEditModal(true)
  }

  // 수정 저장
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    if (!editForm.title || !editForm.description || !editForm.budget) {
      setEditError('모든 항목을 입력해주세요.')
      return
    }
    setEditLoading(true)
    const result = await updateRequest(editTarget.id, editForm)
    setEditLoading(false)
    if (result.success) {
      setEditModal(false)
      await loadData(user)
    } else {
      setEditError(result.message)
    }
  }

  // 삭제
  const handleDelete = async (requestId) => {
    if (!window.confirm('견적 요청을 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.')) return
    const result = await deleteRequest(requestId)
    if (result.success) {
      await loadData(user)
    } else {
      alert(result.message)
    }
  }

  const handleEditChange = (e) => {
    if (e.target.name === 'budget') {
      const raw = parsePrice(e.target.value)
      setEditForm({ ...editForm, budget: raw, budgetDisplay: formatPrice(raw) })
    } else {
      setEditForm({ ...editForm, [e.target.name]: e.target.value })
    }
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">내 견적 요청</h1>
          <p className="page-subtitle">요청한 견적의 현황을 확인하세요</p>
        </div>
        <Link to="/consumer/request" className="btn btn-primary">
          + 견적 요청하기
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">아직 견적 요청이 없습니다</p>
          <Link to="/consumer/request" className="btn btn-primary"
            style={{marginTop:'20px', display:'inline-block'}}>
            첫 견적 요청하기
          </Link>
        </div>
      ) : (
        <div className="space-y">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex-between">
                <div style={{flex:1, cursor:'pointer'}}
                  onClick={() => navigate(`/consumer/quotes/${req.id}`)}>
                  <h3 style={{fontWeight:'700', fontSize:'17px', marginBottom:'6px', color:'#111827'}}>
                    {req.title}
                    {req.updatedAt && (
                      <span style={{fontSize:'12px', color:'#f59e0b', marginLeft:'8px', fontWeight:'500'}}>
                        (수정됨)
                      </span>
                    )}
                  </h3>
                  <p style={{fontSize:'13px', color:'#6b7280', marginBottom:'12px',
                    overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                    {req.description}
                  </p>
                  <div style={{display:'flex', gap:'16px', fontSize:'13px', color:'#9ca3af'}}>
                    <span>📍 {req.region}</span>
                    <span>💰 {Number(req.budget).toLocaleString()}원</span>
                    <span>📅 {formatDate(req.createdAt)}</span>
                  </div>
                </div>
                <div style={{textAlign:'right', marginLeft:'24px'}}>
                  <div style={{fontSize:'28px', fontWeight:'800', color:'#2563eb'}}>
                    {req.quotes ? req.quotes.length : 0}
                  </div>
                  <div style={{fontSize:'12px', color:'#9ca3af', marginBottom:'8px'}}>받은 견적</div>
                  {req.status === 'closed' ? (
                    <span className="badge badge-gray">마감</span>
                  ) : isExpired(req.deadline) ? (
                    <span className="badge badge-red">기간만료</span>
                  ) : (
                    <span className="badge badge-blue">{daysLeft(req.deadline)}일 남음</span>
                  )}

                  {/* 수정/삭제 버튼 - 견적이 없고 마감 전일 때만 표시 */}
                  {req.status !== 'closed' && !isExpired(req.deadline) && (
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <button
                        onClick={() => handleEditOpen(req)}
                        className="btn btn-secondary"
                        style={{fontSize:'12px', padding:'6px 12px'}}>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="btn btn-red"
                        style={{fontSize:'12px', padding:'6px 12px'}}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 견적 요청 수정 모달 */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{fontSize:'18px', fontWeight:'700', marginBottom:'24px'}}>
              견적 요청 수정
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">
                  제목 <span style={{color:'#ef4444'}}>*</span>
                </label>
                <input type="text" name="title" value={editForm.title}
                  onChange={handleEditChange}
                  placeholder="예) 노트북 견적 요청" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  상세 설명 <span style={{color:'#ef4444'}}>*</span>
                </label>
                <textarea name="description" value={editForm.description}
                  onChange={handleEditChange}
                  placeholder="원하시는 상품/서비스에 대해 자세히 설명해주세요"
                  rows={4} className="textarea" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  희망 예산 (원) <span style={{color:'#ef4444'}}>*</span>
                </label>
                <input type="text" name="budget" value={editForm.budgetDisplay}
                  onChange={handleEditChange}
                  placeholder="예) 500,000" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">지역</label>
                <select name="region" value={editForm.region}
                  onChange={handleEditChange} className="select">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              {editError && <p className="form-error">{editError}</p>}
              <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
                <button type="button" onClick={() => setEditModal(false)}
                  className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary"
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

export default ConsumerDashboard