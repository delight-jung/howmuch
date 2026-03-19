// 날짜 관련 유틸 함수

// 오늘 날짜 기준 마감일(7일 후) 계산
export const getDeadline = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString()
}

// 마감 여부 확인
export const isExpired = (deadline) => {
  return new Date() > new Date(deadline)
}

// 날짜를 읽기 좋은 형식으로 변환 (예: 2026.03.03)
export const formatDate = (isoString) => {
  const date = new Date(isoString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

// 마감까지 남은 날 계산
export const daysLeft = (deadline) => {
  const diff = new Date(deadline) - new Date()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

// 숫자에 콤마 추가
export const formatPrice = (value) => {
  if (!value) return ''
  return Number(value.toString().replace(/,/g, '')).toLocaleString()
}

// 콤마 제거 후 숫자만 반환
export const parsePrice = (value) => {
  return value.toString().replace(/,/g, '')
}