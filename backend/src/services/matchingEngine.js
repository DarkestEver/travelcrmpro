const SupplierPackageCache = require('../models/SupplierPackageCache');
const AIProcessingLog = require('../models/AIProcessingLog');

class MatchingEngine {
  /**
   * Find matching packages for customer inquiry
   */
  async matchPackages(extractedData, tenantId, emailId = null) {
    const startTime = Date.now();
    
    try {
      // Build search criteria
      const criteria = {
        destination: extractedData.destination,
        dates: extractedData.dates,
        travelers: extractedData.travelers,
        budget: extractedData.budget,
        packageType: extractedData.packageType
      };

      // Get all active packages for tenant
      const packages = await SupplierPackageCache.searchPackages(tenantId, criteria);

      // Score each package
      const scoredPackages = packages.map(pkg => {
        const score = this.calculateMatchScore(extractedData, pkg);
        return {
          package: pkg,
          score: score.total,
          breakdown: score.breakdown,
          matchReasons: score.reasons,
          gaps: score.gaps
        };
      });

      // Sort by score (highest first)
      scoredPackages.sort((a, b) => b.score - a.score);

      // Take top 5 matches
      const topMatches = scoredPackages.slice(0, 5);

      // Log the matching operation (only if emailId provided)
      if (emailId) {
        try {
          await AIProcessingLog.create({
            emailLogId: emailId,
            processingType: 'matching',
            status: 'completed',
            result: {
              totalPackages: packages.length,
              topMatches: topMatches.length,
              criteria
            },
            confidence: topMatches.length > 0 ? topMatches[0].score : 0,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            tenantId
          });
        } catch (logError) {
          console.warn('Failed to log matching operation:', logError.message);
          // Don't throw - logging failure shouldn't break matching
        }
      }

      return topMatches;
    } catch (error) {
      console.error('Matching engine error:', error);
      
      // Log error (only if emailId provided)
      if (emailId) {
        try {
          await AIProcessingLog.create({
            emailLogId: emailId,
            processingType: 'matching',
            status: 'failed',
            error: error.message,
            tenantId
          });
        } catch (logError) {
          console.warn('Failed to log matching error:', logError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Calculate match score for a package
   * Total: 100 points
   * - Destination: 40 points
   * - Dates: 25 points
   * - Budget: 20 points
   * - Travelers: 10 points
   * - Requirements: 5 points
   */
  calculateMatchScore(inquiry, packageData) {
    let score = 0;
    const breakdown = {};
    const reasons = [];
    const gaps = [];

    // 1. DESTINATION MATCH (40 points)
    const destScore = this.scoreDestination(inquiry, packageData);
    score += destScore.points;
    breakdown.destination = destScore.points;
    if (destScore.points > 30) {
      reasons.push(destScore.reason);
    } else if (destScore.points < 20) {
      gaps.push(`Destination mismatch: looking for ${inquiry.destination}, package offers ${packageData.destination}`);
    }

    // 2. DATE MATCH (25 points)
    const dateScore = this.scoreDates(inquiry, packageData);
    score += dateScore.points;
    breakdown.dates = dateScore.points;
    if (dateScore.points > 15) {
      reasons.push(dateScore.reason);
    } else if (dateScore.points < 10) {
      gaps.push(dateScore.gap);
    }

    // 3. BUDGET MATCH (20 points)
    const budgetScore = this.scoreBudget(inquiry, packageData);
    score += budgetScore.points;
    breakdown.budget = budgetScore.points;
    if (budgetScore.points > 15) {
      reasons.push(budgetScore.reason);
    } else if (budgetScore.points < 10) {
      gaps.push(budgetScore.gap);
    }

    // 4. TRAVELERS MATCH (10 points)
    const travelerScore = this.scoreTravelers(inquiry, packageData);
    score += travelerScore.points;
    breakdown.travelers = travelerScore.points;
    if (travelerScore.points < 5) {
      gaps.push(travelerScore.gap);
    }

    // 5. REQUIREMENTS MATCH (5 points)
    const reqScore = this.scoreRequirements(inquiry, packageData);
    score += reqScore.points;
    breakdown.requirements = reqScore.points;

    return {
      total: Math.round(score),
      breakdown,
      reasons,
      gaps
    };
  }

  /**
   * Score destination match
   */
  scoreDestination(inquiry, packageData) {
    const inquiryDest = inquiry.destination?.toLowerCase() || '';
    const packageDest = packageData.destination?.toLowerCase() || '';
    const packageCountry = packageData.country?.toLowerCase() || '';
    const packageRegion = packageData.region?.toLowerCase() || '';

    // Exact match
    if (inquiryDest === packageDest) {
      return { points: 40, reason: `Exact destination match: ${packageData.destination}` };
    }

    // Country match
    if (inquiryDest === packageCountry) {
      return { points: 35, reason: `Country match: ${packageData.country}` };
    }

    // Region match
    if (inquiryDest === packageRegion) {
      return { points: 30, reason: `Region match: ${packageData.region}` };
    }

    // Partial match (one word in common)
    const inquiryWords = inquiryDest.split(' ');
    const packageWords = packageDest.split(' ');
    const commonWords = inquiryWords.filter(word => 
      word.length > 3 && packageWords.some(pw => pw.includes(word) || word.includes(pw))
    );

    if (commonWords.length > 0) {
      return { points: 25, reason: `Partial destination match` };
    }

    // Check if inquiry destination is in package highlights or description
    const highlights = packageData.highlights?.join(' ').toLowerCase() || '';
    if (highlights.includes(inquiryDest)) {
      return { points: 20, reason: `Destination mentioned in highlights` };
    }

    return { points: 0, reason: 'No destination match' };
  }

  /**
   * Score date match
   */
  scoreDates(inquiry, packageData) {
    // If inquiry has no specific dates
    if (!inquiry.dates?.preferredStart) {
      // Check if package is currently valid
      const now = new Date();
      const validFrom = new Date(packageData.validFrom);
      const validUntil = new Date(packageData.validUntil);
      
      if (now >= validFrom && now <= validUntil) {
        return { points: 20, reason: 'Package available now' };
      }
      return { points: 15, reason: 'Flexible dates' };
    }

    const inquiryStart = new Date(inquiry.dates.preferredStart);
    const inquiryEnd = inquiry.dates.preferredEnd ? new Date(inquiry.dates.preferredEnd) : null;
    const packageValidFrom = new Date(packageData.validFrom);
    const packageValidUntil = new Date(packageData.validUntil);

    // Check if inquiry dates fall within package validity
    if (inquiryStart >= packageValidFrom && inquiryStart <= packageValidUntil) {
      if (!inquiryEnd || inquiryEnd <= packageValidUntil) {
        return { points: 25, reason: `Available for requested dates (${inquiry.dates.preferredStart})` };
      }
      return { 
        points: 20, 
        reason: 'Partially available for dates',
        gap: 'End date may extend beyond package validity'
      };
    }

    // Package will be valid soon
    const daysUntilValid = Math.floor((packageValidFrom - inquiryStart) / (1000 * 60 * 60 * 24));
    if (daysUntilValid > 0 && daysUntilValid <= 30) {
      return { 
        points: 15, 
        reason: `Available ${daysUntilValid} days after preferred date`,
        gap: `Package valid from ${packageData.validFrom}`
      };
    }

    return { 
      points: 0, 
      reason: 'Dates not available',
      gap: `Inquiry: ${inquiry.dates.preferredStart}, Package: ${packageData.validFrom} - ${packageData.validUntil}`
    };
  }

  /**
   * Score budget match
   */
  scoreBudget(inquiry, packageData) {
    if (!inquiry.budget?.amount) {
      return { points: 15, reason: 'Budget flexible' };
    }

    const inquiryBudget = inquiry.budget.amount;
    const packagePrice = packageData.pricePerPerson.amount;
    
    // Convert currencies if needed (simplified - assume same currency for now)
    const priceDiff = Math.abs(packagePrice - inquiryBudget);
    const percentDiff = (priceDiff / inquiryBudget) * 100;

    // Within 5% of budget
    if (percentDiff <= 5) {
      return { points: 20, reason: `Perfect budget match (${packageData.pricePerPerson.currency} ${packagePrice})` };
    }

    // Within 10%
    if (percentDiff <= 10) {
      return { points: 18, reason: `Excellent budget fit (${packageData.pricePerPerson.currency} ${packagePrice})` };
    }

    // Within 20%
    if (percentDiff <= 20) {
      return { points: 15, reason: `Good budget fit (${packageData.pricePerPerson.currency} ${packagePrice})` };
    }

    // Within 30%
    if (percentDiff <= 30) {
      return { 
        points: 10, 
        reason: 'Moderate budget fit',
        gap: `Package ${packagePrice} vs budget ${inquiryBudget}`
      };
    }

    // Over budget
    if (packagePrice > inquiryBudget) {
      return { 
        points: 5, 
        reason: 'Above budget',
        gap: `Package ${packagePrice} exceeds budget ${inquiryBudget} by ${Math.round(percentDiff)}%`
      };
    }

    // Under budget (still worth showing)
    return { 
      points: 12, 
      reason: `Below budget (${packageData.pricePerPerson.currency} ${packagePrice})`,
      gap: `Package ${packagePrice} is ${Math.round(percentDiff)}% below budget`
    };
  }

  /**
   * Score travelers capacity match
   */
  scoreTravelers(inquiry, packageData) {
    if (!inquiry.travelers?.adults) {
      return { points: 8, reason: 'Traveler count flexible' };
    }

    const totalTravelers = (inquiry.travelers.adults || 0) + 
                          (inquiry.travelers.children || 0) + 
                          (inquiry.travelers.infants || 0);

    const minPax = packageData.minPax || 1;
    const maxPax = packageData.maxPax || 999;

    // Perfect fit
    if (totalTravelers >= minPax && totalTravelers <= maxPax) {
      return { points: 10, reason: `Accommodates ${totalTravelers} travelers` };
    }

    // Below minimum
    if (totalTravelers < minPax) {
      const shortfall = minPax - totalTravelers;
      if (shortfall <= 2) {
        return { 
          points: 7, 
          reason: 'Close to minimum group size',
          gap: `Need ${shortfall} more travelers (min ${minPax})`
        };
      }
      return { 
        points: 3, 
        reason: 'Below minimum',
        gap: `Need ${shortfall} more travelers (min ${minPax})`
      };
    }

    // Above maximum
    return { 
      points: 2, 
      reason: 'Exceeds capacity',
      gap: `Group of ${totalTravelers} exceeds max ${maxPax}`
    };
  }

  /**
   * Score special requirements match
   */
  scoreRequirements(inquiry, packageData) {
    let points = 0;
    
    // Check package type match
    if (inquiry.packageType && inquiry.packageType === packageData.packageType) {
      points += 2;
    }

    // Check meal plan
    if (inquiry.meals && packageData.inclusions?.includes('meals')) {
      points += 1;
    }

    // Check accommodation rating
    if (inquiry.accommodation?.rating) {
      const requestedRating = parseInt(inquiry.accommodation.rating);
      const hasMatchingHotel = packageData.hotels?.some(h => h.rating >= requestedRating);
      if (hasMatchingHotel) {
        points += 2;
      }
    }

    return { points };
  }
}

module.exports = new MatchingEngine();
