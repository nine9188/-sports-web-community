/**
 * 이메일 유효성 검사
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: '이메일을 입력해주세요.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다.' }
  }

  return { valid: true }
}

/**
 * 비밀번호 유효성 검사
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || !password.trim()) {
    return { valid: false, error: '비밀번호를 입력해주세요.' }
  }

  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' }
  }

  if (password.length > 72) {
    return { valid: false, error: '비밀번호는 최대 72자까지 가능합니다.' }
  }

  return { valid: true }
}

/**
 * 아이디(username) 유효성 검사
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: '아이디를 입력해주세요.' }
  }

  if (username.length < 3) {
    return { valid: false, error: '아이디는 최소 3자 이상이어야 합니다.' }
  }

  if (username.length > 20) {
    return { valid: false, error: '아이디는 최대 20자까지 가능합니다.' }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { valid: false, error: '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.' }
  }

  return { valid: true }
}

/**
 * 이름(fullName) 유효성 검사
 */
export function validateFullName(fullName: string): { valid: boolean; error?: string } {
  if (!fullName || !fullName.trim()) {
    return { valid: false, error: '이름을 입력해주세요.' }
  }

  const trimmed = fullName.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: '이름은 최소 2자 이상이어야 합니다.' }
  }

  if (trimmed.length > 20) {
    return { valid: false, error: '이름은 최대 20자까지 가능합니다.' }
  }

  // 한글, 영문, 공백만 허용
  const nameRegex = /^[가-힣a-zA-Z\s]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: '이름은 한글과 영문만 입력 가능합니다.' }
  }

  return { valid: true }
}

/**
 * 닉네임 유효성 검사
 */
export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  if (!nickname || !nickname.trim()) {
    return { valid: false, error: '닉네임을 입력해주세요.' }
  }

  if (nickname.length < 2) {
    return { valid: false, error: '닉네임은 최소 2자 이상이어야 합니다.' }
  }

  if (nickname.length > 15) {
    return { valid: false, error: '닉네임은 최대 15자까지 가능합니다.' }
  }

  return { valid: true }
}
