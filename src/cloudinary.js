// Cloudinary 설정
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// 파일 업로드 함수
export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('cloud_name', CLOUD_NAME)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('파일 업로드 실패')
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
  }
}

// 이미지 여부 확인
export const isImage = (format) => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format?.toLowerCase())
}

// 파일 크기 제한 확인 (10MB)
export const checkFileSize = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return file.size <= maxSize
}

// 파일 크기를 읽기 좋은 형식으로 변환
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}