'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.ok) {
      toast.success('Logged in successfully!');
      router.push('/admin/dashboard');
    } else {
      toast.error('Login failed: ' + result?.error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 shadow-md rounded-md mt-10 bg-white">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="email">
            Email:
          </label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            id="email"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="password">
            Password:
          </label>
          <input
            {...register('password', { required: 'Password is required' })}
            type="password"
            id="password"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
}
