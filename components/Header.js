import Link from 'next/link'

export default function Header() {
  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link href="/">
            <a>Blog</a>
          </Link>
          <Link href="/about">
            <a>About</a>
          </Link>
          <Link href="/work">
            <a>Work</a>
          </Link>
        </nav>
      </header>
    </>
  )
}