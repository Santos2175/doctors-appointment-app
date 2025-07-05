import React from 'react';
import VideoCall from './_components/video-call';

const VideoCallPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    sessionId: string;
    token: string;
    appointmentId: string;
  }>;
}) => {
  const { sessionId, token } = await searchParams;

  return <VideoCall sessionId={sessionId} token={token} />;
};

export default VideoCallPage;
