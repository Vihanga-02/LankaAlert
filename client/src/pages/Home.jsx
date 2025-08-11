import React from 'react';
import WeatherSlideshow from '../components/WeatherSlideshow';
import HeroSection from '../components/HeroSection';
import SituationReports from '../components/SituationReports';
import TopReporters from '../components/TopReporters';

const Home = () => {
  return (
    <div className="min-h-screen">
      <WeatherSlideshow />
      <HeroSection />
      <SituationReports />
      <TopReporters />
    </div>
  );
};

export default Home;