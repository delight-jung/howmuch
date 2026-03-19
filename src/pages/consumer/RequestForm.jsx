import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { addRequest } from '../../store/quoteStore'
import { onAuthStateChanged } from 'firebase/auth'
import { formatPrice, parsePrice } from '../../utils/dateUtils'
import FileUpload from '../../components/FileUpload'

const REGIONS = ['전국','서울','경기','인천','부산','대구','대전','광주','울산','강원','충북','충남','전북','전남','경북','경남','제주']

function RequestForm() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    budgetDisplay: '',
    region: '전국'
  })
  const [attachments, setAttachments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleChange = (e) => {
    if (e.target.name === 'budget') {
      const raw = parsePrice(e.target.value)
      setForm({ ...form, budget: raw, budgetDisplay: formatPrice(raw) })
    } else {
      setForm({ ...form, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.description || !form.budget) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (isNaN(form.budget) || Number(form.budget) <= 0) {
      setError('희망 예산을 올바르게 입력해주세요.')
      return
    }
    setLoading(true)
    const newRequest = await addRequest(user.uid, user.displayName, {
      ...form,
      attachments, // 첨부 파일 추가
    })
    setLoading(false)
    if (newRequest) {
      navigate(`/consumer/quotes/${newRequest.id}`)
    } else {
      setError('견적 요청 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="page" style={{maxWidth:'680px'}}>
      <div style={{marginBottom:'32px'}}>
        <h1 className="page-title">견적 요청하기</h1>
        <p className="page-subtitle">요청 후 7일 이내에 업체들의 견적을 받을 수 있습니다</p>
      </div>

      <div className="card" style={{padding:'40px'}}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              제목 <span style={{color:'#ef4444'}}>*</span>
            </label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="예) 노트북 견적 요청, 로고 디자인 제작 등"
              className="input" />
          </div>

          <div className="form-group">
            <label className="form-label">
              상세 설명 <span style={{color:'#ef4444'}}>*</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="원하시는 상품/서비스에 대해 최대한 자세히 설명해주세요"
              rows={5} className="textarea" />
          </div>

          <div className="form-group">
            <label className="form-label">
              희망 예산 (원) <span style={{color:'#ef4444'}}>*</span>
            </label>
            <input type="text" name="budget" value={form.budgetDisplay} onChange={handleChange}
              placeholder="예) 500,000" className="input" />
          </div>

          <div className="form-group">
            <label className="form-label">지역</label>
            <select name="region" value={form.region} onChange={handleChange} className="select">
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* 파일 첨부 */}
          <div className="form-group">
            <label className="form-label">파일 첨부 (선택)</label>
            <FileUpload
              onUploadComplete={(files) => setAttachments(files)}
              maxFiles={5}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
            <button type="button" onClick={() => navigate('/consumer/dashboard')}
              className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
              취소
            </button>
            <button type="submit" className="btn btn-primary"
              style={{flex:1, padding:'14px'}} disabled={loading}>
              {loading ? '등록 중...' : '견적 요청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RequestForm