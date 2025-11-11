const Itinerary = require('../models/Itinerary');

/**
 * Itinerary Matching Service
 * Matches customer inquiries with existing itineraries in the database
 * 
 * NOTE: This service uses PURE DATABASE FILTERING - No AI costs!
 * - MongoDB queries for destination/duration matching
 * - JavaScript scoring algorithm (100-point system)
 * - Zero external API dependencies
 */
class ItineraryMatchingService {
  /**
   * Validate if customer inquiry has all required fields for itinerary matching
   * @param {Object} extractedData - Extracted customer inquiry data
   * @returns {Object} Validation result with missing fields
   */
  validateRequiredFields(extractedData) {
    const requiredFields = {
      destination: 'Destination (where they want to go)',
      'dates.startDate': 'Travel start date',
      'dates.endDate': 'Travel end date',
      'travelers.adults': 'Number of adult travelers',
      'budget.amount': 'Budget amount'
    };

    const missingFields = [];
    const hasRequiredFields = {};

    // Check destination
    if (!extractedData.destination) {
      missingFields.push({
        field: 'destination',
        label: requiredFields.destination,
        question: 'Which destination would you like to visit?',
        priority: 'critical'
      });
      hasRequiredFields.destination = false;
    } else {
      hasRequiredFields.destination = true;
    }

    // Check dates
    if (!extractedData.dates?.startDate || !extractedData.dates?.endDate) {
      missingFields.push({
        field: 'dates',
        label: requiredFields['dates.startDate'] + ' and ' + requiredFields['dates.endDate'],
        question: 'When would you like to travel? Please provide your preferred travel dates.',
        priority: 'critical'
      });
      hasRequiredFields.dates = false;
    } else {
      hasRequiredFields.dates = true;
    }

    // Check travelers
    if (!extractedData.travelers?.adults || extractedData.travelers.adults === 0) {
      missingFields.push({
        field: 'travelers',
        label: requiredFields['travelers.adults'],
        question: 'How many adults will be traveling?',
        priority: 'critical'
      });
      hasRequiredFields.travelers = false;
    } else {
      hasRequiredFields.travelers = true;
    }

    // Check budget
    if (!extractedData.budget?.amount) {
      missingFields.push({
        field: 'budget',
        label: requiredFields['budget.amount'],
        question: 'What is your budget for this trip?',
        priority: 'high'
      });
      hasRequiredFields.budget = false;
    } else {
      hasRequiredFields.budget = true;
    }

    // Optional but helpful fields
    const optionalFields = [];
    
    if (!extractedData.accommodation?.hotelType) {
      optionalFields.push({
        field: 'accommodation.hotelType',
        label: 'Hotel preference (budget/standard/premium/luxury)',
        question: 'What type of accommodation would you prefer?',
        priority: 'optional'
      });
    }

    if (!extractedData.mealPlan) {
      optionalFields.push({
        field: 'mealPlan',
        label: 'Meal plan preference',
        question: 'Would you like meals included in your package?',
        priority: 'optional'
      });
    }

    return {
      isValid: missingFields.length === 0,
      hasRequiredFields,
      missingFields,
      optionalFields,
      completeness: Object.values(hasRequiredFields).filter(Boolean).length / Object.keys(hasRequiredFields).length
    };
  }

  /**
   * Search for matching itineraries in the database
   * @param {Object} extractedData - Extracted customer inquiry data
   * @param {String} tenantId - Tenant ID
   * @returns {Array} Matching itineraries with scores
   */
  async searchItineraries(extractedData, tenantId) {
    try {
      const query = {
        tenantId,
        status: { $in: ['active', 'published'] } // Only active/published itineraries
      };

      // Filter by destination (case-insensitive partial match)
      if (extractedData.destination) {
        const destRegex = new RegExp(extractedData.destination, 'i');
        query.$or = [
          { 'destination.country': destRegex },
          { 'destination.city': destRegex },
          { 'destinations.country': destRegex },
          { 'destinations.city': destRegex }
        ];
      }

      // Filter by duration (within ±2 days)
      if (extractedData.dates?.startDate && extractedData.dates?.endDate) {
        const requestedDuration = Math.ceil(
          (new Date(extractedData.dates.endDate) - new Date(extractedData.dates.startDate)) / (1000 * 60 * 60 * 24)
        );
        
        query['duration.days'] = {
          $gte: requestedDuration - 2,
          $lte: requestedDuration + 2
        };
      }

      // Find matching itineraries
      const itineraries = await Itinerary.find(query)
        .select('title description destination destinations duration estimatedCost highlights inclusions images coverImage')
        .limit(10)
        .lean();

      // Score and rank itineraries
      const scoredItineraries = itineraries.map(itinerary => {
        const score = this.calculateMatchScore(itinerary, extractedData);
        return {
          itinerary,
          score: score.total,
          matchDetails: score.details,
          gaps: score.gaps
        };
      });

      // Sort by score (highest first)
      scoredItineraries.sort((a, b) => b.score - a.score);

      // Filter to only return good matches (score > 50%)
      return scoredItineraries.filter(item => item.score >= 50);

    } catch (error) {
      console.error('Error searching itineraries:', error);
      return [];
    }
  }

