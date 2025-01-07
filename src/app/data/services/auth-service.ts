import { getStrapiURL } from "@/app/lib/utils";

interface RegisterUserProps {
  username: string;
  email: string;
  password: string;
  nickname: string;
}

const baseUrl = getStrapiURL();

export async function registerUserService(userData: RegisterUserProps) {
  const url = new URL("/api/auth/local/register", baseUrl);

  try {
    // 1단계: 기본 회원가입 (nickname 제외)
    const registerData = {
      username: userData.username,
      email: userData.email,
      password: userData.password
    };

    console.log('Request URL:', url.toString());
    console.log('Sending registration data:', registerData);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });
    
    const responseData = await response.json();

    if (responseData.error) {
      throw new Error(responseData.error.message || '회원가입 요청 실패');
    }

    // 2단계: 회원가입 성공 후 nickname 업데이트
    if (responseData.jwt) {
      const updateUrl = new URL(`/api/users/${responseData.user.id}`, baseUrl);
      
      const updateResponse = await fetch(updateUrl.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${responseData.jwt}`
        },
        body: JSON.stringify({
          nickname: userData.nickname
        }),
      });

      if (!updateResponse.ok) {
        console.error('Nickname update failed');
      }
    }

    return responseData;
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
  const url = new URL("/api/auth/local", baseUrl);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '로그인 요청 실패');
    }

    return response.json();
  } catch (error) {
    console.error("Login Service Error:", error);
    throw error;
  }
}
