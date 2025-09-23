import React from 'react';
import HeroSection from '../components/HeroSection';
import SituationReports from '../components/SituationReports';
import TopReporters from '../components/TopReporters';
import WeatherSearch from '../components/WeatherSearch';

const Home = () => {
  return (
    <div className="min-h-screen">
       <WeatherSearch/>
      <HeroSection />
      <SituationReports />
      <TopReporters />
    </div>
  );
};

export default Home;