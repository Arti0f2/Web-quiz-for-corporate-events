'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleJoin = () => {
    if (!nickname) {
      toast.error('Будь ласка, введіть нікнейм');
      return;
    }
    
    localStorage.setItem('tempNickname', nickname);
    router.push('/dashboard');
  };
  
  const handleCreateQuiz = () => {
    if (isLoggedIn) {
      if (!nickname) {
        toast.error('Будь ласка, введіть нікнейм');
        return;
      }
      
      localStorage.setItem('tempNickname', nickname);
      router.push('/create-quiz');
    } else {
      toast.error('Для створення вікторини необхідно авторизуватися');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-purple-100 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">Web Quizzes</h1>
        
        <div className="space-y-4">
          {/* Nickname input */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Нікнейм
            </label>
            <input
              type="text"
              id="nickname"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Введіть ваш нікнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleJoin}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Приєднатися
            </button>
            
            <button
              onClick={handleCreateQuiz}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Створити вікторину
            </button>
          </div>

          {/* Auth links */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center space-x-4">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setIsLoggedIn(false);
                  toast.success('Ви вийшли з системи');
                }}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Вийти
              </button>
            ) : (
              <>
                <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Увійти
                </Link>
                <Link href="/register" className="text-green-600 hover:text-green-800 font-medium">
                  Зареєструватися
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 