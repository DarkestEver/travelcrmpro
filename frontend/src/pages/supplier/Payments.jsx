import { BanknotesIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SupplierPayments = () => {
  const paymentStats = [
    {
      title: 'Total Earned',
      value: '$0',
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Payments',
      value: '$0',
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Paid Out',
      value: '$0',
      icon: CheckCircleIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your earnings and payment history
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {paymentStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        
        <div className="px-6 py-12 text-center">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payment history yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Your payment transactions will appear here
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Coming Soon:</span> Payment tracking and withdrawal features are under development. 
          You'll be able to view detailed payment history, request withdrawals, and manage payment methods.
        </p>
      </div>
    </div>
  );
};

export default SupplierPayments;
