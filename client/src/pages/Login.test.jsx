import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';
import api from '../api/axios.js';

// Replace the real axios instance with a fake one, so these tests never
// make a real network call - we only care what the component *does*,
// not whether a real backend responds.
vi.mock('../api/axios.js', () => ({
  default: { post: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows an error and does not call the API when fields are empty', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls the API with the entered credentials', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token', user: {} } });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'whatever-they-typed' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'whatever-they-typed',
      })
    );
  });
});
