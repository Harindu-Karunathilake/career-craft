import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ttcgroup.com",
      },
      {
        protocol: "https",
        hostname: "www.ttcgroup.com",
      },
      {
        protocol: "https",
        hostname: "techtalentconsulting.co.uk",
      },
      {
        protocol: "https",
        hostname: "www.techtalentconsulting.co.uk",
      },
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
      },
      {
        protocol: "https",
        hostname: "squarespace-cdn.com",
      },
      {
        protocol: "https",
        hostname: "traffic.megaphone.fm",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
