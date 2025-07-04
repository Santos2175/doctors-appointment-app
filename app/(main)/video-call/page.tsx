import React from 'react';
import VideoCall from './_components/video-call';

type VideoCallPageProps = {
  searchParams: { sessionId: string; token: string; appointmentId: string };
};

const VideoCallPage = async ({ searchParams }: VideoCallPageProps) => {
  const { sessionId, token } = await searchParams;

  return <VideoCall sessionId={sessionId} token={token} />;
};

export default VideoCallPage;
