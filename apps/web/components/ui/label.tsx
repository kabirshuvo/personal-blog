import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-stone-700 dark:text-stone-300',
        className,
      )}
      {...props}
    />
  );
}
