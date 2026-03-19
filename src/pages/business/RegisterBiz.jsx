import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { saveBizProfile, getBizProfile } from '../../store/authStore'
import { onAuthStateChanged } from 'firebase/auth'

const REGIONS = ['전국','서울','경기','인천','부산','대구','대전','광주','울산','강원','충북','충남','전북','전남','경북','경남','제주']

function RegisterBiz() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ bizName:'', bizNumber:'', category:'', description:'', region:'전국' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      // 이미 업체 등록된 경우 대시보드로
      const profile = await getBizProfile()
      if (profile) { navigate('/business/dashboard'); return }
    })
    return () => unsubscribe()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.bizName || !form.bizNumber || !form.category || !form.description) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (form.bizNumber.length < 10) {
      setError('사업자등록번호를 올바르게 입력해주세요. (10자리)')
      return
    }
    setLoading(true)
    const profile = {
      ...form,
      rating: 0,
      reviewCount: 0,
      dealCount: 0,
      registeredAt: new Date().toISOString(),
      verified: true,
    }
    await saveBizProfile(profile)
    setLoading(false)
    navigate('/business/dashboard')
  }

  return (
    <div className="page" style={{maxWidth:'680px'}}>
      <div style={{marginBottom:'32px'}}>
        <h1 className="page-title">업체 등록</h1>
        <p className="page-subtitle">업체 정보를 등록하면 견적 요청에 참여할 수 있습니다</p>
      </div>

      {/* 인증 안내 */}
      <div style={{background:'#eff6ff', borderRadius:'16px', padding:'20px',
        marginBottom:'24px', display:'flex', gap:'12px', alignItems:'flex-start'}}>
        <span style={{fontSize:'24px'}}>✅</span>
        <div>
          <p style={{color:'#1d4ed8', fontWeight:'600', fontSize:'14px', marginBottom:'4px'}}>
            사업자 인증 필수
          </p>
          <p style={{color:'#3b82f6', fontSize:'13px'}}>
            사업자등록번호 입력 후 인증이 완료되어야 견적 제출이 가능합니다
          </p>
        </div>
      </div>

      <div className="card" style={{padding:'40px'}}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">업체명 <span style={{color:'#ef4444'}}>*</span></label>
            <input type="text" name="bizName" value={form.bizName} onChange={handleChange}
              placeholder="예) 홍길동 전자" className="input" />
          </div>

          <div className="form-group">
            <label className="form-label">사업자등록번호 <span style={{color:'#ef4444'}}>*</span></label>
            <input type="text" name="bizNumber" value={form.bizNumber} onChange={handleChange}
              placeholder="숫자 10자리 입력 (예: 1234567890)"
              maxLength={10} className="input" />
          </div>

          <div className="form-group">
            <label className="form-label">업종/카테고리 <span style={{color:'#ef4444'}}>*</span></label>
            <input type="text" name="category" value={form.category} onChange={handleChange}
              placeholder="예) IT기기, 인테리어, 디자인, 인쇄 등" className="input" />
          </div>

          <div className="form-group">
            <label className="form-label">업체 소개 <span style={{color:'#ef4444'}}>*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="업체 소개, 주요 서비스, 보유 장비 등을 입력해주세요"
              rows={4} className="textarea" />
          </div>

          <div className="form-group">
            <label className="form-label">활동 지역</label>
            <select name="region" value={form.region} onChange={handleChange} className="select">
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-green btn-full"
            style={{marginTop:'8px'}} disabled={loading}>
            {loading ? '등록 중...' : '업체 등록 완료'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegisterBiz