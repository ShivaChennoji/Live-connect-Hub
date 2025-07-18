import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [code, setCode] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const nav = useNavigate();

  const handleCreateRoom = () => {
    const id = uuidv4();
    setNewRoomId(id);  
    nav(`/room/${id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-800 to-black text-white">
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center">Real-Time Video Chat</h1>
      
      <div className="bg-white/10 p-6 sm:p-8 rounded-xl shadow-lg backdrop-blur space-y-4 w-full max-w-md">
        <input 
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter room ID"
          className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/80"
        />
        <button
          onClick={() => nav(`/room/${code.trim()}`)}
          className="w-full bg-blue-600 hover:green-700 transition py-2 rounded-lg"
        >
          Join Room
        </button>
        <button
          onClick={handleCreateRoom}
          className="w-full bg-blue-600 hover:bg-green-700 transition py-2 rounded-lg"
        >
          Create New Room
        </button>

        {newRoomId && (
          <div className="text-sm mt-2 text-center">
            Share this Room ID: <span className="font-mono">{newRoomId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
