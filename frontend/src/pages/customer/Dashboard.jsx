import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getUpcomingTrips,
  getRecentActivity,
} from '../../services/customerDashboardAPI';
import {
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  // Fetch dashboard data
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['customerDashboardSummary'],
    queryFn: getDashboardSummary,
  });

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['customerUpcomingTrips'],
    queryFn: getUpcomingTrips,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['customerRecentActivity'],
    queryFn: getRecentActivity,
  });

  const summary = summaryData?.data?.summary;
  const upcomingTrips = tripsData?.data?.trips || [];
  const recentActivities = activityData?.data?.activities || [];

  // Stats cards
  const stats = [
    {
      name: 'Total Bookings',
      value: summary?.bookings?.total || 0,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      link: '/customer/bookings',
    },
    {
      name: 'Upcoming Trips',
      value: summary?.bookings?.upcoming || 0,
      icon: MapPinIcon,
      color: 'bg-green-500',
      link: '/customer/bookings?status=confirmed',
    },
    {
      name: 'Pending Invoices',
      value: summary?.invoices?.byStatus?.pending?.count || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      link: '/customer/invoices?status=pending',
    },
    {
      name: 'Outstanding Balance',
      value: `$${(summary?.invoices?.outstandingBalance || 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-red-500',
      link: '/customer/invoices',
    },
  ];

  // Activity type badges
  const getActivityBadge = (type) => {
    const badges = {
      booking: 'bg-blue-100 text-blue-800',
      invoice: 'bg-orange-100 text-orange-800',
      quote: 'bg-purple-100 text-purple-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type) => {
    const icons = {
      booking: CalendarIcon,
      invoice: DocumentTextIcon,
      quote: ChatBubbleLeftIcon,
    };
    return icons[type] || ClockIcon;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your travel bookings and activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
              <Link
                to="/customer/bookings"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>

            <div className="p-6">
              {tripsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading trips...</div>
              ) : upcomingTrips.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No upcoming trips</p>
                  <Link
                    to="/customer/request-quote"
                    className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
                  >
                    Request a quote
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {trip.itineraryId?.title || trip.bookingNumber}
                          </h3>
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {trip.itineraryId?.destination || 'Destination'}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {trip.travelDates?.startDate
                              ? format(new Date(trip.travelDates.startDate), 'MMM dd, yyyy')
                              : 'Date TBD'}{' '}
                            -{' '}
                            {trip.travelDates?.endDate
                              ? format(new Date(trip.travelDates.endDate), 'MMM dd, yyyy')
                              : 'Date TBD'}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {trip.daysUntil} days
                          </span>
                          <Link
                            to={`/customer/bookings/${trip._id}`}
                            className="mt-2 block text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>

            <div className="p-6">
              {activityLoading ? (
                <div className="text-center py-8 text-gray-500">Loading activity...</div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <ActivityIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getActivityBadge(
                                activity.type
                              )}`}
                            >
                              {activity.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(activity.date), 'MMM dd')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-900">{activity.number}</p>
                          <p className="text-xs text-gray-600 capitalize">{activity.status}</p>
                          {activity.amount && (
                            <p className="text-xs font-medium text-gray-900">
                              ${activity.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/customer/request-quote"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span>Request New Quote</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                to="/customer/bookings"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>View All Bookings</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                to="/customer/invoices"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>View Invoices</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
