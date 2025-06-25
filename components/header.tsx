import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Button } from './ui/button';

const Header = () => {
  return (
    <header className='fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60'>
      <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
        {/* LOGO */}
        <Link href='/' className='flex items-center gap-2 cursor-pointer'>
          <Image
            src={'/logo-single.png'}
            alt='logo'
            width={200}
            height={60}
            className='h-10 w-auto object-contain'
          />
        </Link>

        {/* ACTION BUTTONS */}
        <div className='flex items-center space-x-2 '>
          <SignedOut>
            <SignInButton>
              <Button variant='secondary' className='cursor-pointer'>
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                  userButtonPopoverCard: 'shadow-xl',
                  userPreviewMainIdentifier: 'font-semibold',
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
