export const optimizeYouTubeUrl = (input: string): string => {
  try {
    if (!input) {
      return input;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return input;
    }

    const sanitized = trimmed.replace(/&amp;/g, '&');
    const candidateUrls = [sanitized];

    if (!/^https?:\/\//i.test(sanitized)) {
      candidateUrls.push(`https://${sanitized}`);
    }

    let videoId: string | null = null;

    for (const candidate of candidateUrls) {
      try {
        const parsedUrl = new URL(candidate);
        const hostname = parsedUrl.hostname.toLowerCase();
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

        if (hostname.includes('youtu.be')) {
          videoId = pathSegments[0] ?? null;
          if (videoId) {
            break;
          }
        }

        if (hostname.includes('youtube.com')) {
          const paramId = parsedUrl.searchParams.get('v');
          if (paramId) {
            videoId = paramId;
            break;
          }

          const embedIndex = pathSegments.indexOf('embed');
          if (embedIndex !== -1 && pathSegments[embedIndex + 1]) {
            videoId = pathSegments[embedIndex + 1];
            break;
          }

          const shortsIndex = pathSegments.indexOf('shorts');
          if (shortsIndex !== -1 && pathSegments[shortsIndex + 1]) {
            videoId = pathSegments[shortsIndex + 1];
            break;
          }
        }
      } catch (parseError) {
        console.debug('Failed to parse YouTube URL candidate', { candidate, parseError });
      }
    }

    if (!videoId) {
      const fallbackMatch = sanitized.match(
        /(?:youtube\.com\/(?:[^/?]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/
      );

      if (fallbackMatch) {
        videoId = fallbackMatch[1];
      }
    }

    if (!videoId || videoId.length !== 11) {
      console.warn('Could not extract a valid YouTube video ID. Returning original URL.', { input });
      return sanitized;
    }

    const params = new URLSearchParams({
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      fs: '1',
      cc_load_policy: '1',
      iv_load_policy: '3',
      enablejsapi: '1'
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch (error) {
    console.error('Error optimizing YouTube URL:', error);
    return input;
  }
};
