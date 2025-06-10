'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/lib/toastUtils';

const appointmentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  customerPreferredDates: z
    .array(
      z.object({
        date: z.string().min(1, 'Date is required'),
        time: z.string().min(1, 'Time is required'),
      }),
    )
    .min(1, 'At least one preferred date is required')
    .max(3, 'Maximum 3 preferred dates allowed'),
  message: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate quarter-hour time options (9 AM to 6 PM)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime =
          hour > 12
            ? `${hour - 12}:${minute.toString().padStart(2, '0')} PM`
            : hour === 12
              ? `12:${minute.toString().padStart(2, '0')} PM`
              : `${hour}:${minute.toString().padStart(2, '0')} AM`;
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerPreferredDates: [{ date: '', time: '' }],
    },
  });

  const {
    fields: appointmentSlots,
    append: addAppointmentSlot,
    remove: removeAppointmentSlot,
  } = useFieldArray({
    control,
    name: 'customerPreferredDates',
  });

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Enhanced add appointment slot function with today's date as default
  const addAppointmentSlotWithToday = () => {
    addAppointmentSlot({ date: getTodayString(), time: '' });
  };

  // Set today's date as default for the first appointment slot when form loads
  useEffect(() => {
    if (appointmentSlots.length > 0 && !appointmentSlots[0].date) {
      setValue('customerPreferredDates.0.date', getTodayString());
    }
  }, [appointmentSlots, setValue]);

  // Helper function to handle date input focus - set today's date if empty
  const handleDateFocus = (index: number, currentValue: string) => {
    if (!currentValue) {
      setValue(`customerPreferredDates.${index}.date`, getTodayString());
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        '/api/appointments',
        {
          ...data,
          propertyId: id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const result = response.data;

      if (response.status < 200 || response.status >= 300) {
        throw new Error(result.message || 'Failed to schedule appointment');
      }

      showToast(
        'success',
        'Appointment request submitted successfully! The agent will review and confirm your appointment shortly.',
      );

      // Delay navigation to allow toast to be seen
      setTimeout(() => {
        window.location.href = `/properties/${id}`;
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to schedule appointment',
      );
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-screen-lg mx-auto px-4">
        {/* Back button */}
        <Link
          href={`/properties/${id}`}
          className="inline-block mb-6 text-gray-600 hover:text-gray-800"
        >
          ◄ Back to property
        </Link>
        <h1 className="text-2xl font-bold text-center mb-8">
          Schedule a Viewing
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-md mx-auto space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register('firstName', {
                  required: 'First name is required',
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <span className="text-red-500 text-sm">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <span className="text-red-500 text-sm">
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <span className="text-red-500 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              {...register('phone', { required: 'Phone number is required' })}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && (
              <span className="text-red-500 text-sm">
                {errors.phone.message}
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Preferred Date & Time
              </label>
              {appointmentSlots.length < 3 && (
                <button
                  type="button"
                  onClick={addAppointmentSlotWithToday}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                >
                  + Add another option
                </button>
              )}
            </div>
            <div className="space-y-4">
              {appointmentSlots.map((field, index) => (
                <div
                  key={field.id}
                  className="relative p-4 border border-gray-300 rounded-md"
                >
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAppointmentSlot(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        {...register(`customerPreferredDates.${index}.date`, {
                          required: 'Date is required',
                        })}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onFocus={() => {
                          const currentValue = watch(
                            `customerPreferredDates.${index}.date`,
                          );
                          handleDateFocus(index, currentValue);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.customerPreferredDates?.[index]?.date && (
                        <span className="text-red-500 text-sm">
                          {errors.customerPreferredDates[index].date?.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <select
                        {...register(`customerPreferredDates.${index}.time`, {
                          required: 'Time is required',
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select time</option>
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.customerPreferredDates?.[index]?.time && (
                        <span className="text-red-500 text-sm">
                          {errors.customerPreferredDates[index].time?.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              {...register('message')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSubmitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Schedule Appointment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
