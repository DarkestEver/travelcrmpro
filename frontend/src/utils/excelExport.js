import * as XLSX from 'xlsx';

// Export revenue report to Excel
export const exportRevenueToExcel = (data, dateRange) => {
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Revenue Report'],
    ['Date Range:', `${dateRange.start} - ${dateRange.end}`],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Metric', 'Value'],
    ['Total Revenue', `$${data.totalRevenue?.toFixed(2) || '0.00'}`],
    ['Average Booking Value', `$${data.avgBookingValue?.toFixed(2) || '0.00'}`],
    ['Total Bookings', data.totalBookings || 0],
    ['Growth Rate', `${data.growthRate?.toFixed(2) || '0'}%`],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Revenue by service type
  if (data.byServiceType && data.byServiceType.length > 0) {
    const serviceData = [
      ['Service Type', 'Revenue', 'Bookings', 'Percentage'],
      ...data.byServiceType.map(item => [
        item.type,
        item.revenue,
        item.bookings,
        `${item.percentage}%`,
      ]),
    ];
    
    const serviceSheet = XLSX.utils.aoa_to_sheet(serviceData);
    serviceSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, serviceSheet, 'By Service Type');
  }
  
  // Top destinations
  if (data.topDestinations && data.topDestinations.length > 0) {
    const destData = [
      ['Destination', 'Revenue', 'Bookings'],
      ...data.topDestinations.map(item => [
        item.destination,
        item.revenue,
        item.bookings,
      ]),
    ];
    
    const destSheet = XLSX.utils.aoa_to_sheet(destData);
    destSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, destSheet, 'Top Destinations');
  }
  
  // Monthly breakdown
  if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
    const monthlyData = [
      ['Month', 'Revenue', 'Bookings', 'Avg Booking Value', 'Growth'],
      ...data.monthlyBreakdown.map(item => [
        item.month,
        item.revenue,
        item.bookings,
        item.avgBookingValue,
        `${item.growth}%`,
      ]),
    ];
    
    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    monthlySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Breakdown');
  }
  
  // Save file
  const fileName = `Revenue_Report_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export agent performance to Excel
export const exportAgentPerformanceToExcel = (data) => {
  const wb = XLSX.utils.book_new();
  
  // Rankings sheet
  if (data.rankings && data.rankings.length > 0) {
    const rankingsData = [
      ['Agent Performance Report'],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Rank', 'Agent Name', 'Email', 'Revenue', 'Bookings', 'Conversion Rate', 'Avg Booking Value'],
      ...data.rankings.map((agent, index) => [
        index + 1,
        agent.name,
        agent.email,
        agent.totalRevenue,
        agent.totalBookings,
        `${agent.conversionRate}%`,
        agent.avgBookingValue,
      ]),
    ];
    
    const rankingsSheet = XLSX.utils.aoa_to_sheet(rankingsData);
    rankingsSheet['!cols'] = [
      { wch: 8 }, 
      { wch: 20 }, 
      { wch: 25 }, 
      { wch: 15 }, 
      { wch: 12 }, 
      { wch: 16 }, 
      { wch: 18 }
    ];
    
    XLSX.utils.book_append_sheet(wb, rankingsSheet, 'Rankings');
  }
  
  // Performance distribution
  if (data.distribution) {
    const distData = [
      ['Performance Distribution'],
      [],
      ['Category', 'Count', 'Percentage'],
      ['Excellent', data.distribution.excellent || 0, `${data.distribution.excellentPct || 0}%`],
      ['Good', data.distribution.good || 0, `${data.distribution.goodPct || 0}%`],
      ['Average', data.distribution.average || 0, `${data.distribution.averagePct || 0}%`],
      ['Needs Improvement', data.distribution.needsImprovement || 0, `${data.distribution.needsImprovementPct || 0}%`],
    ];
    
    const distSheet = XLSX.utils.aoa_to_sheet(distData);
    distSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, distSheet, 'Distribution');
  }
  
  // Save file
  const fileName = `Agent_Performance_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export booking trends to Excel
