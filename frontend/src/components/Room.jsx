// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import socket from '../socket';

// const Room = () => {
//   const { roomId } = useParams();
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();
//   const peerConnection = useRef(null);

//   const [myStream, setMyStream] = useState(null);

//   useEffect(() => {
//     socket.emit('join-room', { roomId });

//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         setMyStream(stream);
//         if (localVideoRef.current) localVideoRef.current.srcObject = stream;
//       });

//     socket.on('user-joined', async ({ socketId }) => {
//       peerConnection.current = createPeer(socketId, true);
//     });

//     socket.on('receive-offer', async ({ offer, from }) => {
//       peerConnection.current = createPeer(from, false);
//       await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peerConnection.current.createAnswer();
//       await peerConnection.current.setLocalDescription(answer);
//       socket.emit('send-answer', { answer, to: from });
//     });

//     socket.on('receive-answer', async ({ answer }) => {
//       await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
//     });

//     socket.on('ice-candidate', ({ candidate }) => {
//       peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
//     });

//     return () => {
//       socket.disconnect();
//       peerConnection.current?.close();
//     };
//   }, []);

//   const createPeer = (remoteSocketId, isInitiator) => {
//     const pc = new RTCPeerConnection();

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('ice-candidate', { candidate: event.candidate, to: remoteSocketId });
//       }
//     };

//     pc.ontrack = (event) => {
//       remoteVideoRef.current.srcObject = event.streams[0];
//     };

//     myStream?.getTracks().forEach((track) => {
//       pc.addTrack(track, myStream);
//     });

//     if (isInitiator) {
//       pc.createOffer().then((offer) => {
//         pc.setLocalDescription(offer);
//         socket.emit('send-offer', { offer, to: remoteSocketId });
//       });
//     }

//     return pc;
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
//       <h2 className="text-2xl font-bold mb-6">Room ID: <span className="text-green-400">{roomId}</span></h2>

//       <div className="flex flex-col md:flex-row items-center gap-6">
//         <div className="bg-gray-800 p-4 rounded-xl shadow-md">
//           <p className="mb-2 text-center font-semibold">Your Camera</p>
//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             className="w-72 rounded-lg border border-gray-700"
//           />
//         </div>

//         <div className="bg-gray-800 p-4 rounded-xl shadow-md">
//           <p className="mb-2 text-center font-semibold">Remote Camera</p>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             className="w-72 rounded-lg border border-gray-700"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Room;














import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Use your deployed backend Socket.io URL
const socket = io("https://video-streaming-app-c4vp.onrender.com");

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [status, setStatus] = useState('Connecting...');
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const pc = new RTCPeerConnection();
    setPeerConnection(pc);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      // Show local video
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      socket.emit('join', roomId);

      socket.on('joined', async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', offer);
      });

      socket.on('offer', async (offer) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', answer);
      });

      socket.on('answer', async (answer) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', async (candidate) => {
        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', e.candidate);
      };

      pc.ontrack = (e) => {
        remoteVideoRef.current.srcObject = e.streams[0];
        setStatus("Connected");
      };

      socket.on('user-left', () => {
        setStatus('User Left');
        if (remoteVideoRef.current?.srcObject) {
          remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          remoteVideoRef.current.srcObject = null;
        }
      });
    });

    return () => {
      socket.emit('leave', roomId);
      socket.disconnect();
      pc.close();
    };
  }, [roomId]);

  const handleLeave = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
      <h2 className="text-xl mb-4">{status}</h2>
      <div className="flex flex-col lg:flex-row gap-4">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full lg:w-1/2 rounded-lg shadow-lg border border-gray-700" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full lg:w-1/2 rounded-lg shadow-lg border border-gray-700" />
      </div>
      <button
        className="mt-6 bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700 transition duration-200"
        onClick={handleLeave}
      >
        Leave Room
      </button>
    </div>
  );
};

export default Room;
