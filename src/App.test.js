import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Galaxy', () => function MockGalaxy() {
  return <div data-testid="galaxy-background" />;
});

test('renders inventory login page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Inventory-&-Stock-management/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
});
