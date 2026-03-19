import { useState } from 'react'
import { uploadFile, isImage, checkFileSize, formatFileSize } from '../cloudinary'

function FileUpload({ onUploadComplete, maxFiles = 5 }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    setError('')

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`최대 ${maxFiles}개까지 첨부 가능합니다.`)
      return
    }

    const oversizedFiles = selectedFiles.filter(f => !checkFileSize(f))
    if (oversizedFiles.length > 0) {
      setError('파일 크기는 10MB 이하만 가능합니다.')
      return
    }

    setUploading(true)
    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await uploadFile(file)
          return {
            ...result,
            name: file.name,
            size: file.size,
          }
        })
      )
      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)
      onUploadComplete(newFiles)
    } catch (err) {
      setError('파일 업로드 중 오류가 발생했습니다.')
    }
    setUploading(false)
  }

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onUploadComplete(newFiles)
  }

  const handleOpen = (url, format) => {
  const isPdf = format === 'pdf'
  const link = document.createElement('a')
  // PDF는 다운로드, 이미지는 새 탭에서 열기
  if (isPdf) {
    // Cloudinary PDF 변환 URL로 변경
    const pngUrl = url.replace('/upload/', '/upload/f_png/')
    link.href = pngUrl
  } else {
    link.href = url
  }
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
  return (
    <div>
      {/* 업로드 버튼 */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        border: '2px dashed #e5e7eb',
        borderRadius: '12px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: uploading ? '#f9fafb' : 'white',
        color: '#6b7280',
        fontSize: '14px',
      }}>
        <span style={{fontSize: '20px'}}>📎</span>
        {uploading ? '업로드 중...' : `파일 첨부 (최대 ${maxFiles}개, 각 10MB 이하)`}
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading || files.length >= maxFiles}
          style={{display: 'none'}}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </label>

      {error && (
        <p style={{color: '#ef4444', fontSize: '13px', marginTop: '8px'}}>
          {error}
        </p>
      )}

      {/* 첨부된 파일 목록 */}
      {files.length > 0 && (
        <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {files.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}>
              {/* 미리보기 또는 아이콘 - 클릭시 파일 열기 */}
              <div
                onClick={() => handleOpen(file.url, file.format)}
                style={{cursor: 'pointer'}}
              >
                {isImage(file.format) ? (
                  <img src={file.url} alt={file.name}
                    style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px'}} />
                ) : (
                  <span style={{fontSize: '28px'}}>
                    {file.format === 'pdf' ? '📄' : '📋'}
                  </span>
                )}
              </div>

              {/* 파일 정보 - 클릭시 파일 열기 */}
              <div
                onClick={() => handleOpen(file.url, file.format)}
                style={{flex: 1, minWidth: 0, cursor: 'pointer'}}
              >
                <p style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2563eb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: 'underline'
                }}>
                  {file.name}
                </p>
                <p style={{fontSize: '12px', color: '#9ca3af'}}>
                  {formatFileSize(file.size)} · 클릭하여 열기
                </p>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleRemove(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '18px',
                  padding: '4px'
                }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload