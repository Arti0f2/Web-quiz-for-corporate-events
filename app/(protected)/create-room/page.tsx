'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

export default function CreateRoomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('quizId');
  const nickname = searchParams.get('nickname');
  
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Validate inputs
    if (!quizId || !nickname) {
      setError('Відсутній ID вікторини або нікнейм');
      setIsCreating(false);
      return;
    }
    
    // Connect to socket and create room
    const socket = io(window.location.origin, { 
      transports: ['websocket'] 
    });
    
    socket.on('connect', () => {
      // Create a new room
      socket.emit('create-room', { 
        quizId: parseInt(quizId, 10), 
        nickname 
      });
    });
    
    socket.on('room-created', (data) => {
      const { code } = data;
      router.replace(`/room/${code}?nickname=${encodeURIComponent(nickname)}`);
    });
    
    socket.on('error', (data) => {
      setError(data.message);
      setIsCreating(false);
      
      setTimeout(() => {
        router.replace('/');
      }, 3000);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [quizId, nickname, router]);
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Toaster position="top-center" />
        
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Помилка</div>
          <p className="mb-6">{error}</p>
          <p className="text-gray-600 text-sm">Перенаправлення на головну сторінку...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="text-2xl font-bold text-gray-700 mb-4">Створення кімнати...</div>
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
} 