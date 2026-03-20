import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'
import { logoutUser } from '../store/authStore'
import { onAuthStateChanged } from 'firebase/auth'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <>
      {/* 상단 네비게이션 */}
      <nav className="navbar">
        <Link to="/" className="navbar-logo">하우머치</Link>
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/consumer/dashboard" className="btn btn-primary"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                소비자
              </Link>
              <Link to="/business/dashboard" className="btn btn-green"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                업체
              </Link>
              <Link to="/mypage" className="btn btn-secondary"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                👤 {user.displayName}
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                로그인
              </Link>
              <Link to="/register" className="btn btn-primary"
                style={{fontSize:'13px', padding:'8px 16px'}}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 모바일 하단 네비게이션 */}
      {user && (
        <div className="mobile-nav">
          <button
            className={`mobile-nav-item ${isActive('/consumer') ? 'active' : ''}`}
            onClick={() => navigate('/consumer/dashboard')}>
            <span className="mobile-nav-item-icon">📋</span>
            소비자
          </button>
          <button
            className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}>
            <span className="mobile-nav-item-icon">🏠</span>
            홈
          </button>
          <button
            className={`mobile-nav-item ${isActive('/business') ? 'active' : ''}`}
            onClick={() => navigate('/business/dashboard')}>
            <span className="mobile-nav-item-icon">🏢</span>
            업체
          </button>
          <button
            className={`mobile-nav-item ${isActive('/mypage') ? 'active' : ''}`}
            onClick={() => navigate('/mypage')}>
            <span className="mobile-nav-item-icon">👤</span>
            마이
          </button>
        </div>
      )}
    </>
  )
}

export default Navbar