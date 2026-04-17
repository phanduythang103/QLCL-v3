/**
 * Utility for client-side file compression (Images)
 * For PDF compression, it's recommended to use a library like pdf-lib if available.
 */

export async function compressImage(file: File, options = { maxWidth: 1200, maxHeight: 1200, quality: 0.7 }): Promise<File> {
    // If it's not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio
                if (width > height) {
                    if (width > options.maxWidth) {
                        height = Math.round((height * options.maxWidth) / width);
                        width = options.maxWidth;
                    }
                } else {
                    if (height > options.maxHeight) {
                        width = Math.round((width * options.maxHeight) / height);
                        height = options.maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fallback to original
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });

                        // Only use compressed if it's actually smaller
                        if (compressedFile.size < file.size) {
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    file.type,
                    options.quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

/**
 * Placeholder for PDF compression. 
 * Real client-side PDF compression usually requires libraries like pdf-lib or pako.
 * For now, we return the original file.
 */
export async function compressFile(file: File): Promise<File> {
    if (file.type.startsWith('image/')) {
        return compressImage(file);
    }

    // Future: Add PDF compression here if libraries are added
    if (file.type === 'application/pdf') {
        console.log('PDF compression skipped (requires specialized library)');
    }

    return file;
}
