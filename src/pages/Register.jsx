import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../store/authStore'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', passwordConfirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.passwordConfirm) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    const result = await registerUser(form.name, form.email, form.password)
    setLoading(false)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  return (
    <div style={{minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <div className="card" style={{width:'100%', maxWidth:'420px', padding:'40px'}}>
        <h2 style={{fontSize:'24px', fontWeight:'700', textAlign:'center', marginBottom:'8px'}}>회원가입</h2>
        <p style={{fontSize:'14px', color:'#6b7280', textAlign:'center', marginBottom:'32px'}}>스마트한 견적 비교를 시작하세요</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="홍길동" className="input" />
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="example@email.com" className="input" />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="6자 이상 입력" className="input" />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input type="password" name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange}
              placeholder="비밀번호 재입력" className="input" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full"
            style={{marginTop:'8px'}} disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p style={{textAlign:'center', fontSize:'14px', color:'#6b7280', marginTop:'24px'}}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{color:'#2563eb', fontWeight:'600'}}>로그인</Link>
        </p>
      </div>
    </div>
  )
}

export default Register