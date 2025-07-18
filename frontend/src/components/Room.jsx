import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
// const socket = io("https://video-streaming-app-c4vp.onrender.com");

export default function Room() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const localVideo = useRef();
  const remoteVideo = useRef();
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [remoteSocketId, setRemoteSocketId] = useState(null);

  useEffect(() => {
    socket.emit('join-room', { roomId });

    socket.on('user-joined', ({ socketId }) => {
      setRemoteSocketId(socketId);
    });

    socket.on('receive-offer', async ({ offer, from }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('send-answer', { answer, to: from });
    });

    socket.on('receive-answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding received ice candidate', err);
        }
      }
    });

    startStream();

    return () => {
      socket.disconnect();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (remoteSocketId && localStreamRef.current) {
      initiateCall(remoteSocketId);
    }
  }, [remoteSocketId]);

  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localVideo.current.srcObject = stream;
  };

  const createPeerConnection = (to) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { candidate: e.candidate, to });
      }
    };

    pc.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
    };

    localStreamRef.current?.getTracks().forEach(track => {
      if (pc.signalingState !== 'closed') {
        pc.addTrack(track, localStreamRef.current);
      }
    });

    pcRef.current = pc;
    return pc;
  };

  const initiateCall = async (to) => {
    const pc = createPeerConnection(to);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('send-offer', { offer, to });
  };

  const handleExit = () => {
    if (pcRef.current) pcRef.current.close();
    nav('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
        <video ref={localVideo} autoPlay muted playsInline className="w-72 rounded-lg border" />
        <video ref={remoteVideo} autoPlay playsInline className="w-72 rounded-lg border" />
      </div>
      <button onClick={handleExit} className="bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700">
        Exit Room
      </button>
    </div>
  );
}
