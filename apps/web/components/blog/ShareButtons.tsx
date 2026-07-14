'use client';

import { Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ShareButtonsProps = {
  title: string;
  url: string;
};

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-stone-500">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter"
      >
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </a>
      <Button variant="ghost" size="sm" onClick={copyLink} aria-label="Copy link">
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
