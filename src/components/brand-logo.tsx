import Image from 'next/image';

export default function BrandLogo({ size = 40, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span className="brand-logo" style={{ width: size, height: size }}>
      <Image
        src="/brand/agency-logo.jpeg"
        alt="Símbolo da agência"
        width={size}
        height={size}
        priority={priority}
      />
    </span>
  );
}
