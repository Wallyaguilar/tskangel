import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'TskAngel | Christian Community Outreach & Volunteer Service', description: 'TskAngel is a Christian faith-based community outreach ministry serving neighbors through meals, essential supplies, volunteer service, and acts of compassion.', robots: { index: false, follow: false } };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
