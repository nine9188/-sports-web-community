import { createClient } from "@/app/lib/supabase.server";

interface RegisterUserProps {
  username: string;
  email: string;
  password: string;
  nickname: string;
}

export async function registerUserService(userData: RegisterUserProps) {
  try {
    const supabase = await createClient();
    
    // Supabase Auth로 사용자 등록
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          nickname: userData.nickname
        }
      }
    });

    if (authError) {
      throw new Error(authError.message || '회원가입 요청 실패');
    }

    return {
      user: authData.user,
      session: authData.session
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

interface LoginUserProps {
  identifier: string;
  password: string;
}

export async function loginUserService(userData: LoginUserProps) {
  try {
    const supabase = await createClient();
    
    // Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.identifier,
      password: userData.password
    });

    if (authError) {
      throw new Error(authError.message || '로그인 요청 실패');
    }

    return {
      user: authData.user,
      session: authData.session
    };
  } catch (error) {
    console.error("Login Service Error:", error);
    throw error;
  }
}
