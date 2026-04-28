import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { profileApi } from '../services/api';

const ProfileSelector = () => {
  const { userProfile, updateUserProfile } = useApp();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const profiles = [
    {
      id: 'normal',
      name: 'Normal',
      description: 'No known respiratory or cardiovascular conditions',
      icon: '😊',
      color: 'border-green-500 hover:border-green-400',
      bgColor: 'bg-green-50',
      selectedColor: 'ring-2 ring-green-500 bg-green-100'
    },
    {
      id: 'asthma',
      name: 'Asthma',
      description: 'Asthma or other respiratory conditions',
      icon: '🫁',
      color: 'border-yellow-500 hover:border-yellow-400',
      bgColor: 'bg-yellow-50',
      selectedColor: 'ring-2 ring-yellow-500 bg-yellow-100'
    },
    {
      id: 'cardiac',
      name: 'Cardiac',
      description: 'Heart disease or cardiovascular conditions',
      icon: '❤️',
      color: 'border-red-500 hover:border-red-400',
      bgColor: 'bg-red-50',
      selectedColor: 'ring-2 ring-red-500 bg-red-100'
    }
  ];

  const handleProfileChange = async (profileId) => {
    updateUserProfile({ health_profile: profileId });
    
    setSaving(true);
    setSaved(false);
    
    try {
      await profileApi.updateProfile(
        userProfile.user_id,
        profileId,
        userProfile.preferences
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Health Profile</h3>
        {saving && (
          <span className="text-sm text-blue-600 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        )}
        {saved && (
          <span className="text-sm text-green-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Select your health profile for personalized route recommendations.
      </p>

      <div className="space-y-3">
        {profiles.map((profile) => {
          const isSelected = userProfile.health_profile === profile.id;
          
          return (
            <button
              key={profile.id}
              onClick={() => handleProfileChange(profile.id)}
              className={`
                w-full flex items-center p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected ? profile.selectedColor : `bg-white ${profile.color}`}
              `}
            >
              <span className="text-2xl mr-3">{profile.icon}</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-800">{profile.name}</p>
                <p className="text-sm text-gray-500">{profile.description}</p>
              </div>
              {isSelected && (
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Higher health sensitivity prioritizes cleaner air routes over speed.
        </p>
      </div>
    </div>
  );
};

export default ProfileSelector;
