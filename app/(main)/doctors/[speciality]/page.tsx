import React from 'react';

type SpecialityPageProps = {
  params: {
    speciality: string;
  };
};

const SpecialityPage = async ({ params }: SpecialityPageProps) => {
  const { speciality } = await params;
  return <div>SpecialityPage:{speciality}</div>;
};

export default SpecialityPage;
