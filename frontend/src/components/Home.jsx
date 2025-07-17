// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';

// const Home = () => {
//   const [roomId, setRoomId] = useState('');
//   const navigate = useNavigate();

//   const handleJoin = () => {
//     if (roomId.trim() !== '') {
//       navigate(`/room/${roomId}`);
//     }
//   };

//   const handleCreate = () => {
//     const newRoomId = uuidv4();
//     navigate(`/room/${newRoomId}`);
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen px-4 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 animate-backgroundPulse">
//       <h1 className="text-5xl font-bold mb-8 text-white animate-pulse drop-shadow-lg text-center">
//         Real-Time Video Chat
//       </h1>

//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 animate-fadeIn transition duration-500 ease-in-out">
//         <input
//           type="text"
//           placeholder="Enter Room ID"
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//           className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
//         />

//         <button
//           onClick={handleJoin}
//           className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 hover:scale-105 transition-transform duration-300"
//         >
//           Join Room
//         </button>

//         <button
//           onClick={handleCreate}
//           className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 hover:scale-105 transition-transform duration-300"
//         >
//           Create New Room
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Home;














import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [code, setCode] = useState('');
  const nav = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-800 to-black text-white">
      <h1 className="text-5xl font-bold mb-8">Real-Time Video Chat</h1>
      <div className="bg-white/10 p-8 rounded-xl shadow-lg backdrop-blur space-y-4">
        <input 
          value={code} onChange={e => setCode(e.target.value)}
          placeholder="Enter room ID" className="w-full p-3 rounded-lg bg-white/20"
        />
        <button onClick={() => nav(`/room/${code.trim()}`)} className="w-full bg-blue-500 py-2 rounded-lg">Join Room</button>
        <button onClick={() => nav(`/room/${uuidv4()}`)} className="w-full bg-green-500 py-2 rounded-lg">Create New Room</button>
      </div>
    </div>
  );
}
