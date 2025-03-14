import { describe, it, expect, beforeEach } from "vitest"

// Mock contract state
const mockContractState = {
  sustainabilityGoals: new Map(),
  zoneSustainabilityMetrics: new Map(),
  impactReports: new Map(),
  carbonEmissionFactors: new Map(),
  admins: new Map(),
  analysts: new Map(),
  reportGenerators: new Map(),
  contractOwner: "deployer"
}

// Mock contract functions
const mockContract = {
  reset() {
    mockContractState.sustainabilityGoals.clear()
    mockContractState.zoneSustainabilityMetrics.clear()
    mockContractState.impactReports.clear()
    mockContractState.carbonEmissionFactors.clear()
    mockContractState.admins.clear()
    mockContractState.analysts.clear()
    mockContractState.reportGenerators.clear()
    mockContractState.contractOwner = "deployer"
  },
  
  isAdmin(caller) {
    return caller === mockContractState.contractOwner || mockContractState.admins.get(caller) === true
  },
  
  isAnalyst(caller) {
    return this.isAdmin(caller) || mockContractState.analysts.get(caller) === true
  },
  
  isReportGenerator(caller) {
    return this.isAdmin(caller) || mockContractState.reportGenerators.get(caller) === true
  },
  
  addAdmin(caller, newAdmin) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.admins.set(newAdmin, true)
    return { success: true }
  },
  
  removeAdmin(caller, admin) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.admins.delete(admin)
    return { success: true }
  },
  
  addAnalyst(caller, analyst) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.analysts.set(analyst, true)
    return { success: true }
  },
  
  removeAnalyst(caller, analyst) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.analysts.delete(analyst)
    return { success: true }
  },
  
  addReportGenerator(caller, generator) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.reportGenerators.set(generator, true)
    return { success: true }
  },
  
  removeReportGenerator(caller, generator) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.reportGenerators.delete(generator)
    return { success: true }
  },
  
  createSustainabilityGoal(caller, goalId, name, description, targetType, targetValue, targetUnit, startDate, endDate) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    if (mockContractState.sustainabilityGoals.has(goalId)) {
      return { success: false, error: "ERR-GOAL-EXISTS" }
    }
    
    if (startDate >= endDate) {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    mockContractState.sustainabilityGoals.set(goalId, {
      name: name,
      description: description,
      targetType: targetType,
      targetValue: targetValue,
      targetUnit: targetUnit,
      startDate: startDate,
      endDate: endDate,
      createdBy: caller,
      creationDate: Date.now(),
      status: "active"
    })
    
    return { success: true }
  },
  
  updateGoalStatus(caller, goalId, status) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    const goal = mockContractState.sustainabilityGoals.get(goalId)
    if (!goal) {
      return { success: false, error: "ERR-GOAL-NOT-FOUND" }
    }
    
    mockContractState.sustainabilityGoals.set(goalId, {
      ...goal,
      status: status
    })
    
    return { success: true }
  },
  
  recordZoneMetrics(caller, zoneId, period, totalWasteCollectedKg, totalWasteRecycledKg, totalWasteCompostedKg, totalWasteLandfilledKg) {
    if (!this.isAnalyst(caller)) {
      return { success: false, error: "ERR-NOT-ANALYST" }
    }
    
    // Calculate percentages
    const recyclingRate = totalWasteCollectedKg > 0
        ? (totalWasteRecycledKg * 100) / totalWasteCollectedKg
        : 0
    
    const compostingRate = totalWasteCollectedKg > 0
        ? (totalWasteCompostedKg * 100) / totalWasteCollectedKg
        : 0
    
    const landfillDiversionRate = totalWasteCollectedKg > 0
        ? ((totalWasteCollectedKg - totalWasteLandfilledKg) * 100) / totalWasteCollectedKg
        : 0
    
    // Simplified carbon savings calculation
    const carbonEmissionsSaved = (totalWasteRecycledKg * 2) + (totalWasteCompostedKg * 1)
    
    mockContractState.zoneSustainabilityMetrics.set(`${zoneId}:${period}`, {
      totalWasteCollectedKg: totalWasteCollectedKg,
      totalWasteRecycledKg: totalWasteRecycledKg,
      totalWasteCompostedKg: totalWasteCompostedKg,
      totalWasteLandfilledKg: totalWasteLandfilledKg,
      recyclingRatePercentage: recyclingRate,
      compostingRatePercentage: compostingRate,
      landfillDiversionRatePercentage: landfillDiversionRate,
      carbonEmissionsSavedKg: carbonEmissionsSaved,
      lastUpdated: Date.now()
    })
    
    return { success: true }
  },
  
  generateImpactReport(caller, reportId, zoneId, reportType, periodStart, periodEnd, totalWasteReductionKg, carbonFootprintReductionKg, resourceSavings, keyAchievements, challenges, recommendations) {
    if (!this.isReportGenerator(caller)) {
      return { success: false, error: "ERR-NOT-REPORT-GENERATOR" }
    }
    
    if (mockContractState.impactReports.has(reportId)) {
      return { success: false, error: "ERR-REPORT-EXISTS" }
    }
    
    if (periodStart >= periodEnd) {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    mockContractState.impactReports.set(reportId, {
      zoneId: zoneId,
      reportType: reportType,
      periodStart: periodStart,
      periodEnd: periodEnd,
      totalWasteReductionKg: totalWasteReductionKg,
      carbonFootprintReductionKg: carbonFootprintReductionKg,
      resourceSavings: resourceSavings,
      keyAchievements: keyAchievements,
      challenges: challenges,
      recommendations: recommendations,
      generatedBy: caller,
      generationDate: Date.now(),
      status: "draft"
    })
    
    return { success: true }
  },
  
  updateReportStatus(caller, reportId, status) {
    const report = mockContractState.impactReports.get(reportId)
    if (!report) {
      return { success: false, error: "ERR-REPORT-NOT-FOUND" }
    }
    
    if (!this.isAdmin(caller) && report.generatedBy !== caller) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.impactReports.set(reportId, {
      ...report,
      status: status
    })
    
    return { success: true }
  },
  
  setCarbonEmissionFactors(caller, wasteType, landfillFactor, recyclingFactor, compostingFactor, incinerationFactor) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.carbonEmissionFactors.set(wasteType, {
      landfillFactorKgCo2PerKg: landfillFactor,
      recyclingFactorKgCo2PerKg: recyclingFactor,
      compostingFactorKgCo2PerKg: compostingFactor,
      incinerationFactorKgCo2PerKg: incinerationFactor,
      lastUpdated: Date.now()
    })
    
    return { success: true }
  },
  
  getSustainabilityGoal(goalId) {
    return mockContractState.sustainabilityGoals.get(goalId)
  },
  
  getZoneMetrics(zoneId, period) {
    return mockContractState.zoneSustainabilityMetrics.get(`${zoneId}:${period}`)
  },
  
  getImpactReport(reportId) {
    return mockContractState.impactReports.get(reportId)
  },
  
  getCarbonEmissionFactors(wasteType) {
    return mockContractState.carbonEmissionFactors.get(wasteType)
  },
  
  isGoalAchieved(goalId) {
    const goal = mockContractState.sustainabilityGoals.get(goalId)
    return goal ? goal.status === "achieved" : false
  }
}

