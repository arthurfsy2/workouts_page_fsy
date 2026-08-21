import { Link } from 'react-router-dom';
import useSiteMetadata from '@/hooks/useSiteMetadata';

const Header = () => {
  const { logo, siteUrl, navLinks } = useSiteMetadata();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to={siteUrl} className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <picture>
                <img className="h-10 w-10 rounded-full shadow-warm" alt="logo" src={logo} />
              </picture>
              <span className="hidden text-lg font-semibold text-primary sm:inline">Workouts</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {navLinks.map((n, i) => (
              <a
                key={i}
                href={n.url}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {n.name}
              </a>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
