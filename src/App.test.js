import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./PortfolioParticles', () => function MockPortfolioParticles() {
  return <div data-testid="portfolio-particles" />;
});

test('renders inventory login page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Inventory-&-Stock-management/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
});
