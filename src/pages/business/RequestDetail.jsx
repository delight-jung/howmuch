import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { getBizProfile } from '../../store/authStore'
import { getRequestById, submitQuote } from '../../store/quoteStore'
import { formatDate, daysLeft, isExpired, formatPrice, parsePrice } from '../../utils/dateUtils'
import { onAuthStateChanged } from 'firebase/auth'
import FileUpload from '../../components/FileUpload'

function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bizProfile, setBizProfile] = useState(null)
  const [request, setRequest] = useState(null)
  const [form, setForm] = useState({
    price: '',
    priceDisplay: '',
    deliveryDate: '',
    message: ''
  })
  const [attachments, setAttachments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
      const profile = await getBizProfile()
      if (!profile) { navigate('/business/register'); return }
      setBizProfile(profile)
      const req = await getRequestById(id)
      if (!req) { navigate('/business/dashboard'); return }
      setRequest(req)
      setAlreadySubmitted(req.quotes && req.quotes.some(q => q.bizId === currentUser.uid))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleChange = (e) => {
    if (e.target.name === 'price') {
      const raw = parsePrice(e.target.value)
      setForm({ ...form, price: raw, priceDisplay: formatPrice(raw) })
    } else {
      setForm({ ...form, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.price || !form.deliveryDate || !form.message) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (isNaN(form.price) || Number(form.price) <= 0) {
      setError('견적 금액을 올바르게 입력해주세요.')
      return
    }
    setSubmitting(true)
    const userWithProfile = { ...user, bizProfile }
    const result = await submitQuote(id, userWithProfile, {
      ...form,
      attachments, // 첨부 파일 추가
    })
    setSubmitting(false)
    if (result.success) {
      navigate('/business/dashboard')
    } else {
      setError(result.message)
    }
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  if (!request) return null
  const expired = isExpired(request.deadline)

  return (
    <div className="page" style={{maxWidth:'680px'}}>
      {/* 요청 상세 */}
      <div className="card" style={{marginBottom:'24px'}}>
        <div className="flex-between" style={{marginBottom:'16px'}}>
          <h1 style={{fontSize:'20px', fontWeight:'700', color:'#111827'}}>
            {request.title}
          </h1>
          {expired || request.status === 'closed' ? (
            <span className="badge badge-gray">마감</span>
          ) : (
            <span className="badge badge-blue">{daysLeft(request.deadline)}일 남음</span>
          )}
        </div>
        <p style={{fontSize:'14px', color:'#6b7280', lineHeight:'1.6', marginBottom:'16px'}}>
          {request.description}
        </p>

        {/* 요청자 첨부 파일 표시 */}
        {request.attachments && request.attachments.length > 0 && (
          <div style={{marginTop:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'8px'}}>
              📎 첨부 파일 ({request.attachments.length}개)
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {request.attachments.map((file, index) => (
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
    display:'flex', alignItems:'center', gap:'10px',
    padding:'10px 14px', background:'#f9fafb',
    borderRadius:'10px', border:'1px solid #e5e7eb',
    cursor:'pointer', color:'#111827'
  }}>
                  {['jpg','jpeg','png','gif','webp'].includes(file.format?.toLowerCase()) ? (
                    <img src={file.url} alt={file.name}
                      style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'6px'}} />
                  ) : (
                    <span style={{fontSize:'24px'}}>
                      {file.format === 'pdf' ? '📄' : '📋'}
                    </span>
                  )}
                  <span style={{fontSize:'13px', fontWeight:'500'}}>{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex', gap:'16px', fontSize:'13px', color:'#9ca3af', marginTop:'16px'}}>
          <span>📍 {request.region}</span>
          <span>💰 희망예산 {Number(request.budget).toLocaleString()}원</span>
          <span>📅 {formatDate(request.createdAt)}</span>
        </div>
      </div>

      {/* 견적서 작성 영역 */}
      {alreadySubmitted ? (
        <div className="card" style={{textAlign:'center', padding:'48px'}}>
          <div style={{fontSize:'40px', marginBottom:'12px'}}>✅</div>
          <p style={{fontWeight:'700', color:'#16a34a', fontSize:'16px', marginBottom:'8px'}}>
            이미 견적을 제출하셨습니다
          </p>
          <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'24px'}}>
            소비자의 선택을 기다려주세요
          </p>
          <button onClick={() => navigate('/business/dashboard')}
            className="btn btn-green" style={{padding:'12px 32px'}}>
            대시보드로 돌아가기
          </button>
        </div>
      ) : expired || request.status === 'closed' ? (
        <div className="card" style={{textAlign:'center', padding:'48px'}}>
          <div style={{fontSize:'40px', marginBottom:'12px'}}>🔒</div>
          <p style={{fontWeight:'700', color:'#6b7280', fontSize:'16px', marginBottom:'24px'}}>
            마감된 요청입니다
          </p>
          <button onClick={() => navigate('/business/dashboard')}
            className="btn btn-secondary" style={{padding:'12px 32px'}}>
            대시보드로 돌아가기
          </button>
        </div>
      ) : (
        <div className="card" style={{padding:'40px'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', marginBottom:'24px', color:'#111827'}}>
            견적서 작성
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                견적 금액 (원) <span style={{color:'#ef4444'}}>*</span>
              </label>
              <input type="text" name="price" value={form.priceDisplay} onChange={handleChange}
                placeholder="예) 450,000" className="input" />
            </div>

            <div className="form-group">
              <label className="form-label">
                납기일 <span style={{color:'#ef4444'}}>*</span>
              </label>
              <input type="date" name="deliveryDate" value={form.deliveryDate}
                onChange={handleChange} className="input" />
            </div>

            <div className="form-group">
              <label className="form-label">
                견적 메시지 <span style={{color:'#ef4444'}}>*</span>
              </label>
              <textarea name="message" value={form.message} onChange={handleChange}
                placeholder="업체 소개 및 견적에 대한 설명을 입력해주세요"
                rows={4} className="textarea" />
            </div>

            {/* 파일 첨부 */}
            <div className="form-group">
              <label className="form-label">견적서 파일 첨부 (선택)</label>
              <FileUpload
                onUploadComplete={(files) => setAttachments(files)}
                maxFiles={3}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
              <button type="button" onClick={() => navigate('/business/dashboard')}
                className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
                취소
              </button>
              <button type="submit" className="btn btn-green"
                style={{flex:1, padding:'14px'}} disabled={submitting}>
                {submitting ? '제출 중...' : '견적 제출하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default RequestDetail