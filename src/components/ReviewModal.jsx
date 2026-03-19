import { useState } from 'react'

function ReviewModal({ bizName, onSubmit, onClose }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (rating === 0) {
      setError('별점을 선택해주세요.')
      return
    }
    if (!comment.trim()) {
      setError('리뷰 내용을 입력해주세요.')
      return
    }
    setLoading(true)
    await onSubmit({ rating, comment })
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{fontSize:'18px', fontWeight:'700', marginBottom:'8px'}}>
          리뷰 작성
        </h3>
        <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'24px'}}>
          <strong style={{color:'#111827'}}>{bizName}</strong> 업체에 대한 리뷰를 작성해주세요
        </p>

        <form onSubmit={handleSubmit}>
          {/* 별점 선택 */}
          <div className="form-group">
            <label className="form-label">별점</label>
            <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    fontSize:'36px',
                    cursor:'pointer',
                    color: star <= (hoverRating || rating) ? '#fbbf24' : '#e5e7eb',
                    transition:'color 0.1s'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            {rating > 0 && (
              <p style={{fontSize:'13px', color:'#6b7280', marginTop:'8px'}}>
                {rating === 1 && '⭐ 매우 불만족'}
                {rating === 2 && '⭐⭐ 불만족'}
                {rating === 3 && '⭐⭐⭐ 보통'}
                {rating === 4 && '⭐⭐⭐⭐ 만족'}
                {rating === 5 && '⭐⭐⭐⭐⭐ 매우 만족'}
              </p>
            )}
          </div>

          {/* 리뷰 내용 */}
          <div className="form-group">
            <label className="form-label">리뷰 내용</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="업체와의 거래 경험을 자세히 작성해주세요"
              rows={4}
              className="textarea"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
            <button type="button" onClick={onClose}
              className="btn btn-secondary" style={{flex:1, padding:'14px'}}>
              취소
            </button>
            <button type="submit" className="btn btn-primary"
              style={{flex:1, padding:'14px'}} disabled={loading}>
              {loading ? '제출 중...' : '리뷰 작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewModal