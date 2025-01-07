"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUserService } from '@/app/data/services/auth-service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    nickname: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      const response = await registerUserService(formData);
      
      sessionStorage.setItem('signupSuccess', 'true');
      sessionStorage.setItem('fromSignup', 'true');
      
      router.replace('/login');
      
      console.log('User registered:', response);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      toast.error('회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4">회원가입</h2>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-2 mb-4 border rounded"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          name="nickname"
          placeholder="Nickname"
          value={formData.nickname}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button className="w-full p-2 bg-blue-500 text-white rounded" type="submit">
          Sign Up
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} />
    </div>
  );
}
