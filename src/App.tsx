import CheckInForm from "./components/CheckInForm";
import StatusPanel from "./components/StatusPanel";
import StatusBars from "./components/StatusBars";

import Logo from "./components/Logo";

function App() {
  return (
    
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-green-100 to-yellow-50">

     

       {/* Hero Section */}
      <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] drop-shadow-lg">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay for darkening image */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Header */}
        <header className="w-full bg-transparent backdrop-blur-sm p-5 flex justify-between items-center sticky top-0 z-50 shadow-lg">
          <a href="/" className="flex items-center">
            <Logo />
          </a>
          <nav className="space-x-4">
            <button className="text-white font-medium hover:underline">Home</button>
            <button className="text-white font-medium hover:underline">History</button>
            </nav>
        </header>

        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="animate-fadeIn text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg transition-transform duration-300 hover:scale-105">
            Daily Check-In
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-200 drop-shadow-md max-w-2xl animate-fadeIn ">
             Track your mood, sleep, energy, and stress today.
          </p>
        </div>
      </div>

      {/* Main content */}
      <section className="mt-8 md:mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: form + panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <CheckInForm />
              <StatusPanel />
            </div>
            {/* Right: status bars */}
            <div className="lg:col-span-1">
              <StatusBars />
            </div>
          </div>
        </div>
      </section>
          
    </div>
  );
}

export default App;
