/**
 * Social profile URLs — override in Frontend/.env (see .env.example).
 * Only links with a URL are shown in the footer.
 */
export const socialLinks = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'fa-brands fa-instagram',
    url: import.meta.env.VITE_SOCIAL_INSTAGRAM?.trim() || 'https://www.instagram.com/nailsbyghand/',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'fa-brands fa-facebook',
    url: import.meta.env.VITE_SOCIAL_FACEBOOK?.trim() || 'https://www.facebook.com/kikuyunailsbyghand',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    url: import.meta.env.VITE_SOCIAL_TIKTOK?.trim() || 'https://www.tiktok.com/@nailsbyghand',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'fa-brands fa-whatsapp',
    url: import.meta.env.VITE_SOCIAL_WHATSAPP?.trim() || 'https://wa.me/254790331108',
  },
].filter((link) => link.url)
