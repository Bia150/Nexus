import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  PhoneCall, Users as UsersIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { users, findUserById } from '../../data/users';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [callState, setCallState] = useState<'lobby' | 'connecting' | 'in-call' | 'ended'>('lobby');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Pick the "other participant" — from ?with=userId or fallback to first available contact
  const otherId = searchParams.get('with');
  const otherUser = (otherId && findUserById(otherId)) ||
    users.find(u => u.id !== user?.id) || null;

  const startMedia = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMediaError('Could not access camera/microphone. You can still use the call UI in mock mode.');
    }
  };

  const stopMedia = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  useEffect(() => {
    return () => {
      stopMedia();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (callState === 'lobby') {
      startMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState === 'lobby']);

  const handleStartCall = () => {
    setCallState('connecting');
    toast.loading('Ringing...', { id: 'ringing', duration: 1400 });
    window.setTimeout(() => {
      setCallState('in-call');
      toast.success(`Connected with ${otherUser?.name || 'participant'}`, { id: 'ringing' });
      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    }, 1500);
  };

  const handleEndCall = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopMedia();
    setCallState('ended');
    setDuration(0);
    setScreenSharing(false);
    toast('Call ended', { icon: '📞' });
  };

  const handleRejoin = () => {
    setCallState('lobby');
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    streamRef.current?.getVideoTracks().forEach(t => (t.enabled = next));
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks().forEach(t => (t.enabled = next));
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setScreenSharing(true);
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenSharing(false);
          if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
        });
        toast.success('Screen sharing started');
      } catch {
        toast.error('Screen share was cancelled or is unavailable');
      }
    } else {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      setScreenSharing(false);
      toast('Screen sharing stopped');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
        <p className="text-gray-600">Connect face-to-face with your collaborators</p>
      </div>

      {callState === 'lobby' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Ready to join?</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {camOn ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                ) : (
                  <div className="text-white flex flex-col items-center gap-2">
                    <Avatar src={user?.avatarUrl || ''} alt={user?.name || 'You'} size="xl" />
                    <span className="text-sm text-gray-300">Camera off</span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  You
                </span>
              </div>

              <div className="flex flex-col justify-center items-center text-center gap-4">
                {otherUser && (
                  <>
                    <Avatar src={otherUser.avatarUrl} alt={otherUser.name} size="xl" />
                    <div>
                      <p className="font-medium text-gray-900">{otherUser.name}</p>
                      <p className="text-sm text-gray-500">Ready to call</p>
                    </div>
                  </>
                )}
                {mediaError && (
                  <p className="text-xs text-warning-700 bg-warning-50 rounded-md p-2">{mediaError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant={micOn ? 'outline' : 'error'}
                size="lg"
                onClick={toggleMic}
                leftIcon={micOn ? <Mic size={18} /> : <MicOff size={18} />}
              >
                {micOn ? 'Mic On' : 'Mic Off'}
              </Button>
              <Button
                variant={camOn ? 'outline' : 'error'}
                size="lg"
                onClick={toggleCam}
                leftIcon={camOn ? <Video size={18} /> : <VideoOff size={18} />}
              >
                {camOn ? 'Camera On' : 'Camera Off'}
              </Button>
              <Button
                variant="success"
                size="lg"
                onClick={handleStartCall}
                leftIcon={<PhoneCall size={18} />}
              >
                Start Call
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {callState === 'connecting' && (
        <Card>
          <CardBody className="py-16 flex flex-col items-center gap-4">
            <div className="animate-pulse">
              <Avatar src={otherUser?.avatarUrl || ''} alt={otherUser?.name || ''} size="xl" />
            </div>
            <p className="text-gray-700 font-medium">Calling {otherUser?.name}...</p>
            <Button variant="error" leftIcon={<PhoneOff size={16} />} onClick={handleEndCall}>
              Cancel
            </Button>
          </CardBody>
        </Card>
      )}

      {callState === 'in-call' && (
        <Card className="overflow-hidden">
          <div className="bg-gray-900 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
              {/* Remote participant (mock — static avatar tile simulating their feed) */}
              <div className="relative bg-gray-800 rounded-md aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Avatar src={otherUser?.avatarUrl || ''} alt={otherUser?.name || ''} size="xl" />
                  <span className="text-white text-sm">{otherUser?.name}</span>
                </div>
                <span className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  <UsersIcon size={12} /> Participant
                </span>
              </div>

              {/* Local video */}
              <div className="relative bg-gray-800 rounded-md aspect-video flex items-center justify-center overflow-hidden">
                {camOn || screenSharing ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${screenSharing ? '' : '-scale-x-100'}`} />
                ) : (
                  <Avatar src={user?.avatarUrl || ''} alt={user?.name || 'You'} size="xl" />
                )}
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  You {screenSharing && '(sharing screen)'}
                </span>
              </div>
            </div>

            <div className="absolute top-3 left-3 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {formatDuration(duration)}
            </div>
          </div>

          <CardBody className="flex items-center justify-center gap-3">
            <Button
              variant={micOn ? 'outline' : 'error'}
              size="lg"
              onClick={toggleMic}
              leftIcon={micOn ? <Mic size={18} /> : <MicOff size={18} />}
            />
            <Button
              variant={camOn ? 'outline' : 'error'}
              size="lg"
              onClick={toggleCam}
              leftIcon={camOn ? <Video size={18} /> : <VideoOff size={18} />}
            />
            <Button
              variant={screenSharing ? 'accent' : 'outline'}
              size="lg"
              onClick={toggleScreenShare}
              leftIcon={screenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
            >
              {screenSharing ? 'Stop Sharing' : 'Share Screen'}
            </Button>
            <Button
              variant="error"
              size="lg"
              onClick={handleEndCall}
              leftIcon={<PhoneOff size={18} />}
            >
              End Call
            </Button>
          </CardBody>
        </Card>
      )}

      {callState === 'ended' && (
        <Card>
          <CardBody className="py-16 flex flex-col items-center gap-4">
            <p className="text-lg font-medium text-gray-900">Call ended</p>
            <p className="text-sm text-gray-500">Thanks for chatting with {otherUser?.name}.</p>
            <Button leftIcon={<PhoneCall size={16} />} onClick={handleRejoin}>
              Start Another Call
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};