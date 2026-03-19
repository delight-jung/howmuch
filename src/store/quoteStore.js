import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getDeadline } from '../utils/dateUtils'

// 전체 견적 요청 목록 가져오기
export const getAllRequests = async () => {
  try {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('getAllRequests 오류:', error)
    return []
  }
}

// 내가 올린 견적 요청 가져오기
export const getMyRequests = async (userId) => {
  try {
    const all = await getAllRequests()
    return all.filter(r => r.userId === userId)
  } catch (error) {
    console.error('getMyRequests 오류:', error)
    return []
  }
}

// 견적 요청 단건 가져오기
export const getRequestById = async (id) => {
  try {
    const docRef = doc(db, 'requests', id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.error('getRequestById 오류:', error)
    return null
  }
}

// 견적 요청 등록
export const addRequest = async (userId, userName, data) => {
  try {
    const newRequest = {
      userId,
      userName,
      title: data.title,
      description: data.description,
      budget: data.budget,
      region: data.region,
      deadline: getDeadline(),
      createdAt: new Date().toISOString(),
      status: 'open',
      quotes: [],
      attachments: data.attachments || [],
    }
    const docRef = await addDoc(collection(db, 'requests'), newRequest)
    return { id: docRef.id, ...newRequest }
  } catch (error) {
    console.error('addRequest 오류:', error)
    return null
  }
}

// 견적 제출 (업체)
export const submitQuote = async (requestId, bizUser, quoteData) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      return { success: false, message: '요청을 찾을 수 없습니다.' }
    }

    const requestData = requestSnap.data()
    const alreadySubmitted = requestData.quotes?.find(q => q.bizId === bizUser.uid)
    if (alreadySubmitted) {
      return { success: false, message: '이미 견적을 제출하셨습니다.' }
    }

    const newQuote = {
      id: Date.now().toString(),
      bizId: bizUser.uid,
      bizName: bizUser.bizProfile.bizName,
      bizRating: bizUser.bizProfile.rating || 0,
      bizReviewCount: bizUser.bizProfile.reviewCount || 0,
      price: quoteData.price,
      deliveryDate: quoteData.deliveryDate,
      message: quoteData.message,
      attachments: quoteData.attachments || [],
      createdAt: new Date().toISOString(),
    }

    await updateDoc(requestRef, {
      quotes: arrayUnion(newQuote)
    })

    return { success: true, quote: newQuote }
  } catch (error) {
    console.error('submitQuote 오류:', error)
    return { success: false, message: '견적 제출 중 오류가 발생했습니다.' }
  }
}

// 견적 선택 (소비자)
export const selectQuote = async (requestId, quoteId) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    await updateDoc(requestRef, {
      selectedQuoteId: quoteId,
      status: 'closed'
    })
  } catch (error) {
    console.error('selectQuote 오류:', error)
  }
}

// 견적 수정 (업체)
export const updateQuote = async (requestId, quoteId, updateData) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      return { success: false, message: '요청을 찾을 수 없습니다.' }
    }

    const requestData = requestSnap.data()
    const updatedQuotes = requestData.quotes.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          price: updateData.price,
          deliveryDate: updateData.deliveryDate,
          message: updateData.message,
          updatedAt: new Date().toISOString(),
        }
      }
      return q
    })

    await updateDoc(requestRef, { quotes: updatedQuotes })
    return { success: true }
  } catch (error) {
    console.error('updateQuote 오류:', error)
    return { success: false, message: '견적 수정 중 오류가 발생했습니다.' }
  }
}

// 견적 취소 (업체)
export const cancelQuote = async (requestId, quoteId) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      return { success: false, message: '요청을 찾을 수 없습니다.' }
    }

    const requestData = requestSnap.data()
    const updatedQuotes = requestData.quotes.filter(q => q.id !== quoteId)

    await updateDoc(requestRef, { quotes: updatedQuotes })
    return { success: true }
  } catch (error) {
    console.error('cancelQuote 오류:', error)
    return { success: false, message: '견적 취소 중 오류가 발생했습니다.' }
  }
}
// 견적 요청 수정 (소비자)
export const updateRequest = async (requestId, updateData) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    await updateDoc(requestRef, {
      title: updateData.title,
      description: updateData.description,
      budget: updateData.budget,
      region: updateData.region,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (error) {
    console.error('updateRequest 오류:', error)
    return { success: false, message: '견적 요청 수정 중 오류가 발생했습니다.' }
  }
}

// 견적 요청 삭제 (소비자)
export const deleteRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'requests', requestId)
    await deleteDoc(requestRef)
    return { success: true }
  } catch (error) {
    console.error('deleteRequest 오류:', error)
    return { success: false, message: '견적 요청 삭제 중 오류가 발생했습니다.' }
  }
}

// 리뷰 작성
export const addReview = async (requestId, bizId, reviewData) => {
  try {
    // 리뷰 저장
    await addDoc(collection(db, 'reviews'), {
      requestId,
      bizId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      reviewerName: reviewData.reviewerName,
      reviewerId: reviewData.reviewerId,
      createdAt: new Date().toISOString(),
    })

    // 업체 평점 업데이트
    const reviewsSnap = await getDocs(
      query(collection(db, 'reviews'))
    )
    const bizReviews = reviewsSnap.docs
      .map(doc => doc.data())
      .filter(r => r.bizId === bizId)

    const avgRating = bizReviews.reduce((sum, r) => sum + r.rating, 0) / bizReviews.length
    const reviewCount = bizReviews.length

    // Firestore users 컬렉션에서 업체 평점 업데이트
    const usersSnap = await getDocs(collection(db, 'users'))
    const bizUserDoc = usersSnap.docs.find(doc => doc.id === bizId)
    if (bizUserDoc) {
      await updateDoc(doc(db, 'users', bizId), {
        'bizProfile.rating': Math.round(avgRating * 10) / 10,
        'bizProfile.reviewCount': reviewCount,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('addReview 오류:', error)
    return { success: false, message: '리뷰 작성 중 오류가 발생했습니다.' }
  }
}

// 업체 리뷰 목록 가져오기
export const getBizReviews = async (bizId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.bizId === bizId)
  } catch (error) {
    console.error('getBizReviews 오류:', error)
    return []
  }
}

// 이미 리뷰 작성했는지 확인
export const hasReviewed = async (requestId, reviewerId) => {
  try {
    const q = query(collection(db, 'reviews'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map(doc => doc.data())
      .some(r => r.requestId === requestId && r.reviewerId === reviewerId)
  } catch (error) {
    return false
  }
}