import React from 'react';
import { Award, Star, MapPin, TrendingUp } from 'lucide-react';

const TopReporters = () => {
  const topReporters = [
    {
      id: 1,
      name: 'Samantha Perera',
      position: 'District Officer - Colombo',
      points: 2850,
      reports: 47,
      accuracy: 98,
      district: 'Colombo',
      badge: 'Gold',
      avatar: 'SP'
    },
    {
      id: 2,
      name: 'Rajith Fernando',
      position: 'Meteorological Officer - Kandy',
      points: 2640,
      reports: 39,
      accuracy: 96,
      district: 'Kandy',
      badge: 'Gold',
      avatar: 'RF'
    },
    {
      id: 3,
      name: 'Nimali Silva',
      position: 'District Officer - Galle',
      points: 2180,
      reports: 35,
      accuracy: 94,
      district: 'Galle',
      badge: 'Silver',
      avatar: 'NS'
    },
    {
      id: 4,
      name: 'Kasun Jayawardena',
      position: 'Emergency Coordinator - Matara',
      points: 1950,
      reports: 28,
      accuracy: 97,
      district: 'Matara',
      badge: 'Silver',
      avatar: 'KJ'
    }
  ];

  const getBadgeColor = (badge) => {
    switch (badge.toLowerCase()) {
      case 'gold':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'silver':
        return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'bronze':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      default:
        return 'text-blue-600 bg-blue-100 border-blue-300';
    }
  };

  const getAvatarColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Award className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Top Reporters
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Recognizing our dedicated community reporters who help keep Sri Lanka safe 
            with accurate and timely disaster reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topReporters.map((reporter, index) => (
            <div
              key={reporter.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 relative overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getBadgeColor(reporter.badge)}`}>
                  #{index + 1}
                </div>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {reporter.avatar}
                </div>
              </div>

              {/* Reporter Info */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {reporter.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {reporter.position}
                </p>
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{reporter.district}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Points</span>
                  </div>
                  <span className="font-bold text-blue-600">{reporter.points.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Reports</span>
                  </div>
                  <span className="font-bold text-green-600">{reporter.reports}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Accuracy</span>
                  </div>
                  <span className="font-bold text-yellow-600">{reporter.accuracy}%</span>
                </div>
              </div>

              {/* Badge */}
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBadgeColor(reporter.badge)}`}>
                  <Award className="h-4 w-4 mr-1" />
                  {reporter.badge} Reporter
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Want to become a community reporter? Help your community stay safe.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Apply as Reporter
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopReporters;