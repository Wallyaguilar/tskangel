import Link from 'next/link';
import Navigation from '../navigation';
export default function SiteShell({children}:{children:React.ReactNode}){
 return <><div className="preview">DEVELOPMENT PREVIEW <span>•</span> Test data only · Live payments disabled</div><a href="#main" className="skip">Skip to content</a><header className="header wrap"><Link href="/" className="brand" aria-label="TskAngel home">TskAngel<span>Faith in Action. Love in Motion.</span></Link><Navigation home={false}/></header><main id="main" tabIndex={-1}>{children}</main><footer><div className="wrap footer-bottom"><Link href="/">© {new Date().getFullYear()} TskAngel</Link><Link href="/volunteer">Volunteer</Link><Link href="/give">Give</Link><Link href="/#vision">Vision &amp; Values</Link><Link href="/admin">Leadership sign in</Link></div></footer></>;
}