  /**
   * Calculate match score between itinerary and customer request
   * @param {Object} itinerary - Itinerary from database
   * @param {Object} extractedData - Customer inquiry data
   * @returns {Object} Score breakdown
   */
  calculateMatchScore(itinerary, extractedData) {
    let score = 0;
    const maxScore = 100;
    const details = {};
    const gaps = [];

    // 1. Destination match (40 points)
    const destScore = this.scoreDestinationMatch(itinerary, extractedData.destination);
    score += destScore * 0.4;
    details.destination = { score: destScore, weight: 40 };

    // 2. Duration match (20 points)
    if (extractedData.dates?.startDate && extractedData.dates?.endDate) {
      const durationScore = this.scoreDurationMatch(itinerary, extractedData.dates);
      score += durationScore * 0.2;
      details.duration = { score: durationScore, weight: 20 };
    }

    // 3. Budget match (25 points)
    if (extractedData.budget?.amount) {
      const budgetScore = this.scoreBudgetMatch(itinerary, extractedData.budget);
      score += budgetScore * 0.25;
      details.budget = { score: budgetScore, weight: 25 };
      
      if (budgetScore < 70) {
        gaps.push({
          category: 'budget',
          message: `Itinerary cost may be ${itinerary.estimatedCost?.totalCost > extractedData.budget.amount ? 'higher' : 'lower'} than requested budget`
        });
      }
    }

    // 4. Traveler capacity match (10 points)
    if (extractedData.travelers?.adults) {
      const capacityScore = 100; // Most itineraries are flexible
      score += capacityScore * 0.1;
      details.capacity = { score: capacityScore, weight: 10 };
    }

    // 5. Activities/preferences match (5 points)
    if (extractedData.activities && extractedData.activities.length > 0) {
      const activityScore = this.scoreActivityMatch(itinerary, extractedData.activities);
      score += activityScore * 0.05;
      details.activities = { score: activityScore, weight: 5 };
    }

    return {
      total: Math.round(score),
      details,
      gaps
    };
  }

  /**
   * Score destination match
   */
  scoreDestinationMatch(itinerary, requestedDestination) {
    if (!requestedDestination) return 0;

    const destLower = requestedDestination.toLowerCase();
    
    // Check primary destination
    const primaryMatch = 
      itinerary.destination?.country?.toLowerCase().includes(destLower) ||
      itinerary.destination?.city?.toLowerCase().includes(destLower) ||
      destLower.includes(itinerary.destination?.country?.toLowerCase()) ||
      destLower.includes(itinerary.destination?.city?.toLowerCase());

    if (primaryMatch) return 100;

    // Check multi-destinations
    if (itinerary.destinations && itinerary.destinations.length > 0) {
      const multiMatch = itinerary.destinations.some(dest =>
        dest.country?.toLowerCase().includes(destLower) ||
        dest.city?.toLowerCase().includes(destLower)
      );
      if (multiMatch) return 90;
    }

    return 0;
  }

  /**
   * Score duration match
   */
  scoreDurationMatch(itinerary, requestedDates) {
    const requestedDuration = Math.ceil(
      (new Date(requestedDates.endDate) - new Date(requestedDates.startDate)) / (1000 * 60 * 60 * 24)
    );
    
    const itineraryDuration = itinerary.duration?.days || itinerary.duration?.nights || 0;
    const difference = Math.abs(requestedDuration - itineraryDuration);

    if (difference === 0) return 100;
    if (difference === 1) return 90;
    if (difference === 2) return 75;
    if (difference === 3) return 60;
    if (difference <= 5) return 40;
    return 20;
  }

