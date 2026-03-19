import { Link } from 'react-router-dom'
import { getCurrentUser } from '../store/authStore'

function Home() {
  const user = getCurrentUser()

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      {/* 히어로 섹션 */}
      <div style={{maxWidth:'800px', margin:'0 auto', padding:'80px 24px', textAlign:'center'}}>
        <h1 style={{fontSize:'44px', fontWeight:'800', color:'#111827', lineHeight:'1.3', marginBottom:'20px'}}>
          원하는 상품, 지금 바로<br />
          <span style={{color:'#2563eb'}}>견적 비교</span>하세요
        </h1>
        <p style={{fontSize:'18px', color:'#6b7280', marginBottom:'40px', lineHeight:'1.8'}}>
          하우머치에서 여러 업체의 견적을 한번에 받고<br />
          가격과 신뢰도를 비교해 최적의 업체를 선택하세요
        </p>
        {user ? (
          <div style={{display:'flex', justifyContent:'center', gap:'16px', flexWrap:'wrap'}}>
  <Link to="/consumer/dashboard" className="btn btn-primary"
    style={{fontSize:'16px', padding:'14px 32px', minWidth:'160px', textAlign:'center', whiteSpace:'nowrap'}}>
    견적 요청하기
  </Link>
  <Link to="/business/dashboard" className="btn"
    style={{fontSize:'16px', padding:'14px 32px', background:'white', color:'#2563eb',
      border:'2px solid #2563eb', borderRadius:'12px', fontWeight:'600',
      minWidth:'160px', textAlign:'center', whiteSpace:'nowrap'}}>
    견적 제출하기
  </Link>
</div>
        ) : (
          <div style={{display:'flex', justifyContent:'center', gap:'16px'}}>
            <Link to="/register" className="btn btn-primary" style={{fontSize:'16px', padding:'14px 32px'}}>
              무료로 시작하기
            </Link>
            <Link to="/login" className="btn" style={{fontSize:'16px', padding:'14px 32px', background:'white', color:'#2563eb', border:'2px solid #2563eb', borderRadius:'12px', fontWeight:'600'}}>
              로그인
            </Link>
          </div>
        )}
      </div>

      {/* 특징 섹션 */}
      <div style={{maxWidth:'800px', margin:'0 auto', padding:'0 24px 80px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px'}}>
        <div className="card" style={{textAlign:'center', padding:'32px 24px'}}>
          <div style={{fontSize:'40px', marginBottom:'16px'}}>📋</div>
          <h3 style={{fontWeight:'700', marginBottom:'8px', color:'#111827'}}>간편한 견적 요청</h3>
          <p style={{fontSize:'13px', color:'#6b7280', lineHeight:'1.6'}}>원하는 상품/서비스를 설명하고 희망 예산을 입력하면 끝</p>
        </div>
        <div className="card" style={{textAlign:'center', padding:'32px 24px'}}>
          <div style={{fontSize:'40px', marginBottom:'16px'}}>💰</div>
          <h3 style={{fontWeight:'700', marginBottom:'8px', color:'#111827'}}>가격 비교</h3>
          <p style={{fontSize:'13px', color:'#6b7280', lineHeight:'1.6'}}>여러 업체의 견적을 한눈에 비교하고 최적의 가격을 선택</p>
        </div>
        <div className="card" style={{textAlign:'center', padding:'32px 24px'}}>
          <div style={{fontSize:'40px', marginBottom:'16px'}}>⭐</div>
          <h3 style={{fontWeight:'700', marginBottom:'8px', color:'#111827'}}>신뢰도 확인</h3>
          <p style={{fontSize:'13px', color:'#6b7280', lineHeight:'1.6'}}>평점, 리뷰, 인증 배지로 믿을 수 있는 업체를 선택</p>
        </div>
       <div style={{maxWidth:'800px', margin:'0 auto', padding:'0 24px 80px',
  display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px'}}
  className="home-features"></div> 
      </div>
    </div>
  )
}

export default Home