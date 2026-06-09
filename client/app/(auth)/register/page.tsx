'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Eye, EyeOff, Building2 } from 'lucide-react';
import Link from 'next/link';

import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  workspace_name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInputs) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        workspaceName: data.workspace_name,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { token, user } = response.data.data;
      
      setToken(token);
      setUser(user);
      
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950">
      {/* Left side (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 border-r border-slate-800 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">EstateFlow CRM</span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight leading-none">
            Close more deals, faster.
          </h1>
          <p className="text-lg text-slate-400">
            Streamline your real estate operations, manage client pipelines, and enhance communication within a unified platform.
          </p>

          <div className="space-y-4 pt-4">
            {[
              'Manage leads and contacts',
              'Track deals and properties',
              'AI powered follow ups',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-300">
                <div className="flex-shrink-0 p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} EstateFlow CRM. All rights reserved.
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">Get started with your new CRM workspace</p>
          </div>

          {apiError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md text-sm">
              {apiError}
            </div>
          ) : null}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                className="bg-slate-900 border-slate-800 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div>
              <Label htmlFor="workspace_name">Workspace Name</Label>
              <Input
                id="workspace_name"
                type="text"
                className="bg-slate-900 border-slate-800 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
                placeholder="Acme Realty"
                error={errors.workspace_name?.message}
                {...register('workspace_name')}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="bg-slate-900 border-slate-800 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
                placeholder="name@company.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 pr-10"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 pr-10"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Sign Up
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
