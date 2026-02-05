import React from 'react';
import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { AnimatedLogo } from './AnimatedLogo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: 'Welcome to Remotion',
          titleColor: '#000000',
        }}
      />
      <Composition
        id="AnimatedLogo"
        component={AnimatedLogo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          logoText: 'REMOTION',
          accentColor: '#4A90E2',
        }}
      />
    </>
  );
};
