// import { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';

// // const socket = io("http://localhost:5000");
// const socket = io("https://video-streaming-app-c4vp.onrender.com");

// const VideoRoom = () => {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const [status, setStatus] = useState('Connecting...');
//   const [peerConnection, setPeerConnection] = useState(null);

//   useEffect(() => {
//     const pc = new RTCPeerConnection();
//     setPeerConnection(pc);

//     navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
//       localVideoRef.current.srcObject = stream;
//       stream.getTracks().forEach(track => pc.addTrack(track, stream));

//       socket.emit('join', roomId);

//       socket.on('offer', async (offer) => {
//         await pc.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit('answer', answer);
//       });

//       socket.on('answer', async (answer) => {
//         await pc.setRemoteDescription(new RTCSessionDescription(answer));
//       });

//       socket.on('ice-candidate', async (candidate) => {
//         if (candidate) await pc.addIceCandidate(candidate);
//       });

//       pc.onicecandidate = (e) => {
//         if (e.candidate) socket.emit('ice-candidate', e.candidate);
//       };

//       pc.ontrack = (e) => {
//         remoteVideoRef.current.srcObject = e.streams[0];
//         setStatus("Connected");
//       };

//       socket.on('joined', async () => {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit('offer', offer);
//       });

//       socket.on('user-left', () => {
//         setStatus('User Left');
//         if (remoteVideoRef.current?.srcObject) {
//           remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
//           remoteVideoRef.current.srcObject = null;
//         }
//       });
//     });

//     return () => {
//       socket.disconnect();
//       pc.close();
//     };
//   }, [roomId]);

//   return (
//     <div className="flex flex-col items-center justify-center h-screen px-4 bg-gray-900 text-white">
//       <h2 className="text-xl mb-4">{status}</h2>
//       <div className="flex flex-col lg:flex-row gap-4">
//         <video ref={localVideoRef} autoPlay playsInline muted className="w-full lg:w-1/2 rounded-lg shadow" />
//         <video ref={remoteVideoRef} autoPlay playsInline className="w-full lg:w-1/2 rounded-lg shadow" />
//       </div>
//       <button
//         className="mt-6 bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700"
//         onClick={() => navigate('/')}
//       >
//         Leave Room
//       </button>
//     </div>
//   );
// };

// export default VideoRoom;
















import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
const socket = io("https://video-streaming-app-c4vp.onrender.com");

export default function VideoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const localRef = useRef();
  const remoteRef = useRef();
  const pcRef = useRef();
  const [status, setStatus] = useState('Waiting for peer...');
  
  useEffect(() => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        socket.emit('join-room', { roomId });
      });

    socket.on('user-joined', async ({ socketId }) => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('send-offer', { offer, to: socketId });
    });

    socket.on('receive-offer', async ({ offer, from }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('send-answer', { answer, to: from });
    });

    socket.on('receive-answer', ({ answer }) => {
      pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', ({ candidate }) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, to: null });
    };

    pc.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
      setStatus('Connected');
    };

    socket.on('user-left', () => {
      setStatus('User left');
      remoteRef.current.srcObject?.getTracks().forEach(t => t.stop());
      remoteRef.current.srcObject = null;
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
      pc.close();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl mb-4">{status}</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <video ref={localRef} autoPlay muted playsInline className="w-full md:w-1/2 rounded" />
        <video ref={remoteRef} autoPlay playsInline className="w-full md:w-1/2 rounded" />
      </div>
      <button 
        onClick={() => navigate('/')} 
        className="mt-6 bg-red-600 px-6 py-2 rounded hover:bg-red-700"
      >Leave Room</button>
    </div>
  );
}
