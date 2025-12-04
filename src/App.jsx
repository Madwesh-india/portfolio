import { useState } from "react";

import Testimonials from "./sections/Testimonials";
import Footer from "./sections/Footer";
import Contact from "./sections/Contact";
import TechStack from "./sections/TechStack";
import Experience from "./sections/Experience";
import Hero from "./sections/Hero";
import ShowcaseSection from "./sections/ShowcaseSection";
import LogoShowcase from "./sections/LogoShowcase";
import FeatureCards from "./sections/FeatureCards";
import Navbar from "./components/NavBar";
import TerminalOverlay from "./components/TerminalOverlay";

const App = () => {
  const [showTerminal, setShowTerminal] = useState(true);
  const [mode, setMode] = useState("1"); // default: Professional Mode


  return (
    <>
    <TerminalOverlay 
      onClose={(selectedMode) => {
        setMode(selectedMode);   // <-- store "1" or "2"
        setShowTerminal(false);
      }} 
    />


      <Navbar />
      <Hero mode={mode} />
      <ShowcaseSection />
      <LogoShowcase />
      <FeatureCards />
      <Experience />
      <TechStack />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
};

export default App;
