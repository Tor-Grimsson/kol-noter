import { useRef } from "react";

export interface SectionCoverImageProps {
  coverPhotoUrl?: string;
  onUploadImage: (file: File) => void;
  onRemoveImage?: () => void;
}

export function SectionCoverImage({ coverPhotoUrl, onUploadImage, onRemoveImage }: SectionCoverImageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadImage(file);
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveImage?.();
  };

  return (
    <div
      className="w-full h-[200px] rounded-[4px] overflow-hidden bg-cover bg-center relative cursor-pointer group"
      style={{ backgroundImage: coverPhotoUrl ? `url(${coverPhotoUrl})` : "url(placeholder-img/ph-02.png)" }}
      onClick={() => imageInputRef.current?.click()}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {/* Remove button - only show when there's a cover image */}
      {coverPhotoUrl && onRemoveImage && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove cover image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}
