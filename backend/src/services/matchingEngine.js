const SupplierPackageCache = require('../models/SupplierPackageCache');
const AIProcessingLog = require('../models/AIProcessingLog');
const Itinerary = require('../models/Itinerary');

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

      console.log(`🔍 Matching packages for criteria:`, {
        destination: criteria.destination || 'ANY',
        dates: criteria.dates?.preferredStart || 'FLEXIBLE',
        travelers: criteria.travelers?.adults || 'ANY',
        budget: criteria.budget?.max || 'ANY'
      });

      // Get all active packages for tenant from SupplierPackageCache
      let packages = await SupplierPackageCache.searchPackages(tenantId, criteria);
      console.log(`📦 Found ${packages.length} supplier packages`);

      // ALSO get published itineraries and convert them to package format
      const itineraries = await Itinerary.find({
        tenantId,
        status: 'published'
      }).lean();
      console.log(`📦 Found ${itineraries.length} published itineraries`);

      // Convert itineraries to package format
      const itineraryPackages = itineraries.map(it => ({
        _id: it._id,
        title: it.title,
        destination: it.destination,
        duration: it.duration,
        estimatedCost: it.estimatedCost,
        travelStyle: it.travelStyle,
        themes: it.themes,
        overview: it.overview,
        inclusions: it.inclusions,
        exclusions: it.exclusions,
        suitableFor: it.suitableFor,
        sourceType: 'itinerary', // Mark as itinerary
        // Map to expected package structure
        packageData: {
          destination: it.destination?.city || it.destination?.country,
          duration: it.duration?.days || it.duration,
          price: it.estimatedCost?.baseCost || it.estimatedCost?.totalCost,
          currency: it.estimatedCost?.currency || 'USD',
          themes: it.themes || [],
          style: it.travelStyle
        }
      }));

      // Mark supplier packages
      packages = packages.map(pkg => ({ ...pkg, sourceType: 'supplier' }));

      // Combine both sources
      packages = [...packages, ...itineraryPackages];

      // Deduplicate by title and destination (case-insensitive)
      const seenPackages = new Map();
      packages = packages.filter(pkg => {
        const key = `${(pkg.title || '').toLowerCase()}_${JSON.stringify(pkg.destination || {})}`;
        if (seenPackages.has(key)) {
          console.log(`⚠️  Duplicate detected: ${pkg.title} - Keeping first occurrence`);
          return false;
        }
        seenPackages.set(key, true);
        return true;
      });

      console.log(`📦 Total packages after deduplication: ${packages.length} (${itineraryPackages.length} itineraries + ${packages.filter(p => p.sourceType === 'supplier').length} supplier packages)`);

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

      // Filter packages based on quality criteria
      const MIN_TOTAL_SCORE = 30; // Minimum total score (out of 100)
      const MIN_DESTINATION_SCORE = 20; // Minimum destination score (out of 40)
      
      const qualityMatches = scoredPackages.filter(match => {
        // Must meet minimum total score
        if (match.score < MIN_TOTAL_SCORE) {
          console.log(`⚠️  Filtered out: ${match.package.title || match.package.packageName} - Score too low (${match.score})`);
          return false;
        }
        
        // Must have reasonable destination match
        if (match.breakdown.destination < MIN_DESTINATION_SCORE) {
          console.log(`⚠️  Filtered out: ${match.package.title || match.package.packageName} - Destination mismatch (${match.breakdown.destination}/40)`);
          return false;
        }
        
        return true;
      });

      console.log(`✅ Filtered matches: ${scoredPackages.length} → ${qualityMatches.length} (removed ${scoredPackages.length - qualityMatches.length} low-quality matches)`);

      // Sort by score (highest first)
      qualityMatches.sort((a, b) => b.score - a.score);

      // Log top scoring packages for debugging
      if (qualityMatches.length > 0) {
        console.log(`🎯 Top 3 quality matches:`);
        qualityMatches.slice(0, 3).forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.package.title || match.package.packageName} - Score: ${match.score}/100`);
          console.log(`     Destination: ${JSON.stringify(match.package.destination)}`);
          console.log(`     Breakdown:`, match.breakdown);
          console.log(`     Reasons:`, match.matchReasons);
        });
      } else {
        console.log(`❌ No packages met quality criteria (min score: ${MIN_TOTAL_SCORE}, min destination: ${MIN_DESTINATION_SCORE})`);
      }

      // Take top 5 matches from quality-filtered results
      const topMatches = qualityMatches.slice(0, 5);

      // Log the matching operation (only if emailId provided)
      if (emailId) {
        try {
          await AIProcessingLog.create({
            emailLogId: emailId,
            processingType: 'matching',
            status: 'completed',
            result: {
              totalPackages: packages.length,
              qualifiedMatches: qualityMatches.length,
              topMatches: topMatches.length,
              criteria,
              filters: {
                minTotalScore: MIN_TOTAL_SCORE,
                minDestinationScore: MIN_DESTINATION_SCORE
              }
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
    if (!inquiry.destination) {
      return { points: 15, reason: 'No specific destination requested' };
    }

    const inquiryDest = inquiry.destination.toLowerCase().trim();
    
    // Handle both string and object destination formats
    let packageDest = '';
    let packageCountry = '';
    let packageRegion = '';
    let packageName = '';
    
    if (typeof packageData.destination === 'string') {
      packageDest = packageData.destination.toLowerCase();
      packageCountry = packageData.country?.toLowerCase() || '';
      packageRegion = packageData.region?.toLowerCase() || '';
      packageName = packageData.packageName?.toLowerCase() || packageData.title?.toLowerCase() || '';
    } else if (typeof packageData.destination === 'object') {
      // Itinerary format
      packageDest = (packageData.destination?.city || packageData.destination?.country || '').toLowerCase();
      packageCountry = (packageData.destination?.country || '').toLowerCase();
      packageName = packageData.title?.toLowerCase() || '';
    }

    // Exact match on destination
    if (inquiryDest === packageDest || inquiryDest === packageCountry) {
      return { points: 40, reason: `Exact destination match: ${packageDest || packageCountry}` };
    }

    // Country match
    if (packageCountry && inquiryDest === packageCountry) {
      return { points: 35, reason: `Country match: ${packageCountry}` };
    }

    // Check if inquiry destination is contained in package destination (e.g., "paris" in "Paris, France")
    if (packageDest.includes(inquiryDest) || inquiryDest.includes(packageDest)) {
      return { points: 38, reason: `Destination contains match: ${packageDest}` };
    }

    // Check if inquiry destination is in package country
    if (packageCountry.includes(inquiryDest) || inquiryDest.includes(packageCountry)) {
      return { points: 36, reason: `Country contains match: ${packageCountry}` };
    }

    // Region match
    if (packageRegion && (inquiryDest === packageRegion || packageRegion.includes(inquiryDest))) {
      return { points: 30, reason: `Region match: ${packageRegion}` };
    }

    // Check package name for destination
    if (packageName.includes(inquiryDest) || inquiryDest.includes(packageName.split(' ')[0])) {
      return { points: 32, reason: `Destination in package name` };
    }

    // Word-by-word match (flexible matching for multi-word destinations)
    const inquiryWords = inquiryDest.split(/[\s,]+/).filter(w => w.length > 2);
    const packageWords = packageDest.split(/[\s,]+/).filter(w => w.length > 2);
    
    let matchedWords = 0;
    for (const iWord of inquiryWords) {
      for (const pWord of packageWords) {
        if (iWord === pWord || iWord.includes(pWord) || pWord.includes(iWord)) {
          matchedWords++;
          break;
        }
      }
    }

    if (matchedWords > 0) {
      const matchPercent = matchedWords / inquiryWords.length;
      const points = Math.round(25 + (matchPercent * 10)); // 25-35 points
      return { points, reason: `Partial destination match (${matchedWords}/${inquiryWords.length} words)` };
    }

    // Check if inquiry destination is in package highlights or description
    const highlights = packageData.highlights?.join(' ').toLowerCase() || '';
    if (highlights.includes(inquiryDest)) {
      return { points: 20, reason: `Destination mentioned in highlights` };
    }

    // Check in inclusions/activities
    const inclusions = packageData.inclusionDetails?.join(' ').toLowerCase() || '';
    const activities = packageData.activities?.join(' ').toLowerCase() || '';
    if (inclusions.includes(inquiryDest) || activities.includes(inquiryDest)) {
      return { points: 18, reason: `Destination in package details` };
    }

    return { points: 0, reason: 'No destination match' };
  }

  /**
   * Score date match
   */
  scoreDates(inquiry, packageData) {
    // For Itineraries that don't have validFrom/validUntil, give flexible dates score
    if (!packageData.validFrom || !packageData.validUntil) {
      return { points: 20, reason: 'Available year-round' };
    }

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
    
    // Handle both SupplierPackageCache and Itinerary formats
    let packagePrice, currency;
    if (packageData.pricePerPerson) {
      // SupplierPackageCache format
      packagePrice = packageData.pricePerPerson.amount;
      currency = packageData.pricePerPerson.currency;
    } else if (packageData.price) {
      // Itinerary format (converted packageData)
      packagePrice = packageData.price;
      currency = packageData.currency || 'USD';
    } else {
      return { points: 10, reason: 'Price information unavailable' };
    }
    
    // Convert currencies if needed (simplified - assume same currency for now)
    const priceDiff = Math.abs(packagePrice - inquiryBudget);
    const percentDiff = (priceDiff / inquiryBudget) * 100;

    // Within 5% of budget
    if (percentDiff <= 5) {
      return { points: 20, reason: `Perfect budget match (${currency} ${packagePrice})` };
    }

    // Within 10%
    if (percentDiff <= 10) {
      return { points: 18, reason: `Excellent budget fit (${currency} ${packagePrice})` };
    }

    // Within 20%
    if (percentDiff <= 20) {
      return { points: 15, reason: `Good budget fit (${currency} ${packagePrice})` };
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

    // For Itineraries that don't have minPax/maxPax, assume flexible capacity
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
