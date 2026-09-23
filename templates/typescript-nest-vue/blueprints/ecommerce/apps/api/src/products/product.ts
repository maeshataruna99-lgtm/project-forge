export type Product = { id: string; name: string; description: string; priceCents: number; currency: 'USD'; category: string };

export const starterProducts: Product[] = [
  { id: 'mug-01', name: 'Ceramic mug', description: 'A sample everyday mug.', priceCents: 1800, currency: 'USD', category: 'Home' },
  { id: 'bag-01', name: 'Canvas tote', description: 'A sample reusable tote bag.', priceCents: 2400, currency: 'USD', category: 'Accessories' },
  { id: 'notebook-01', name: 'Field notebook', description: 'A sample ruled notebook.', priceCents: 900, currency: 'USD', category: 'Stationery' },
];
