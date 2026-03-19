import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

// 현재 로그인된 유저 가져오기
export const getCurrentUser = () => {
  return auth.currentUser
}

// 회원가입
export const registerUser = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // 이름 설정
    await updateProfile(user, { displayName: name })

    // Firestore에 유저 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
      bizProfile: null,
    })

    return { success: true, user }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: '이미 사용 중인 이메일입니다.' }
    }
    return { success: false, message: '회원가입 중 오류가 발생했습니다.' }
  }
}

// 로그인
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }
}

// 로그아웃
export const logoutUser = async () => {
  await signOut(auth)
}

// 유저 정보 가져오기 (Firestore)
export const getUserData = async (uid) => {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

// 업체 프로필 저장
export const saveBizProfile = async (profile) => {
  const user = auth.currentUser
  if (!user) return

  await setDoc(doc(db, 'users', user.uid), {
    bizProfile: profile
  }, { merge: true })
}

// 업체 프로필 가져오기
export const getBizProfile = async () => {
  const user = auth.currentUser
  if (!user) return null

  const userData = await getUserData(user.uid)
  return userData?.bizProfile || null
}