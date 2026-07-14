import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700',
        className,
      )}
      {...props}
    />
  );
}
