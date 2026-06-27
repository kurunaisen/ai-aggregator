import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Full-width layout with comfortable padding up to 1920px screens */
export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 ${className}`}
    >
      {children}
    </div>
  );
}
