import Link from 'next/link';
const tabs=[['overview','Overview'],['events','Events & dates'],['volunteers','Volunteers'],['donations','Donations'],['newsletters','Newsletters'],['testimonials','Testimonials'],['content','Website content'],['email','Email delivery']] as const;
export default function AdminTabs({active}:{active:string}){return <nav className="admin-tabs" aria-label="Leadership sections">{tabs.map(([key,label])=><Link key={key} href={key==='newsletters'?'/admin/newsletters':`/admin?tab=${key}`} aria-current={active===key?'page':undefined}>{label}</Link>)}</nav>;}
