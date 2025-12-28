import React from 'react';
import { useStore } from '@nanostores/react';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { QRCode } from 'react-qrcode-logo';

export const ExpoQrView: React.FC = () => {
  const expoUrl = useStore(expoUrlAtom);

  return (
    <div className="flex flex-col gap-5 justify-center items-center p-6 h-full w-full bg-bolt-elements-background-depth-2">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="i-bolt:expo-brand h-10 w-full invert dark:invert-none"></div>
        <h2 className="text-bolt-elements-textTertiary text-lg font-semibold leading-6">
          Preview on your own mobile device
        </h2>
        <p className="bg-bolt-elements-background-depth-3 rounded-md p-2 border border-bolt-elements-borderColor text-sm">
          Scan this QR code with the Expo Go app on your mobile device to open your project.
        </p>
        <div className="my-6 flex flex-col items-center">
          {expoUrl ? (
            <QRCode
              logoImage="/favicon.svg"
              removeQrCodeBehindLogo={true}
              logoPadding={3}
              logoHeight={50}
              logoWidth={50}
              logoPaddingStyle="square"
              style={{
                borderRadius: 16,
                padding: 2,
                backgroundColor: '#8a5fff',
              }}
              value={expoUrl}
              size={250}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="i-ph:spinner animate-spin text-4xl text-bolt-elements-textTertiary" />
              <div className="text-bolt-elements-textTertiary">Waiting for Expo server...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