  /**
   * Score budget match
   */
  scoreBudgetMatch(itinerary, requestedBudget) {
    const itineraryCost = itinerary.estimatedCost?.totalCost || itinerary.estimatedCost?.baseCost || 0;
    
    if (itineraryCost === 0) return 50; // Unknown cost, neutral score

    const budgetAmount = requestedBudget.amount;
    const difference = Math.abs(itineraryCost - budgetAmount);
    const percentDifference = (difference / budgetAmount) * 100;

    if (percentDifference <= 10) return 100; // Within 10%
    if (percentDifference <= 20) return 85;  // Within 20%
    if (percentDifference <= 30) return 70;  // Within 30%
    if (percentDifference <= 50) return 50;  // Within 50%
    return 30;
  }

  /**
   * Score activity match
   */
  scoreActivityMatch(itinerary, requestedActivities) {
    if (!itinerary.highlights || itinerary.highlights.length === 0) return 50;

    const matchCount = requestedActivities.filter(activity => {
      const activityLower = activity.toLowerCase();
      return itinerary.highlights.some(highlight =>
        highlight.toLowerCase().includes(activityLower) ||
        activityLower.includes(highlight.toLowerCase())
      );
    }).length;

    return Math.min(100, (matchCount / requestedActivities.length) * 100);
  }

  /**
   * Determine workflow action based on validation and matching results
   * @param {Object} validation - Field validation result
   * @param {Array} matches - Matching itineraries
   * @returns {Object} Workflow decision
   */
  determineWorkflowAction(validation, matches) {
    // If missing critical required fields, ask customer
    if (!validation.isValid) {
      return {
        action: 'ASK_CUSTOMER',
        reason: 'missing_required_fields',
        missingFields: validation.missingFields,
        priority: 'high'
      };
    }

    // If good matches found, send to customer
    if (matches.length > 0 && matches[0].score >= 70) {
      return {
        action: 'SEND_ITINERARIES',
        reason: 'good_matches_found',
        matches: matches.slice(0, 3), // Top 3 matches
        bestMatchScore: matches[0].score
      };
    }

    // If moderate matches found, send with note
    if (matches.length > 0 && matches[0].score >= 50) {
      return {
        action: 'SEND_ITINERARIES_WITH_NOTE',
        reason: 'moderate_matches_found',
        matches: matches.slice(0, 3),
        bestMatchScore: matches[0].score,
        note: 'We found some options that partially match your requirements. We can customize them to better fit your needs.'
      };
    }

    // No good matches, forward to supplier/agent
    return {
      action: 'FORWARD_TO_SUPPLIER',
      reason: 'no_matching_itineraries',
      optionalFields: validation.optionalFields,
      note: 'We will create a custom itinerary for your requirements.'
    };
  }

  /**
   * Main workflow method - orchestrates the entire matching process
   * @param {Object} extractedData - Extracted customer inquiry data
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Complete workflow result
   */
  async processItineraryMatching(extractedData, tenantId) {
    try {
      // Step 1: Validate required fields
      const validation = this.validateRequiredFields(extractedData);

      console.log(`Itinerary Matching: Validation completeness ${Math.round(validation.completeness * 100)}%`);

      // Step 2: Search for matching itineraries (only if validation passed)
      let matches = [];
      if (validation.isValid) {
        matches = await this.searchItineraries(extractedData, tenantId);
        console.log(`Itinerary Matching: Found ${matches.length} matching itineraries`);
      }

      // Step 3: Determine workflow action
      const workflow = this.determineWorkflowAction(validation, matches);

      console.log(`Itinerary Matching: Action determined - ${workflow.action}`);

      return {
        success: true,
        validation,
        matches,
        workflow,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Itinerary matching error:', error);
      return {
        success: false,
        error: error.message,
        workflow: {
          action: 'FORWARD_TO_AGENT',
          reason: 'processing_error',
          note: 'Unable to automatically process this request. An agent will review it manually.'
        }
      };
    }
  }
}

module.exports = new ItineraryMatchingService();
