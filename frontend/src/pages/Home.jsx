import React from "react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import bgVideo from "/videos/bg.mp4";
import { buttonList } from "../utils/buttonsConfig";

const Home = () => {
  return (
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover opacity-10 z-0"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <Navbar />
        <main className="text-center mt-10 z-10">
          <h2 className="text-5xl font-extrabold mb-6 drop-shadow-md text-white">
            Empowering Your Financial Workflow
          </h2>
          <p className="text-xl mb-10 max-w-xl mx-auto text-gray-300">
            A seamless platform for staff to manage and add customers to your
            database. Simple, secure, and elegant.
          </p>
          <div className="flex flex-wrap gap-2">
            {buttonList.map((item, idx) => (
              <Button
                key={idx}
                title={item.title}
                path={item.path}
                tabName={item?.tabName}
              />
            ))}
          </div>
        </main>

        <footer className="absolute bottom-4 text-sm text-gray-500">
          © 2025 Maarikamba Finance Pvt Ltd. All rights reserved.
        </footer>
      </div>
  );
};

export default Home;
