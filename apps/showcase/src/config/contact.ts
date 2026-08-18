export const CONTACT = {
  whatsappUrl: 'https://wa.me/2290153287336',
  email: 'seriquicinee@gmail.com',
};

export function mailtoLink(subject: string): string {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}

export const EXTERNAL_LINKS = {
  aiLab: 'https://datainsight-ailab.netlify.app',
};