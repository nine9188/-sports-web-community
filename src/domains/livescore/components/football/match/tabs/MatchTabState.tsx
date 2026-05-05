'use client';

import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

interface MatchTabStateProps {
  title: string;
  message: string;
}

export default function MatchTabState({ title, message }: MatchTabStateProps) {
  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="px-3 py-4 text-center">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </ContainerContent>
    </Container>
  );
}
