import React, { ReactNode } from 'react';

const MainLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return <div className='container mx-auto my-20'>{children}</div>;
};

export default MainLayout;
