'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { PlayerRole, Player, Category, Question, Quiz } from '@/types/quiz';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = params.code as string;
  const nickname = searchParams.get('nickname');
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Role selection modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  
  useEffect(() => {
    // Redirect if no nickname
    if (!nickname) {
      router.replace('/');
      return;
    }
    
    // Connect to socket server
    const newSocket = io(window.location.origin, { 
      transports: ['websocket'] 
    });
    
    setSocket(newSocket);
    
    // Set up event listeners
    newSocket.on('connect', () => {
      // Join the room
      setIsJoining(true);
      newSocket.emit('join-room', { code: roomCode, nickname });
    });
    
    newSocket.on('room-joined', (data) => {
      setIsJoining(false);
      setPlayers(data.players);
      setQuiz(data.quiz);
      
      // Find current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
    });
    
    newSocket.on('player-joined', (data) => {
      setPlayers(data.players);
      
      // Update current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
      
      toast.success(`Гравець ${player?.nickname} приєднався до кімнати`);
    });
    
    newSocket.on('player-removed', (data) => {
      setPlayers(data.players);
      
      // Update current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
    });
    
    newSocket.on('removed-from-room', () => {
      toast.error('Вас було видалено з кімнати');
      router.replace('/');
    });
    
    newSocket.on('roles-updated', (data) => {
      setPlayers(data.players);
      
      // Update current player
      const player = data.players.find((p: Player) => p.nickname === nickname);
      setCurrentPlayer(player || null);
      
      toast.success('Ролі було оновлено');
    });
    
    newSocket.on('game-started', (data) => {
      setGameStarted(true);
      setPlayers(data.players);
      
      // Route to game page
      router.push(`/game/${roomCode}?nickname=${encodeURIComponent(nickname)}`);
    });
    
    newSocket.on('error', (data) => {
      toast.error(data.message);
      
      // If it's a critical error, redirect to home
      if (data.message === 'Room not found or inactive' || 
          data.message === 'Game has already started') {
        router.replace('/');
      }
    });
    
    // Clean up
    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, nickname, router]);
  
  const isHost = currentPlayer?.role === PlayerRole.HOST || currentPlayer?.role === PlayerRole.HOST_PLAYER;
  
  const handleStartGame = () => {
    if (!socket) return;
    
    // Check min player count
    const playersCount = players.filter(p => p.role === PlayerRole.PLAYER || p.role === PlayerRole.HOST_PLAYER).length;
    const hostExists = players.some(p => p.role === PlayerRole.HOST);
    const hostPlayerExists = players.some(p => p.role === PlayerRole.HOST_PLAYER);
    
    // Check if we have either a host or a host-player
    if (!hostExists && !hostPlayerExists) {
      return toast.error('Необхідно мати хоча б одного ведучого');
    }
    
    // Check minimum player count (3 if host-player, 4 if separate host)
    const minPlayers = hostPlayerExists ? 1 : 1;
    if (playersCount < minPlayers) {
      return toast.error(`Необхідно мати мінімум ${minPlayers} гравців`);
    }
    
    socket.emit('start-game', { code: roomCode });
  };
  
  const handleRemovePlayer = (playerId: string) => {
    if (!socket || !isHost) return;
    socket.emit('remove-player', { code: roomCode, playerId });
  };
  
  const openRoleModal = (playerId: string) => {
    if (!isHost) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    setSelectedPlayer(playerId);
    setSelectedRole(player.role);
    setShowRoleModal(true);
  };
  
  const handleUpdateRole = () => {
    if (!socket || !selectedPlayer || !selectedRole) return;
    
    socket.emit('update-role', { 
      code: roomCode, 
      playerId: selectedPlayer, 
      role: selectedRole 
    });
    
    setShowRoleModal(false);
    setSelectedPlayer(null);
    setSelectedRole(null);
  };
  
  if (isJoining) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-700 mb-4">Приєднуємось до кімнати...</div>
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Кімната {roomCode}</h1>
            <p className="text-sm text-gray-600">
              Тематика: {quiz?.title || 'Завантаження...'}
            </p>
          </div>
          
          {isHost && (
            <button
              onClick={handleStartGame}
              className="mt-4 sm:mt-0 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Почати гру
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Гравці</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <div 
                key={player.id}
                className={`p-4 border rounded-lg flex justify-between items-center ${
                  player.id === currentPlayer?.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="font-medium">{player.nickname}</div>
                  <div className="text-sm text-gray-600">
                    {player.role === PlayerRole.HOST && 'Ведучий'}
                    {player.role === PlayerRole.HOST_PLAYER && 'Ведучий + Гравець'}
                    {player.role === PlayerRole.PLAYER && 'Гравець'}
                  </div>
                </div>
                
                {isHost && player.id !== currentPlayer?.id && !gameStarted && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openRoleModal(player.id)}
                      className="p-1 text-indigo-600 hover:text-indigo-800"
                      title="Змінити роль"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleRemovePlayer(player.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Видалити гравця"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Role info section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Інформація про ролі</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Ведучий + Гравець:</strong> Людина, яка має адмін-панель та може грати. Може бути лише 1.</p>
            <p><strong>Ведучий:</strong> Людина, яка має адмін-панель, але не грає. Може бути лише 1.</p>
            <p><strong>Гравець:</strong> Людина, яка бере участь у грі. Може бути 1-6 (якщо є ведучий+гравець не більше 5).</p>
            <p className="text-xs text-gray-500 mt-2">
              Роль ведучий і ведучий+гравець не можуть бути одночасно.
            </p>
          </div>
        </div>
      </div>
      
      {/* Role selection modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Вибрати роль</h2>
            
            <div className="mb-4 space-y-2">
              <div
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedRole === PlayerRole.PLAYER ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
                onClick={() => setSelectedRole(PlayerRole.PLAYER)}
              >
                Гравець
              </div>
              <div
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedRole === PlayerRole.HOST ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
                onClick={() => setSelectedRole(PlayerRole.HOST)}
              >
                Ведучий
              </div>
              <div
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedRole === PlayerRole.HOST_PLAYER ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                }`}
                onClick={() => setSelectedRole(PlayerRole.HOST_PLAYER)}
              >
                Ведучий + Гравець
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Скасувати
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 