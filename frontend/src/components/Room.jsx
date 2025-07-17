import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';

const Room = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);

  const [myStream, setMyStream] = useState(null);

  useEffect(() => {
    socket.emit('join-room', { roomId });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      });

    socket.on('user-joined', async ({ socketId }) => {
      peerConnection.current = createPeer(socketId, true);
    });

    socket.on('receive-offer', async ({ offer, from }) => {
      peerConnection.current = createPeer(from, false);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('send-answer', { answer, to: from });
    });

    socket.on('receive-answer', async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', ({ candidate }) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.disconnect();
      peerConnection.current?.close();
    };
  }, []);

  const createPeer = (remoteSocketId, isInitiator) => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: remoteSocketId });
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    myStream?.getTracks().forEach((track) => {
      pc.addTrack(track, myStream);
    });

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit('send-offer', { offer, to: remoteSocketId });
      });
    }

    return pc;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-6">Room ID: <span className="text-green-400">{roomId}</span></h2>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="mb-2 text-center font-semibold">Your Camera</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-72 rounded-lg border border-gray-700"
          />
        </div>

        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="mb-2 text-center font-semibold">Remote Camera</p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-72 rounded-lg border border-gray-700"
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
