// File: About.jsx
import React from "react";
import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
        <Navbar />
        <div className="bg-gradient-to-b max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white p-6 space-y-16">
        <section className="flex flex-col items-center md:items-start md:space-x-8 space-y-6 md:space-y-0">
            <h1 className="text-4xl font-bold text-teal-300 mb-4 text-center w-full whitespace-nowrap">About Our Finance Platform</h1>
            <div className="flex items-center">
                <div className="md:w-1/2">
                    <p className="text-lg text-gray-300">
                        Welcome to our innovative finance platform. We specialize in providing
                        modern, secure, and efficient tools that empower our staff to manage
                        customer relationships and loan processes with ease.
                    </p>
                </div>
                <img
                src="https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Finance Overview"
                className="md:w-1/2 rounded-lg shadow-md object-cover h-64"
                />
            </div>
        </section>

        <section className="flex flex-col md:flex-row-reverse items-center md:items-start md:space-x-reverse md:space-x-8 space-y-6 md:space-y-0">
            <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold text-teal-200 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-300">
                Built with the latest technologies, our platform supports seamless
                integration, a responsive user interface, and a high-performance backend —
                ensuring smooth and scalable operations.
            </p>
            </div>
            <img
            src="https://images.pexels.com/photos/8866745/pexels-photo-8866745.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Our Mission"
            className="md:w-1/2 rounded-lg shadow-md object-cover h-64"
            />
        </section>

        <section className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 space-y-6 md:space-y-0">
            <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold text-teal-200 mb-4">Our Team</h2>
            <p className="text-lg text-gray-300">
                We’re a diverse group of developers, designers, and financial experts
                working together to shape the future of digital finance.
            </p>
            </div>
            <img
            src="https://images.pexels.com/photos/4968384/pexels-photo-4968384.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Our Team"
            className="md:w-1/2 rounded-lg shadow-md object-cover h-64"
            />
        </section>

        <footer className="text-sm text-gray-500 text-center pt-10">
            © {new Date().getFullYear()} FinTech Solutions. All rights reserved.
        </footer>
        </div>
    </div>
  );
}
