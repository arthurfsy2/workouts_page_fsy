interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  keywords: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Arthur Feng 锻炼记录',
  siteUrl: 'https://blog.4a1801.life',
  logo: 'https://pan.4a1801.life:11443/d/public/logo1.jpg',
  description: 'Personal site and blog',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: '📝 Blog',
      url: 'https://blog.4a1801.life',
    },
    {
      name: '⭐ Repo',
      url: 'https://github.com/arthurfsy2/workouts_page_fsy',
    },
  ],
};

export default data;
