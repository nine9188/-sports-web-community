'use client';

import React from 'react';
import PlayerImage from './PlayerImage';

interface Coach {
  name: string;
  photo?: string;
}

interface CoachRowProps {
  coach: Coach;
}

export default function CoachRow({ coach }: CoachRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {coach.photo ? (
          <PlayerImage 
            src={coach.photo}
            alt={`${coach.name} 감독 사진`}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{coach.name}</div>
        <div className="text-xs text-gray-500">감독</div>
      </div>
    </div>
  );
} 