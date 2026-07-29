import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["googleapis", "bcryptjs", "nodemailer"],
  reactStrictMode: true,
};

export default withPWA(nextConfig);
