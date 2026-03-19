import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../store/authStore'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    const result = await loginUser(form.email, form.password)
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
        <h2 style={{fontSize:'24px', fontWeight:'700', textAlign:'center', marginBottom:'8px'}}>로그인</h2>
        <p style={{fontSize:'14px', color:'#6b7280', textAlign:'center', marginBottom:'32px'}}>하우머치에 오신 것을 환영합니다</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="example@email.com" className="input" />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="비밀번호 입력" className="input" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full"
            style={{marginTop:'8px'}} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={{textAlign:'center', fontSize:'14px', color:'#6b7280', marginTop:'24px'}}>
          아직 계정이 없으신가요?{' '}
          <Link to="/register" style={{color:'#2563eb', fontWeight:'600'}}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}

export default Login