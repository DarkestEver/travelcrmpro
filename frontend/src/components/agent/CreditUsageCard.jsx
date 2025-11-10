import { useQuery } from '@tanstack/react-query';
import { getCreditStatus } from '../../services/agentCreditAPI';
import { ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/format';

const CreditUsageCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['credit-status'],
    queryFn: getCreditStatus,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6">
        <p className="text-red-600 text-sm">Failed to load credit status</p>
      </div>
    );
  }

  const credit = data?.data?.credit || {};
  const {
    creditLimit = 0,
    creditUsed = 0,
    availableCredit = 0,
    utilizationPercentage = 0,
    status = 'healthy',
  } = credit;

  const getStatusColor = () => {
    if (status === 'critical') return 'text-red-600 bg-red-50';
    if (status === 'warning') return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressBarColor = () => {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CreditCardIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Credit Limit</h3>
        </div>
        {status !== 'healthy' && (
          <ExclamationTriangleIcon 
            className={`h-5 w-5 ${status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}
          />
        )}
      </div>

      {/* Credit Amount */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(availableCredit)}
          </span>
          <span className="text-sm text-gray-500">
            of {formatCurrency(creditLimit)}
          </span>
        </div>
        <p className="text-sm text-gray-600">Available Credit</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Used: {formatCurrency(creditUsed)}</span>
          <span>{utilizationPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        {status === 'critical' && 'Critical - Limit Reached'}
        {status === 'warning' && 'Warning - Limit Almost Reached'}
        {status === 'healthy' && 'Healthy'}
      </div>

      {/* Warning Messages */}
      {status === 'critical' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            You've reached your credit limit. Please contact support to increase your limit or complete pending bookings.
          </p>
        </div>
      )}

      {status === 'warning' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You're approaching your credit limit. Consider requesting a limit increase.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditUsageCard;
