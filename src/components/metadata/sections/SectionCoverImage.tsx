import { useRef } from "react";

export interface SectionCoverImageProps {
  coverPhotoUrl?: string;
  onUploadImage: (file: File) => void;
}

export function SectionCoverImage({ coverPhotoUrl, onUploadImage }: SectionCoverImageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadImage(file);
    e.target.value = "";
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
    </div>
  );
}
