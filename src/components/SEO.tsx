import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = 'Poise', 
  description = 'Your premium destination for quality products.',
  type = 'website',
  name = 'Poise'
}) => {
  const finalTitle = title === 'Poise' ? title : `${title} | Poise`;
  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      
      { /* OpenGraph tags */ }
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      
      { /* Twitter tags */ }
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
