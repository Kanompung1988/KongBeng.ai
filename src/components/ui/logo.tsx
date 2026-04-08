import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 48, className }: LogoProps) {
  return (
    <Image
      src="/logo.jpg"
      alt="Khongbeng"
      width={size}
      height={size}
      className={`rounded-xl ${className ?? ""}`}
      priority
    />
  );
}

export function LogoIcon({ size = 32, className }: LogoProps) {
  return (
    <Image
      src="/logo.jpg"
      alt="K"
      width={size}
      height={size}
      className={`rounded-lg ${className ?? ""}`}
      priority
    />
  );
}
