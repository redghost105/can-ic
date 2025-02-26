export type Session = {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'customer' | 'driver' | 'shop' | 'admin';
  };
}; 