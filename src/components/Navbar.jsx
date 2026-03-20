import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'
import { logoutUser } from '../store/authStore'
import { onAuthStateChanged } from 'firebase/auth'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  const mobileNavStyle = {
    display: 'flex',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
    padding: '8px 0',
    zIndex: 100,
    justifyContent: 'space-around',
  }

  const mobileNavItemStyle = (active) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: active ? '#2563eb' : '#9ca3af',
    fontSize: '11px',
    fontWeight: '500',
    flex: 1,
  })

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

      {/* 모바일 하단 네비게이션 - CSS 없이 인라인 스타일로 */}
      {user && (
        <div style={mobileNavStyle}>
          <button
            style={mobileNavItemStyle(isActive('/consumer'))}
            onClick={() => navigate('/consumer/dashboard')}>
            <span style={{fontSize:'22px'}}>📋</span>
            소비자
          </button>
          <button
            style={mobileNavItemStyle(location.pathname === '/')}
            onClick={() => navigate('/')}>
            <span style={{fontSize:'22px'}}>🏠</span>
            홈
          </button>
          <button
            style={mobileNavItemStyle(isActive('/business'))}
            onClick={() => navigate('/business/dashboard')}>
            <span style={{fontSize:'22px'}}>🏢</span>
            업체
          </button>
          <button
            style={mobileNavItemStyle(isActive('/mypage'))}
            onClick={() => navigate('/mypage')}>
            <span style={{fontSize:'22px'}}>👤</span>
            마이
          </button>
        </div>
      )}
    </>
  )
}

export default Navbar