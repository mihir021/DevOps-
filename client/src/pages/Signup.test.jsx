import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from './Signup.jsx';
import api from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  default: { post: vi.fn() },
}));

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
}

function fillForm({ name, email, password }) {
  fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: password } });
}

describe('Signup page', () => {
  it('renders the signup form', () => {
    renderSignup();
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows an error and does not call the API for a weak password', () => {
    renderSignup();

    fillForm({ name: 'Test User', email: 'test@example.com', password: 'weak' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText(/password must be/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows an error and does not call the API for an invalid email', () => {
    renderSignup();

    fillForm({ name: 'Test User', email: 'not-an-email', password: 'StrongP@ss1' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows an error and does not call the API when the name is missing', () => {
    renderSignup();

    fillForm({ name: '', email: 'test@example.com', password: 'StrongP@ss1' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls the API when the form is valid', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token', user: {} } });

    renderSignup();

    fillForm({ name: 'Test User', email: 'test@example.com', password: 'StrongP@ss1' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongP@ss1',
      })
    );
  });
});
