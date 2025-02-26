import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 text-blue-600 dark:text-blue-400">
          MechanicOnDemand
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 mb-8">
          Connecting car owners with mechanic services - simplifying your vehicle maintenance and repair experience.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-500">For Car Owners</h2>
            <p className="text-gray-600 dark:text-gray-300">Request service, schedule pickup and track repairs - all from your phone.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-500">For Mechanics</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage service requests, communicate with customers, and grow your business.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-500">For Drivers</h2>
            <p className="text-gray-600 dark:text-gray-300">Accept transport jobs, navigate efficiently, and earn money on your schedule.</p>
          </div>
        </div>
        
        <div className="mt-12">
          <a
            href="#"
            className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Get Started
          </a>
        </div>
      </main>
      
      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 MechanicOnDemand. All rights reserved.</p>
      </footer>
    </div>
  );
}
