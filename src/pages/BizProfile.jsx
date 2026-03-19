import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserData } from '../store/authStore'
import { getBizReviews } from '../store/quoteStore'
import { formatDate } from '../utils/dateUtils'

function BizProfile() {
  const { bizId } = useParams()
  const navigate = useNavigate()
  const [bizData, setBizData] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const userData = await getUserData(bizId)
      if (!userData || !userData.bizProfile) {
        navigate('/')
        return
      }
      setBizData(userData)

      const bizReviews = await getBizReviews(bizId)
      setReviews(bizReviews)
      setLoading(false)
    }
    loadData()
  }, [bizId])

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  if (!bizData) return null

  const { bizProfile } = bizData

  // 별점 분포 계산
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }))

  return (
    <div className="page" style={{maxWidth:'780px'}}>
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{marginBottom:'24px', padding:'8px 16px', fontSize:'13px'}}>
        ← 뒤로
      </button>

      {/* 업체 기본 정보 */}
      <div className="card" style={{marginBottom:'24px', padding:'32px'}}>
        <div className="flex-between">
          <div>
            {/* 업체명 + 인증 배지 */}
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
              <div style={{
                width:'60px', height:'60px', borderRadius:'16px',
                background:'#eff6ff', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'28px'
              }}>
                🏢
              </div>
              <div>
                <h1 style={{fontSize:'22px', fontWeight:'800', color:'#111827', marginBottom:'4px'}}>
                  {bizProfile.bizName}
                </h1>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <span className="badge badge-green">✅ 인증업체</span>
                  <span className="badge badge-blue">{bizProfile.category}</span>
                </div>
              </div>
            </div>

            {/* 업체 소개 */}
            <p style={{fontSize:'14px', color:'#4b5563', lineHeight:'1.8', marginBottom:'16px'}}>
              {bizProfile.description}
            </p>

            {/* 기본 정보 */}
            <div style={{display:'flex', gap:'20px', fontSize:'13px', color:'#6b7280'}}>
              <span>📍 {bizProfile.region}</span>
              <span>📅 {formatDate(bizProfile.registeredAt)} 등록</span>
              <span>🔄 거래 {bizProfile.dealCount || 0}건</span>
            </div>
          </div>

          {/* 평점 요약 */}
          <div style={{textAlign:'center', minWidth:'120px'}}>
            <div style={{fontSize:'48px', fontWeight:'800', color:'#111827', lineHeight:'1'}}>
              {bizProfile.rating > 0 ? bizProfile.rating.toFixed(1) : '0.0'}
            </div>
            <div style={{color:'#fbbf24', fontSize:'24px', margin:'8px 0'}}>
              {'★'.repeat(Math.round(bizProfile.rating || 0))}
              {'☆'.repeat(5 - Math.round(bizProfile.rating || 0))}
            </div>
            <div style={{fontSize:'13px', color:'#9ca3af'}}>
              리뷰 {bizProfile.reviewCount || 0}개
            </div>
          </div>
        </div>

        {/* 별점 분포 */}
        {reviews.length > 0 && (
          <div style={{marginTop:'24px', paddingTop:'24px', borderTop:'1px solid #f3f4f6'}}>
            <p style={{fontSize:'14px', fontWeight:'700', color:'#374151', marginBottom:'12px'}}>
              별점 분포
            </p>
            {ratingCounts.map(({ star, count }) => (
              <div key={star} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px'}}>
                <span style={{fontSize:'13px', color:'#6b7280', width:'20px'}}>{star}★</span>
                <div style={{flex:1, background:'#f3f4f6', borderRadius:'999px', height:'8px'}}>
                  <div style={{
                    width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%',
                    background:'#fbbf24', borderRadius:'999px', height:'8px',
                    transition:'width 0.3s'
                  }} />
                </div>
                <span style={{fontSize:'13px', color:'#9ca3af', width:'20px'}}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div>
        <h2 style={{fontSize:'18px', fontWeight:'700', color:'#111827', marginBottom:'16px'}}>
          리뷰 ({reviews.length}개)
        </h2>

        {reviews.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-text">아직 작성된 리뷰가 없습니다</p>
          </div>
        ) : (
          <div className="space-y">
            {reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex-between" style={{marginBottom:'8px'}}>
                  <div>
                    <span style={{fontWeight:'700', fontSize:'14px', color:'#111827'}}>
                      {review.reviewerName}
                    </span>
                    <span style={{fontSize:'12px', color:'#9ca3af', marginLeft:'8px'}}>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div style={{color:'#fbbf24', fontSize:'16px'}}>
                    {'★'.repeat(review.rating)}
                    <span style={{color:'#e5e7eb'}}>{'★'.repeat(5 - review.rating)}</span>
                  </div>
                </div>
                <p style={{fontSize:'14px', color:'#4b5563', lineHeight:'1.6'}}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BizProfile