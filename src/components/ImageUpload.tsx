'use client';

import { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Loader2,
  Plus,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 6,
  disabled = false,
}: ImageUploadProps) {
  const [adding, setAdding] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Function to validate if URL is a valid image URL
  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      // Check if URL ends with common image extensions or contains image service patterns
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
      const imageServices =
        /(unsplash\.com|pexels\.com|pixabay\.com|imgur\.com|cloudinary\.com)/i;
      return imageExtensions.test(url) || imageServices.test(url);
    } catch {
      return false;
    }
  };

  // Function to check if image URL is accessible
  const checkImageAccessibility = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Set timeout to avoid hanging
      setTimeout(() => resolve(false), 10000);
    });
  };

  const handleAddImageFromUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check if URL is already added
    if (images.includes(urlInput.trim())) {
      toast.error('This image URL is already added');
      return;
    }

    // Basic URL validation
    if (!validateImageUrl(urlInput.trim())) {
      toast.error('Please enter a valid image URL');
      return;
    }

    setAdding(true);

    try {
      // Check if image is accessible
      const isAccessible = await checkImageAccessibility(urlInput.trim());
      if (!isAccessible) {
        toast.error('Image URL is not accessible or invalid');
        return;
      }

      onImagesChange([...images, urlInput.trim()]);
      setUrlInput('');
      toast.success('Image added successfully');
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
    } finally {
      setAdding(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Property Images</Label>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* URL Input Section */}
      {canAddMore && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Image from URL</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled || adding}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImageFromUrl();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddImageFromUrl}
              disabled={disabled || adding || !urlInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg'; // Fallback image
                }}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Add More Placeholder */}
        {canAddMore && images.length > 0 && (
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <LinkIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Add more images using URL above</p>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <p>• Maximum {maxImages} images allowed</p>
        <p>• Supported formats: JPG, PNG, GIF, WebP, SVG</p>
        <p>• Enter direct image URLs or links from image hosting services</p>
        <p>• Images will be validated before adding</p>
      </div>
    </div>
  );
}