describe("Environmental Impact Contract", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContract.reset()
  })
  
  it("should allow admin to create a sustainability goal", () => {
    // Arrange
    const deployer = "deployer"
    const goalId = "goal-123"
    const name = "Reduce Landfill Waste"
    const description = "Reduce total waste sent to landfill by 30%"
    const targetType = "reduction"
    const targetValue = 30
    const targetUnit = "percentage"
    const startDate = Date.now()
    const endDate = startDate + (365 * 24 * 60 * 60 * 1000) // 1 year later
    
    // Act
    const result = mockContract.createSustainabilityGoal(
        deployer,
        goalId,
        name,
        description,
        targetType,
        targetValue,
        targetUnit,
        startDate,
        endDate
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify goal was created
    const goal = mockContract.getSustainabilityGoal(goalId)
    expect(goal).toBeDefined()
    expect(goal.name).toBe(name)
    expect(goal.targetType).toBe(targetType)
    expect(goal.targetValue).toBe(targetValue)
    expect(goal.status).toBe("active")
  })
  
  it("should not allow creating a goal with invalid dates", () => {
    // Arrange
    const deployer = "deployer"
    const goalId = "goal-123"
    const name = "Reduce Landfill Waste"
    const description = "Reduce total waste sent to landfill by 30%"
    const targetType = "reduction"
    const targetValue = 30
    const targetUnit = "percentage"
    const startDate = Date.now()
    const endDate = startDate - 1000 // End date before start date
    
    // Act
    const result = mockContract.createSustainabilityGoal(
        deployer,
        goalId,
        name,
        description,
        targetType,
        targetValue,
        targetUnit,
        startDate,
        endDate
    )
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR-INVALID-PARAMETERS")
  })
  
  it("should allow admin to update goal status", () => {
    // Arrange
    const deployer = "deployer"
    const goalId = "goal-123"
    const name = "Reduce Landfill Waste"
    const description = "Reduce total waste sent to landfill by 30%"
    const targetType = "reduction"
    const targetValue = 30
    const targetUnit = "percentage"
    const startDate = Date.now()
    const endDate = startDate + (365 * 24 * 60 * 60 * 1000)
    const newStatus = "achieved"
    
    // Create goal first
    mockContract.createSustainabilityGoal(
        deployer,
        goalId,
        name,
        description,
        targetType,
        targetValue,
        targetUnit,
        startDate,
        endDate
    )
    
    // Act
    const result = mockContract.updateGoalStatus(deployer, goalId, newStatus)
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify status was updated
    const goal = mockContract.getSustainabilityGoal(goalId)
    expect(goal.status).toBe(newStatus)
    
    // Check if goal is achieved
    const isAchieved = mockContract.isGoalAchieved(goalId)
    expect(isAchieved).toBe(true)
  })
  
  it("should allow analyst to record zone metrics", () => {
    // Arrange
    const deployer = "deployer"
    const analyst = "analyst-1"
    const zoneId = "zone-123"
    const period = "2023-01"
    const totalWasteCollectedKg = 10000
    const totalWasteRecycledKg = 4000
    const totalWasteCompostedKg = 2000
    const totalWasteLandfilledKg = 4000
    
    // Add analyst
    mockContract.addAnalyst(deployer, analyst)
    
    // Act
    const result = mockContract.recordZoneMetrics(
        analyst,
        zoneId,
        period,
        totalWasteCollectedKg,
        totalWasteRecycledKg,
        totalWasteCompostedKg,
        totalWasteLandfilledKg
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify metrics were recorded
    const metrics = mockContract.getZoneMetrics(zoneId, period)
    expect(metrics).toBeDefined()
    expect(metrics.totalWasteCollectedKg).toBe(totalWasteCollectedKg)
    expect(metrics.totalWasteRecycledKg).toBe(totalWasteRecycledKg)
    expect(metrics.recyclingRatePercentage).toBe(40) // 4000/10000 * 100
    expect(metrics.landfillDiversionRatePercentage).toBe(60) // (10000-4000)/10000 * 100
    expect(metrics.carbonEmissionsSavedKg).toBe(10000) // (4000*2) + (2000*1)
  })
  
  it("should allow report generator to create impact report", () => {
    // Arrange
    const deployer = "deployer"
    const generator = "generator-1"
    const reportId = "report-123"
    const zoneId = "zone-123"
    const reportType = "quarterly"
    const periodStart = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90 days ago
    const periodEnd = Date.now()
    const totalWasteReductionKg = 5000
    const carbonFootprintReductionKg = 10000
    const resourceSavings = "Saved 2000 gallons of water and 500 kWh of electricity"
    const keyAchievements = "Increased recycling rate by 15%, implemented new composting program"
    const challenges = "Limited participation in commercial sector, contamination in recycling stream"
    const recommendations = "Expand education program, introduce incentives for businesses"
    
    // Add report generator
    mockContract.addReportGenerator(deployer, generator)
    
    // Act
    const result = mockContract.generateImpactReport(
        generator,
        reportId,
        zoneId,
        reportType,
        periodStart,
        periodEnd,
        totalWasteReductionKg,
        carbonFootprintReductionKg,
        resourceSavings,
        keyAchievements,
        challenges,
        recommendations
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify report was created
    const report = mockContract.getImpactReport(reportId)
    expect(report).toBeDefined()
    expect(report.zoneId).toBe(zoneId)
    expect(report.reportType).toBe(reportType)
    expect(report.totalWasteReductionKg).toBe(totalWasteReductionKg)
    expect(report.carbonFootprintReductionKg).toBe(carbonFootprintReductionKg)
    expect(report.status).toBe("draft")
  })
  
  it("should allow report creator to update report status", () => {
    // Arrange
    const deployer = "deployer"
    const generator = "generator-1"
    const reportId = "report-123"
    const zoneId = "zone-123"
    const reportType = "quarterly"
    const periodStart = Date.now() - (90 * 24 * 60 * 60 * 1000)
    const periodEnd = Date.now()
    const newStatus = "published"
    
    // Add report generator and create report
    mockContract.addReportGenerator(deployer, generator)
    mockContract.generateImpactReport(
        generator,
        reportId,
        zoneId,
        reportType,
        periodStart,
        periodEnd,
        5000,
        10000,
        "Resource savings",
        "Key achievements",
        "Challenges",
        "Recommendations"
    )
    
    // Act
    const result = mockContract.updateReportStatus(generator, reportId, newStatus)
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify status was updated
    const report = mockContract.getImpactReport(reportId)
    expect(report.status).toBe(newStatus)
  })
  
  it("should allow admin to set carbon emission factors", () => {
    // Arrange
    const deployer = "deployer"
    const wasteType = "general"
    const landfillFactor = 2000 // 2 kg CO2 per kg waste
    const recyclingFactor = 500 // 0.5 kg CO2 per kg waste
    const compostingFactor = 300 // 0.3 kg CO2 per kg waste
    const incinerationFactor = 1500 // 1.5 kg CO2 per kg waste
    
    // Act
    const result = mockContract.setCarbonEmissionFactors(
        deployer,
        wasteType,
        landfillFactor,
        recyclingFactor,
        compostingFactor,
        incinerationFactor
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify factors were set
    const factors = mockContract.getCarbonEmissionFactors(wasteType)
    expect(factors).toBeDefined()
    expect(factors.landfillFactorKgCo2PerKg).toBe(landfillFactor)
    expect(factors.recyclingFactorKgCo2PerKg).toBe(recyclingFactor)
    expect(factors.compostingFactorKgCo2PerKg).toBe(compostingFactor)
    expect(factors.incinerationFactorKgCo2PerKg).toBe(incinerationFactor)
  })
})
