'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function QuizTest() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Создаем подключение к Socket.IO серверу
    const socketInstance = io('http://localhost:3002', {
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
      setMessage('Connected to server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setMessage(`Connection error: ${error.message}`);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setMessage(`Socket error: ${error.message}`);
    });

    setSocket(socketInstance);

    // Очистка при размонтировании
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleJoinQuiz = () => {
    if (socket) {
      socket.emit('join-quiz', 'TEST123');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Socket.IO Test</h2>
      <div className="mb-4">
        <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
        <p>Message: {message}</p>
      </div>
      <button
        onClick={handleJoinQuiz}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        disabled={!connected}
      >
        Join Test Quiz
      </button>
    </div>
  );
} 