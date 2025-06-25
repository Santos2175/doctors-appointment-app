import React, { ReactNode } from 'react';

const AuthLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return <div className='flex  justify-center pt-40'>{children}</div>;
};

export default AuthLayout;
