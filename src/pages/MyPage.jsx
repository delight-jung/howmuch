import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { getUserData, saveBizProfile } from '../store/authStore'
import { getMyRequests, getAllRequests, deleteRequest, cancelQuote } from '../store/quoteStore'
import { formatDate, isExpired } from '../utils/dateUtils'

const REGIONS = ['전국','서울','경기','인천','부산','대구','대전','광주','울산','강원','충북','충남','전북','전남','경북','경남','제주']

function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(true)

  // 내 정보 수정
  const [nameForm, setNameForm] = useState({ name: '' })
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ currentPw: '', newPw: '', confirmPw: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  // 업체 프로필 수정
  const [bizForm, setBizForm] = useState({ bizName:'', category:'', description:'', region:'전국' })
  const [bizLoading, setBizLoading] = useState(false)
  const [bizSuccess, setBizSuccess] = useState('')
  const [bizError, setBizError] = useState('')

  // 거래 내역
  const [myRequests, setMyRequests] = useState([])
  const [myQuotes, setMyQuotes] = useState([])

  const loadData = async (currentUser) => {
    const data = await getUserData(currentUser.uid)
    setUserData(data)
    setNameForm({ name: currentUser.displayName || '' })
    if (data?.bizProfile) {
      setBizForm({
        bizName: data.bizProfile.bizName || '',
        category: data.bizProfile.category || '',
        description: data.bizProfile.description || '',
        region: data.bizProfile.region || '전국',
      })
    }
    const requests = await getMyRequests(currentUser.uid)
    setMyRequests(requests)
    const all = await getAllRequests()
    const submitted = all.filter(r =>
      r.quotes && r.quotes.some(q => q.bizId === currentUser.uid)
    )
    setMyQuotes(submitted)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return }
      setUser(currentUser)
      await loadData(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // 이름 변경
  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')
    if (!nameForm.name.trim()) {
      setNameError('이름을 입력해주세요.')
      return
    }
    setNameLoading(true)
    try {
      await updateProfile(user, { displayName: nameForm.name })
      setNameSuccess('이름이 성공적으로 변경되었습니다!')
    } catch (error) {
      setNameError('이름 변경 중 오류가 발생했습니다.')
    }
    setNameLoading(false)
  }

  // 비밀번호 변경
  const handlePwSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (!pwForm.currentPw || !pwForm.newPw || !pwForm.confirmPw) {
      setPwError('모든 항목을 입력해주세요.')
      return
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setPwLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.currentPw)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, pwForm.newPw)
      setPwSuccess('비밀번호가 성공적으로 변경되었습니다!')
      setPwForm({ currentPw: '', newPw: '', confirmPw: '' })
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPwError('현재 비밀번호가 올바르지 않습니다.')
      } else {
        setPwError('비밀번호 변경 중 오류가 발생했습니다.')
      }
    }
    setPwLoading(false)
  }

  // 업체 프로필 수정
  const handleBizSubmit = async (e) => {
    e.preventDefault()
    setBizError('')
    setBizSuccess('')
    if (!bizForm.bizName || !bizForm.category || !bizForm.description) {
      setBizError('모든 항목을 입력해주세요.')
      return
    }
    setBizLoading(true)
    try {
      const updatedProfile = {
        ...userData.bizProfile,
        bizName: bizForm.bizName,
        category: bizForm.category,
        description: bizForm.description,
        region: bizForm.region,
      }
      await saveBizProfile(updatedProfile)
      setBizSuccess('업체 프로필이 성공적으로 수정되었습니다!')
      await loadData(user)
    } catch (error) {
      setBizError('업체 프로필 수정 중 오류가 발생했습니다.')
    }
    setBizLoading(false)
  }

  // 견적 요청 삭제
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('이 견적 요청을 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.')) return
    const result = await deleteRequest(requestId)
    if (result.success) {
      await loadData(user)
    } else {
      alert(result.message)
    }
  }

  // 제출한 견적 삭제
  const handleDeleteQuote = async (requestId, quoteId, isClosed) => {
    const message = isClosed
      ? '완료된 견적입니다. 그래도 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.'
      : '제출한 견적을 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.'
    if (!window.confirm(message)) return
    const result = await cancelQuote(requestId, quoteId)
    if (result.success) {
      await loadData(user)
    } else {
      alert(result.message)
    }
  }

  if (loading) return (
    <div style={{textAlign:'center', padding:'80px', color:'#6b7280'}}>
      불러오는 중...
    </div>
  )

  return (
    <div className="page" style={{maxWidth:'680px'}}>
      <h1 className="page-title" style={{marginBottom:'24px'}}>마이페이지</h1>

      {/* 프로필 요약 */}
      <div className="card" style={{marginBottom:'24px', padding:'24px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <div style={{
            width:'56px', height:'56px', borderRadius:'50%',
            background:'#eff6ff', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'24px'
          }}>
            👤
          </div>
          <div>
            <p style={{fontWeight:'700', fontSize:'18px', color:'#111827'}}>
              {user?.displayName}
            </p>
            <p style={{fontSize:'13px', color:'#6b7280'}}>{user?.email}</p>
            {userData?.bizProfile && (
              <span className="badge badge-green"
                style={{marginTop:'4px', display:'inline-block'}}>
                ✅ 인증업체 · {userData.bizProfile.bizName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="tabs">
        <button onClick={() => setTab('info')}
          className={`tab ${tab === 'info' ? 'tab-active' : 'tab-inactive'}`}>
          내 정보 수정
        </button>
        {userData?.bizProfile && (
          <button onClick={() => setTab('biz')}
            className={`tab ${tab === 'biz' ? 'tab-active' : 'tab-inactive'}`}>
            업체 프로필
          </button>
        )}
        <button onClick={() => setTab('history')}
          className={`tab ${tab === 'history' ? 'tab-active' : 'tab-inactive'}`}>
          거래 내역
        </button>
      </div>

      {/* 내 정보 수정 탭 */}
      {tab === 'info' && (
        <div className="space-y">
          {/* 이름 변경 */}
          <div className="card">
            <h2 style={{fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'#111827'}}>
              이름 변경
            </h2>
            <form onSubmit={handleNameSubmit}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" value={nameForm.name}
                  onChange={(e) => setNameForm({ name: e.target.value })}
                  placeholder="새 이름 입력" className="input" />
              </div>
              {nameError && <p className="form-error">{nameError}</p>}
              {nameSuccess && (
                <p style={{color:'#16a34a', fontSize:'13px', marginBottom:'8px'}}>
                  ✅ {nameSuccess}
                </p>
              )}
              <button type="submit" className="btn btn-primary btn-full"
                disabled={nameLoading}>
                {nameLoading ? '변경 중...' : '이름 변경'}
              </button>
            </form>
          </div>

          {/* 비밀번호 변경 */}
          <div className="card">
            <h2 style={{fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'#111827'}}>
              비밀번호 변경
            </h2>
            <form onSubmit={handlePwSubmit}>
              <div className="form-group">
                <label className="form-label">현재 비밀번호</label>
                <input type="password" value={pwForm.currentPw}
                  onChange={(e) => setPwForm({...pwForm, currentPw: e.target.value})}
                  placeholder="현재 비밀번호 입력" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">새 비밀번호</label>
                <input type="password" value={pwForm.newPw}
                  onChange={(e) => setPwForm({...pwForm, newPw: e.target.value})}
                  placeholder="새 비밀번호 입력 (6자 이상)" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">새 비밀번호 확인</label>
                <input type="password" value={pwForm.confirmPw}
                  onChange={(e) => setPwForm({...pwForm, confirmPw: e.target.value})}
                  placeholder="새 비밀번호 재입력" className="input" />
              </div>
              {pwError && <p className="form-error">{pwError}</p>}
              {pwSuccess && (
                <p style={{color:'#16a34a', fontSize:'13px', marginBottom:'8px'}}>
                  ✅ {pwSuccess}
                </p>
              )}
              <button type="submit" className="btn btn-primary btn-full"
                disabled={pwLoading}>
                {pwLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 업체 프로필 수정 탭 */}
      {tab === 'biz' && userData?.bizProfile && (
        <div className="card">
          <h2 style={{fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'#111827'}}>
            업체 프로필 수정
          </h2>
          <form onSubmit={handleBizSubmit}>
            <div className="form-group">
              <label className="form-label">업체명</label>
              <input type="text" value={bizForm.bizName}
                onChange={(e) => setBizForm({...bizForm, bizName: e.target.value})}
                placeholder="업체명 입력" className="input" />
            </div>
            <div className="form-group">
              <label className="form-label">업종/카테고리</label>
              <input type="text" value={bizForm.category}
                onChange={(e) => setBizForm({...bizForm, category: e.target.value})}
                placeholder="예) IT기기, 인테리어, 디자인" className="input" />
            </div>
            <div className="form-group">
              <label className="form-label">업체 소개</label>
              <textarea value={bizForm.description}
                onChange={(e) => setBizForm({...bizForm, description: e.target.value})}
                placeholder="업체 소개를 입력해주세요"
                rows={4} className="textarea" />
            </div>
            <div className="form-group">
              <label className="form-label">활동 지역</label>
              <select value={bizForm.region}
                onChange={(e) => setBizForm({...bizForm, region: e.target.value})}
                className="select">
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            {bizError && <p className="form-error">{bizError}</p>}
            {bizSuccess && (
              <p style={{color:'#16a34a', fontSize:'13px', marginBottom:'8px'}}>
                ✅ {bizSuccess}
              </p>
            )}
            <button type="submit" className="btn btn-green btn-full"
              disabled={bizLoading}>
              {bizLoading ? '저장 중...' : '프로필 저장'}
            </button>
          </form>
        </div>
      )}

      {/* 거래 내역 탭 */}
      {tab === 'history' && (
        <div className="space-y">
          {/* 소비자 견적 요청 내역 */}
          <div className="card">
            <h2 style={{fontSize:'16px', fontWeight:'700', marginBottom:'16px', color:'#111827'}}>
              📋 내가 요청한 견적 ({myRequests.length}건)
            </h2>
            {myRequests.length === 0 ? (
              <p style={{fontSize:'13px', color:'#9ca3af', textAlign:'center', padding:'16px'}}>
                견적 요청 내역이 없습니다
              </p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {myRequests.map((req) => (
                  <div key={req.id} style={{
                    padding:'16px', background:'#f9fafb',
                    borderRadius:'12px', border:'1px solid #e5e7eb'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <p style={{fontWeight:'700', fontSize:'14px', color:'#111827', marginBottom:'4px'}}>
                          {req.title}
                        </p>
                        <div style={{display:'flex', flexWrap:'wrap', gap:'8px',
                          fontSize:'12px', color:'#9ca3af'}}>
                          <span>💰 {Number(req.budget).toLocaleString()}원</span>
                          <span>📍 {req.region}</span>
                          <span>📅 {formatDate(req.createdAt)}</span>
                          <span>견적 {req.quotes ? req.quotes.length : 0}개</span>
                        </div>
                      </div>
                      <div style={{display:'flex', flexDirection:'column',
                        alignItems:'flex-end', gap:'8px', marginLeft:'12px'}}>
                        {req.status === 'closed' ? (
                          <span className="badge badge-gray">마감</span>
                        ) : isExpired(req.deadline) ? (
                          <span className="badge badge-red">기간만료</span>
                        ) : (
                          <span className="badge badge-blue">진행중</span>
                        )}
                        <div style={{display:'flex', gap:'6px'}}>
                          <button
                            onClick={() => navigate(`/consumer/quotes/${req.id}`)}
                            className="btn btn-secondary"
                            style={{fontSize:'11px', padding:'4px 10px'}}>
                            보기
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="btn btn-red"
                            style={{fontSize:'11px', padding:'4px 10px'}}>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 업체로서 제출한 견적 내역 */}
          <div className="card">
            <h2 style={{fontSize:'16px', fontWeight:'700', marginBottom:'16px', color:'#111827'}}>
              📝 내가 제출한 견적 ({myQuotes.length}건)
            </h2>
            {myQuotes.length === 0 ? (
              <p style={{fontSize:'13px', color:'#9ca3af', textAlign:'center', padding:'16px'}}>
                제출한 견적 내역이 없습니다
              </p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {myQuotes.map((req) => {
                  const myQuote = req.quotes.find(q => q.bizId === user.uid)
                  const isSelected = req.selectedQuoteId === myQuote?.id
                  const isClosed = req.status === 'closed'
                  return (
                    <div key={req.id} style={{
                      padding:'16px', background:'#f9fafb',
                      borderRadius:'12px', border:'1px solid #e5e7eb'
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <p style={{fontWeight:'700', fontSize:'14px', color:'#111827', marginBottom:'4px'}}>
                            {req.title}
                          </p>
                          <p style={{fontSize:'16px', fontWeight:'800', color:'#2563eb', marginBottom:'4px'}}>
                            {Number(myQuote?.price).toLocaleString()}원
                          </p>
                          <div style={{display:'flex', flexWrap:'wrap', gap:'8px',
                            fontSize:'12px', color:'#9ca3af'}}>
                            <span>📅 납기일: {formatDate(myQuote?.deliveryDate)}</span>
                            <span>🕐 제출일: {formatDate(myQuote?.createdAt)}</span>
                          </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column',
                          alignItems:'flex-end', gap:'8px', marginLeft:'12px'}}>
                          {isSelected ? (
                            <span className="badge badge-blue">🎉 선택됨</span>
                          ) : isClosed ? (
                            <span className="badge badge-gray">미선택</span>
                          ) : (
                            <span className="badge badge-yellow">검토중</span>
                          )}
                          <button
                            onClick={() => handleDeleteQuote(req.id, myQuote?.id, isClosed)}
                            className="btn btn-red"
                            style={{fontSize:'11px', padding:'4px 10px'}}>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPage