/**
 * Utility functions to convert activity URLs to embeddable formats
 */

export const convertWordwallUrl = (url: string): string => {
  try {
    // If already in embed format with hash-based ID, return as-is
    if (url.includes('wordwall.net/embed/') && url.includes('?')) {
      return url;
    }

    // Handle resource URLs like: https://wordwall.net/resource/80427633/ela/sight-word-anagrams
    if (url.includes('wordwall.net/resource/')) {
      console.warn('Wordwall resource URL detected. Please use the embed code provided by Wordwall instead of the resource URL.');
      console.warn('You can get the embed code by clicking "Share" -> "Embed" on the Wordwall activity page.');
      return url; // Return original URL for now, but warn user
    }

    // Handle play URLs like: https://wordwall.net/play/80427633
    if (url.includes('wordwall.net/play/')) {
      console.warn('Wordwall play URL detected. Please use the embed code provided by Wordwall instead of the play URL.');
      console.warn('You can get the embed code by clicking "Share" -> "Embed" on the Wordwall activity page.');
      return url; // Return original URL for now, but warn user
    }

    // For any other Wordwall URL, provide helpful guidance
    if (url.includes('wordwall.net')) {
      console.warn('To embed Wordwall activities, please use the embed URL provided by Wordwall.');
      console.warn('Format should be: https://wordwall.net/embed/[HASH]?themeId=X&templateId=Y&fontStackId=Z');
    }

    return url;
  } catch (error) {
    console.error('Error processing Wordwall URL:', error);
    return url;
  }
};

export const convertH5pUrl = (url: string): string => {
  try {
    // H5P URLs are usually already in embed format, but let's handle different cases
    if (url.includes('h5p.org') && !url.includes('/embed/')) {
      // Convert h5p.org URLs to embed format if needed
      const idMatch = url.match(/\/(\d+)$/);
      if (idMatch) {
        return `https://h5p.org/h5p/embed/${idMatch[1]}`;
      }
    }

    return url;
  } catch (error) {
    console.error('Error converting H5P URL:', error);
    return url;
  }
};

export const getEmbeddableActivityUrl = (url: string, type: 'h5p' | 'wordwall'): string => {
  if (type === 'wordwall') {
    return convertWordwallUrl(url);
  } else if (type === 'h5p') {
    return convertH5pUrl(url);
  }

  return url;
};

/**
 * Check if a URL can be embedded in an iframe
 */
export const isEmbeddable = async (url: string): Promise<boolean> => {
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'  // This will prevent CORS errors but limits info we can get
    });
    return true;
  } catch (error) {
    // If fetch fails due to CORS, the URL might still be embeddable
    // We'll assume it is unless we have explicit evidence otherwise
    return true;
  }
};

/**
 * Get activity instructions based on type
 */
export const getActivityInstructions = (type: 'h5p' | 'wordwall'): string => {
  switch (type) {
    case 'h5p':
      return 'Complete the interactive H5P activity above. Follow the instructions and complete all parts.';
    case 'wordwall':
      return 'Play the Wordwall game above. Complete the activity to test your knowledge from the video.';
    default:
      return 'Complete the activity above.';
  }
};