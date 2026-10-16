import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'light';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  // Rayon 12 px, bordure de 2 px sur tous les boutons pour que principal et
  // secondaire aient exactement la même hauteur côte à côte.
  const baseClasses =
    'font-semibold rounded-xl border-2 transition-[background-color,border-color,box-shadow,color] duration-180 ease-out ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-vif ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

  // Secondaire : fond blanc, bordure or, texte noir (aussi utilisé sur fond sombre).
  const secondaire = 'bg-white text-noir border-or hover:bg-fond hover:border-or-clair';

  const variantClasses = {
    // Principal : un seul par écran
    primary: 'bg-bleu text-white border-transparent shadow-bleu hover:bg-bleu-hover hover:shadow-bleu-fort',
    secondary: secondaire,
    outline: secondaire,
    light: secondaire,
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-[22px] py-[13px] text-[15px] md:text-base',
    lg: 'px-[26px] py-[14px] text-base md:text-[17px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} inline-flex items-center justify-center gap-2`}
      {...props}
    >
      {children}
    </button>
  );
}
