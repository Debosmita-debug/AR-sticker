import Image, { ImageProps } from 'next/image';

interface AppImageProps extends Omit<ImageProps, 'src'> {
    src: string;
    fallbackSrc?: string;
}

export default function AppImage({ src, fallbackSrc = '/placeholder.webp', alt, ...props }: AppImageProps) {
    return (
        <Image
            src={src || fallbackSrc}
            alt={alt || 'Image'}
            {...props}
            onError={(e) => {
                if (fallbackSrc) {
                    (e.currentTarget as any).src = fallbackSrc;
                }
            }}
        />
    );
}
