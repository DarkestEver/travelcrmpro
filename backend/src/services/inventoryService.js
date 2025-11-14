const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');

class InventoryService {
  
  /**
   * Create new inventory item
   */
  async createInventory(data, supplierId) {
    // Verify supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    const inventory = await Inventory.create({
      ...data,
      supplier: supplierId,
      tenant: supplier.tenantId
    });
    
    return inventory;
  }
  
  /**
   * Get inventory items for a supplier
   */
  async getSupplierInventory(supplierId, filters = {}) {
    const query = { supplier: supplierId };
    
    if (filters.status) query.status = filters.status;
    if (filters.serviceType) query.serviceType = filters.serviceType;
    if (filters.search) {
      query.$or = [
        { serviceName: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') }
      ];
    }
    
    const inventory = await Inventory.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
    
    return inventory;
  }
  
  /**
   * Get single inventory item
   */
  async getInventoryById(inventoryId, supplierId = null) {
    const query = { _id: inventoryId };
    if (supplierId) query.supplier = supplierId;
    
    const inventory = await Inventory.findOne(query);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    
    return inventory;
  }
  
  /**
   * Update inventory item
   */
  async updateInventory(inventoryId, supplierId, updates) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        inventory[key] = updates[key];
      }
    });
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Delete inventory item
   */
  async deleteInventory(inventoryId, supplierId) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    await inventory.remove();
    return inventory;
  }
  
  /**
   * Check availability for date range
   */
  async checkAvailability(inventoryId, startDate, endDate) {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    // Check each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const isAvailable = inventory.isAvailableOnDate(date);
      const price = inventory.getPriceForDate(date);
      
      days.push({
        date: new Date(date),
        available: isAvailable,
        price,
        capacity: {
          total: inventory.capacity.total,
          available: inventory.capacity.available
        }
      });
    }
    
    return {
      inventory: {
        id: inventory._id,
        name: inventory.serviceName,
        type: inventory.serviceType
      },
      period: {
        startDate: start,
        endDate: end,
        totalDays: days.length
      },
      availability: days,
      summary: {
        allAvailable: days.every(d => d.available),
        availableDays: days.filter(d => d.available).length,
        totalPrice: days.reduce((sum, d) => sum + (d.available ? d.price : 0), 0)
      }
    };
  }
  
  /**
   * Add blackout dates
   */
  async addBlackoutDates(inventoryId, supplierId, dates) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    const blackouts = dates.map(d => ({
      date: new Date(d.date),
      reason: d.reason || 'Unavailable'
    }));
    
    inventory.availability.blackoutDates = [
      ...(inventory.availability.blackoutDates || []),
      ...blackouts
    ];
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Remove blackout dates
   */
  async removeBlackoutDates(inventoryId, supplierId, dates) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    const datesToRemove = dates.map(d => new Date(d).getTime());
    
    inventory.availability.blackoutDates = inventory.availability.blackoutDates.filter(
      blackout => !datesToRemove.includes(new Date(blackout.date).getTime())
    );
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Update capacity
   */
  async updateCapacity(inventoryId, supplierId, total, available) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    if (total !== undefined) {
      inventory.capacity.total = total;
    }
    
    if (available !== undefined) {
      inventory.capacity.available = Math.min(available, inventory.capacity.total);
    }
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Add seasonal pricing
   */
  async addSeasonalPricing(inventoryId, supplierId, seasonData) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    const season = {
      name: seasonData.name,
      startDate: new Date(seasonData.startDate),
      endDate: new Date(seasonData.endDate),
      price: seasonData.price,
      active: seasonData.active !== false
    };
    
    inventory.pricing.seasonalPricing = [
      ...(inventory.pricing.seasonalPricing || []),
      season
    ];
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Update seasonal pricing
   */
  async updateSeasonalPricing(inventoryId, supplierId, seasonIndex, updates) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    if (!inventory.pricing.seasonalPricing[seasonIndex]) {
      throw new Error('Season not found');
    }
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        inventory.pricing.seasonalPricing[seasonIndex][key] = updates[key];
      }
    });
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Remove seasonal pricing
   */
  async removeSeasonalPricing(inventoryId, supplierId, seasonIndex) {
    const inventory = await this.getInventoryById(inventoryId, supplierId);
    
    inventory.pricing.seasonalPricing.splice(seasonIndex, 1);
    
    await inventory.save();
    return inventory;
  }
  
  /**
   * Get inventory statistics for supplier
   */
  async getSupplierStats(supplierId) {
    const inventory = await Inventory.find({ supplier: supplierId });
    
    const stats = {
      totalItems: inventory.length,
      activeItems: inventory.filter(i => i.status === 'active').length,
      inactiveItems: inventory.filter(i => i.status === 'inactive').length,
      soldOutItems: inventory.filter(i => i.status === 'sold-out').length,
      byServiceType: {},
      totalCapacity: 0,
      availableCapacity: 0,
      totalRevenue: 0,
      totalBookings: 0,
      averageRating: 0
    };
    
    // Calculate by service type
    inventory.forEach(item => {
      if (!stats.byServiceType[item.serviceType]) {
        stats.byServiceType[item.serviceType] = 0;
      }
      stats.byServiceType[item.serviceType]++;
      
      stats.totalCapacity += item.capacity.total;
      stats.availableCapacity += item.capacity.available;
      stats.totalRevenue += item.statistics.totalRevenue || 0;
      stats.totalBookings += item.statistics.totalBookings || 0;
    });
    
    // Calculate average rating
    const itemsWithRating = inventory.filter(i => i.statistics.reviewCount > 0);
    if (itemsWithRating.length > 0) {
      stats.averageRating = itemsWithRating.reduce((sum, i) => 
        sum + i.statistics.averageRating, 0) / itemsWithRating.length;
    }
    
    stats.occupancyRate = stats.totalCapacity > 0 
      ? ((stats.totalCapacity - stats.availableCapacity) / stats.totalCapacity) * 100 
      : 0;
    
    return stats;
  }
  
  /**
   * Search inventory (public)
   */
  async searchInventory(filters) {
    return await Inventory.search(filters);
  }
  
  /**
   * Bulk update availability
   */
  async bulkUpdateAvailability(supplierId, inventoryIds, updates) {
    const result = await Inventory.updateMany(
      {
        _id: { $in: inventoryIds },
        supplier: supplierId
      },
      {
        $set: updates
      }
    );
    
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount
    };
  }
}

module.exports = new InventoryService();