export const exportBookingTrendsToExcel = (data) => {
  const wb = XLSX.utils.book_new();
  
  // Trends overview
  const overviewData = [
    ['Booking Trends Report'],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Metric', 'Value'],
    ['Trending Destination', data.trendingDestination || 'N/A'],
    ['Peak Season', data.peakSeason || 'N/A'],
    ['Growth Trend', `${data.growthTrend || 0}%`],
  ];
  
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  overviewSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');
  
  // Monthly trends
  if (data.monthlyTrends && data.monthlyTrends.length > 0) {
    const trendsData = [
      ['Month', 'Bookings', 'Revenue', 'Trend'],
      ...data.monthlyTrends.map(item => [
        item.month,
        item.bookings,
        item.revenue,
        item.trend,
      ]),
    ];
    
    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    trendsSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, trendsSheet, 'Monthly Trends');
  }
  
  // Popular destinations
  if (data.popularDestinations && data.popularDestinations.length > 0) {
    const destData = [
      ['Destination', 'Bookings', 'Revenue', 'Trend'],
      ...data.popularDestinations.map(item => [
        item.destination,
        item.bookings,
        item.revenue,
        item.trend,
      ]),
    ];
    
    const destSheet = XLSX.utils.aoa_to_sheet(destData);
    destSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, destSheet, 'Popular Destinations');
  }
  
  // Seasonal patterns
  if (data.seasonalPatterns && data.seasonalPatterns.length > 0) {
    const seasonData = [
      ['Season', 'Bookings', 'Revenue', 'Change %'],
      ...data.seasonalPatterns.map(item => [
        item.season,
        item.bookings,
        item.revenue,
        `${item.change}%`,
      ]),
    ];
    
    const seasonSheet = XLSX.utils.aoa_to_sheet(seasonData);
    seasonSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, seasonSheet, 'Seasonal Patterns');
  }
  
  // Day of week analysis
  if (data.dayOfWeekAnalysis && data.dayOfWeekAnalysis.length > 0) {
    const dowData = [
      ['Day', 'Bookings', 'Percentage'],
      ...data.dayOfWeekAnalysis.map(item => [
        item.day,
        item.bookings,
        `${item.percentage}%`,
      ]),
    ];
    
    const dowSheet = XLSX.utils.aoa_to_sheet(dowData);
    dowSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, dowSheet, 'Day of Week');
  }
  
  // Forecast
  if (data.forecast && data.forecast.length > 0) {
    const forecastData = [
      ['Month', 'Predicted Bookings', 'Confidence'],
      ...data.forecast.map(item => [
        item.month,
        item.predictedBookings,
        item.confidence,
      ]),
    ];
    
    const forecastSheet = XLSX.utils.aoa_to_sheet(forecastData);
    forecastSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, forecastSheet, 'Forecast');
  }
  
  // Save file
  const fileName = `Booking_Trends_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export customers to Excel
export const exportCustomersToExcel = (customers) => {
  const wb = XLSX.utils.book_new();
  
  const customerData = [
    ['Customer Database Export'],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Name', 'Email', 'Phone', 'Address', 'Status', 'Total Bookings', 'Total Spent', 'Created Date'],
    ...customers.map(customer => [
      customer.name,
      customer.email,
      customer.phone || '',
      customer.address || '',
      customer.status || 'active',
      customer.totalBookings || 0,
      customer.totalSpent || 0,
      new Date(customer.createdAt).toLocaleDateString(),
    ]),
  ];
  
  const sheet = XLSX.utils.aoa_to_sheet(customerData);
  sheet['!cols'] = [
    { wch: 25 }, 
    { wch: 30 }, 
    { wch: 15 }, 
    { wch: 30 }, 
    { wch: 12 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 15 }
  ];
  
  XLSX.utils.book_append_sheet(wb, sheet, 'Customers');
  
  const fileName = `Customers_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export bookings to Excel
export const exportBookingsToExcel = (bookings) => {
  const wb = XLSX.utils.book_new();
  
  const bookingData = [
    ['Bookings Export'],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Reference', 'Customer', 'Destination', 'Start Date', 'End Date', 'Travelers', 'Total Amount', 'Amount Paid', 'Balance', 'Status'],
    ...bookings.map(booking => [
      booking.reference,
      booking.customer?.name || 'N/A',
      booking.destination,
      new Date(booking.startDate).toLocaleDateString(),
      new Date(booking.endDate).toLocaleDateString(),
      booking.travelers,
      booking.totalAmount,
      booking.amountPaid,
      booking.totalAmount - booking.amountPaid,
      booking.status,
    ]),
  ];
  
  const sheet = XLSX.utils.aoa_to_sheet(bookingData);
  sheet['!cols'] = [
    { wch: 15 }, 
    { wch: 25 }, 
    { wch: 20 }, 
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 10 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, sheet, 'Bookings');
  
  const fileName = `Bookings_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export default {
  exportRevenueToExcel,
  exportAgentPerformanceToExcel,
  exportBookingTrendsToExcel,
  exportCustomersToExcel,
  exportBookingsToExcel,
};