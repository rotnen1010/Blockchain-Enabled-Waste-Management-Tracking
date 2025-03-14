import { describe, it, expect, beforeEach } from "vitest"

// Mock contract state
const mockContractState = {
  incentivePrograms: new Map(),
  rewardCriteria: new Map(),
  communityRewards: new Map(),
  zoneRewardTotals: new Map(),
  admins: new Map(),
  rewardManagers: new Map(),
  rewardApprovers: new Map(),
  contractOwner: "deployer",
}

// Mock contract functions
const mockContract = {
  reset() {
    mockContractState.incentivePrograms.clear()
    mockContractState.rewardCriteria.clear()
    mockContractState.communityRewards.clear()
    mockContractState.zoneRewardTotals.clear()
    mockContractState.admins.clear()
    mockContractState.rewardManagers.clear()
    mockContractState.rewardApprovers.clear()
    mockContractState.contractOwner = "deployer"
  },
  
  isAdmin(caller) {
    return caller === mockContractState.contractOwner || mockContractState.admins.get(caller) === true
  },
  
  isRewardManager(caller) {
    return this.isAdmin(caller) || mockContractState.rewardManagers.get(caller) === true
  },
  
  isRewardApprover(caller) {
    return this.isAdmin(caller) || mockContractState.rewardApprovers.get(caller) === true
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
  
  addRewardManager(caller, manager) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.rewardManagers.set(manager, true)
    return { success: true }
  },
  
  removeRewardManager(caller, manager) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.rewardManagers.delete(manager)
    return { success: true }
  },
  
  addRewardApprover(caller, approver) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.rewardApprovers.set(approver, true)
    return { success: true }
  },
  
  removeRewardApprover(caller, approver) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    mockContractState.rewardApprovers.delete(approver)
    return { success: true }
  },
  
  createIncentiveProgram(caller, programId, name, description, rewardType, budgetAmount, startDate, endDate) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    if (mockContractState.incentivePrograms.has(programId)) {
      return { success: false, error: "ERR-PROGRAM-EXISTS" }
    }
    
    if (startDate >= endDate) {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    mockContractState.incentivePrograms.set(programId, {
      name: name,
      description: description,
      rewardType: rewardType,
      budgetAmount: budgetAmount,
      remainingBudget: budgetAmount,
      startDate: startDate,
      endDate: endDate,
      createdBy: caller,
      creationDate: Date.now(),
      status: "active",
    })
    
    return { success: true }
  },
  
  updateProgramStatus(caller, programId, status) {
    if (!this.isAdmin(caller)) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" }
    }
    
    const program = mockContractState.incentivePrograms.get(programId)
    if (!program) {
      return { success: false, error: "ERR-PROGRAM-NOT-FOUND" }
    }
    
    mockContractState.incentivePrograms.set(programId, {
      ...program,
      status: status,
    })
    
    return { success: true }
  },
  
  addRewardCriteria(
      caller,
      programId,
      criteriaId,
      name,
      metricType,
      thresholdValue,
      thresholdUnit,
      rewardAmount,
      rewardUnit,
  ) {
    if (!this.isRewardManager(caller)) {
      return { success: false, error: "ERR-NOT-MANAGER" }
    }
    
    if (!mockContractState.incentivePrograms.has(programId)) {
      return { success: false, error: "ERR-PROGRAM-NOT-FOUND" }
    }
    
    const key = `${programId}:${criteriaId}`
    if (mockContractState.rewardCriteria.has(key)) {
      return { success: false, error: "ERR-CRITERIA-EXISTS" }
    }
    
    mockContractState.rewardCriteria.set(key, {
      name: name,
      metricType: metricType,
      thresholdValue: thresholdValue,
      thresholdUnit: thresholdUnit,
      rewardAmount: rewardAmount,
      rewardUnit: rewardUnit,
      createdDate: Date.now(),
      active: true,
    })
    
    return { success: true }
  },
  
  applyForReward(caller, rewardId, programId, zoneId, period, criteriaId, achievementValue) {
    if (!this.isRewardManager(caller)) {
      return { success: false, error: "ERR-NOT-MANAGER" }
    }
    
    if (mockContractState.communityRewards.has(rewardId)) {
      return { success: false, error: "ERR-REWARD-EXISTS" }
    }
    
    const program = mockContractState.incentivePrograms.get(programId)
    if (!program) {
      return { success: false, error: "ERR-PROGRAM-NOT-FOUND" }
    }
    
    const key = `${programId}:${criteriaId}`
    const criteria = mockContractState.rewardCriteria.get(key)
    if (!criteria) {
      return { success: false, error: "ERR-CRITERIA-NOT-FOUND" }
    }
    
    // Check if program is active
    if (program.status !== "active") {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    // Check if criteria is active
    if (!criteria.active) {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    // Check if achievement meets threshold
    if (achievementValue < criteria.thresholdValue) {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    mockContractState.communityRewards.set(rewardId, {
      programId: programId,
      zoneId: zoneId,
      period: period,
      criteriaId: criteriaId,
      achievementValue: achievementValue,
      rewardAmount: criteria.rewardAmount,
      status: "pending",
      applicationDate: Date.now(),
      approvalDate: null,
      approvedBy: null,
      paymentDate: null,
      paymentTxId: null,
    })
    
    return { success: true }
  },
  
  approveReward(caller, rewardId) {
    if (!this.isRewardApprover(caller)) {
      return { success: false, error: "ERR-NOT-APPROVER" }
    }
    
    const reward = mockContractState.communityRewards.get(rewardId)
    if (!reward) {
      return { success: false, error: "ERR-REWARD-NOT-FOUND" }
    }
    
    if (reward.status !== "pending") {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    const program = mockContractState.incentivePrograms.get(reward.programId)
    if (!program) {
      return { success: false, error: "ERR-PROGRAM-NOT-FOUND" }
    }
    
    // Check if program has sufficient budget
    if (program.remainingBudget < reward.rewardAmount) {
      return { success: false, error: "ERR-INSUFFICIENT-BUDGET" }
    }
    
    // Update program remaining budget
    mockContractState.incentivePrograms.set(reward.programId, {
      ...program,
      remainingBudget: program.remainingBudget - reward.rewardAmount,
    })
    
    // Update reward status
    mockContractState.communityRewards.set(rewardId, {
      ...reward,
      status: "approved",
      approvalDate: Date.now(),
      approvedBy: caller,
    })
    
    return { success: true }
  },
  
  rejectReward(caller, rewardId) {
    if (!this.isRewardApprover(caller)) {
      return { success: false, error: "ERR-NOT-APPROVER" }
    }
    
    const reward = mockContractState.communityRewards.get(rewardId)
    if (!reward) {
      return { success: false, error: "ERR-REWARD-NOT-FOUND" }
    }
    
    if (reward.status !== "pending") {
      return { success: false, error: "ERR-INVALID-PARAMETERS" }
    }
    
    // Update reward status
    mockContractState.communityRewards.set(rewardId, {
      ...reward,
      status: "rejected",
      approvalDate: Date.now(),
      approvedBy: caller,
    })
    
    return { success: true }
  },
  
  processRewardPayment(caller, rewardId, paymentTxId) {
    if (!this.isRewardManager(caller)) {
      return { success: false, error: "ERR-NOT-MANAGER" }
    }
    
    const reward = mockContractState.communityRewards.get(rewardId)
    if (!reward) {
      return { success: false, error: "ERR-REWARD-NOT-FOUND" }
    }
    
    if (reward.status !== "approved") {
      return { success: false, error: "ERR-REWARD-NOT-APPROVED" }
    }
    
    // Get year from period (simplified)
    const year = "2023"
    
    // Update zone reward totals
    const key = `${reward.zoneId}:${year}`
    const zoneTotals = mockContractState.zoneRewardTotals.get(key) || {
      totalRewardsEarned: 0,
      totalRewardsPaid: 0,
      rewardCount: 0,
      lastUpdated: 0,
    }
    
    mockContractState.zoneRewardTotals.set(key, {
      totalRewardsEarned: zoneTotals.totalRewardsEarned + reward.rewardAmount,
      totalRewardsPaid: zoneTotals.totalRewardsPaid + reward.rewardAmount,
      rewardCount: zoneTotals.rewardCount + 1,
      lastUpdated: Date.now(),
    })
    
    // Update reward status
    mockContractState.communityRewards.set(rewardId, {
      ...reward,
      status: "paid",
      paymentDate: Date.now(),
      paymentTxId: paymentTxId,
    })
    
    return { success: true }
  },
  
  getIncentiveProgram(programId) {
    return mockContractState.incentivePrograms.get(programId)
  },
  
  getRewardCriteria(programId, criteriaId) {
    const key = `${programId}:${criteriaId}`
    return mockContractState.rewardCriteria.get(key)
  },
  
  getCommunityReward(rewardId) {
    return mockContractState.communityRewards.get(rewardId)
  },
  
  getZoneRewardTotals(zoneId, year) {
    const key = `${zoneId}:${year}`
    return (
        mockContractState.zoneRewardTotals.get(key) || {
          totalRewardsEarned: 0,
          totalRewardsPaid: 0,
          rewardCount: 0,
          lastUpdated: 0,
        }
    )
  },
  
  isRewardApproved(rewardId) {
    const reward = mockContractState.communityRewards.get(rewardId)
    return reward ? reward.status === "approved" : false
  },
}

describe("Incentive Distribution Contract", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContract.reset()
  })
  
  it("should allow admin to create an incentive program", () => {
    // Arrange
    const deployer = "deployer"
    const programId = "program-123"
    const name = "Recycling Champions"
    const description = "Rewards communities for increasing recycling rates"
    const rewardType = "token"
    const budgetAmount = 100000
    const startDate = Date.now()
    const endDate = startDate + 365 * 24 * 60 * 60 * 1000 // 1 year later
    
    // Act
    const result = mockContract.createIncentiveProgram(
        deployer,
        programId,
        name,
        description,
        rewardType,
        budgetAmount,
        startDate,
        endDate,
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify program was created
    const program = mockContract.getIncentiveProgram(programId)
    expect(program).toBeDefined()
    expect(program.name).toBe(name)
    expect(program.rewardType).toBe(rewardType)
    expect(program.budgetAmount).toBe(budgetAmount)
    expect(program.remainingBudget).toBe(budgetAmount)
    expect(program.status).toBe("active")
  })
  
  it("should allow reward manager to add reward criteria", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const name = "High Recycling Rate"
    const metricType = "recycling-rate"
    const thresholdValue = 50 // 50%
    const thresholdUnit = "percentage"
    const rewardAmount = 5000
    const rewardUnit = "tokens"
    
    // Create program and add manager
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    
    // Act
    const result = mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        name,
        metricType,
        thresholdValue,
        thresholdUnit,
        rewardAmount,
        rewardUnit,
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify criteria was added
    const criteria = mockContract.getRewardCriteria(programId, criteriaId)
    expect(criteria).toBeDefined()
    expect(criteria.name).toBe(name)
    expect(criteria.metricType).toBe(metricType)
    expect(criteria.thresholdValue).toBe(thresholdValue)
    expect(criteria.rewardAmount).toBe(rewardAmount)
    expect(criteria.active).toBe(true)
  })
  
  it("should allow reward manager to apply for a reward", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const rewardId = "reward-123"
    const zoneId = "zone-123"
    const period = "2023-01"
    const achievementValue = 60 // 60% (above threshold)
    
    // Setup program and criteria
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        "High Recycling Rate",
        "recycling-rate",
        50, // 50% threshold
        "percentage",
        5000,
        "tokens",
    )
    
    // Act
    const result = mockContract.applyForReward(
        manager,
        rewardId,
        programId,
        zoneId,
        period,
        criteriaId,
        achievementValue,
    )
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify reward application was created
    const reward = mockContract.getCommunityReward(rewardId)
    expect(reward).toBeDefined()
    expect(reward.programId).toBe(programId)
    expect(reward.zoneId).toBe(zoneId)
    expect(reward.criteriaId).toBe(criteriaId)
    expect(reward.achievementValue).toBe(achievementValue)
    expect(reward.rewardAmount).toBe(5000)
    expect(reward.status).toBe("pending")
  })
  
  it("should not allow applying for reward if achievement below threshold", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const rewardId = "reward-123"
    const zoneId = "zone-123"
    const period = "2023-01"
    const achievementValue = 40 // 40% (below threshold)
    
    // Setup program and criteria
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        "High Recycling Rate",
        "recycling-rate",
        50, // 50% threshold
        "percentage",
        5000,
        "tokens",
    )
    
    // Act
    const result = mockContract.applyForReward(
        manager,
        rewardId,
        programId,
        zoneId,
        period,
        criteriaId,
        achievementValue,
    )
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR-INVALID-PARAMETERS")
  })
  
  it("should allow approver to approve a reward", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const approver = "approver-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const rewardId = "reward-123"
    const zoneId = "zone-123"
    const period = "2023-01"
    
    // Setup program, criteria, and reward application
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    mockContract.addRewardApprover(deployer, approver)
    mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        "High Recycling Rate",
        "recycling-rate",
        50,
        "percentage",
        5000,
        "tokens",
    )
    mockContract.applyForReward(manager, rewardId, programId, zoneId, period, criteriaId, 60)
    
    // Act
    const result = mockContract.approveReward(approver, rewardId)
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify reward was approved
    const reward = mockContract.getCommunityReward(rewardId)
    expect(reward.status).toBe("approved")
    expect(reward.approvedBy).toBe(approver)
    
    // Verify program budget was updated
    const program = mockContract.getIncentiveProgram(programId)
    expect(program.remainingBudget).toBe(95000) // 100000 - 5000
    
    // Check if reward is approved
    const isApproved = mockContract.isRewardApproved(rewardId)
    expect(isApproved).toBe(true)
  })
  
  it("should allow manager to process reward payment", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const approver = "approver-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const rewardId = "reward-123"
    const zoneId = "zone-123"
    const period = "2023-01"
    const paymentTxId = new Uint8Array([1, 2, 3, 4, 5])
    
    // Setup program, criteria, reward application, and approval
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    mockContract.addRewardApprover(deployer, approver)
    mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        "High Recycling Rate",
        "recycling-rate",
        50,
        "percentage",
        5000,
        "tokens",
    )
    mockContract.applyForReward(manager, rewardId, programId, zoneId, period, criteriaId, 60)
    mockContract.approveReward(approver, rewardId)
    
    // Act
    const result = mockContract.processRewardPayment(manager, rewardId, paymentTxId)
    
    // Assert
    expect(result.success).toBe(true)
    
    //  rewardId, paymentTxId)
    
    // Assert
    expect(result.success).toBe(true)
    
    // Verify reward was paid
    const reward = mockContract.getCommunityReward(rewardId)
    expect(reward.status).toBe("paid")
    expect(reward.paymentDate).toBeDefined()
    expect(reward.paymentTxId).toBe(paymentTxId)
    
    // Verify zone totals were updated
    const zoneTotals = mockContract.getZoneRewardTotals(zoneId, "2023")
    expect(zoneTotals.totalRewardsEarned).toBe(5000)
    expect(zoneTotals.totalRewardsPaid).toBe(5000)
    expect(zoneTotals.rewardCount).toBe(1)
  })
  
  it("should not allow processing payment for non-approved reward", () => {
    // Arrange
    const deployer = "deployer"
    const manager = "manager-1"
    const programId = "program-123"
    const criteriaId = "criteria-123"
    const rewardId = "reward-123"
    const zoneId = "zone-123"
    const period = "2023-01"
    const paymentTxId = new Uint8Array([1, 2, 3, 4, 5])
    
    // Setup program, criteria, and reward application (but don't approve it)
    mockContract.createIncentiveProgram(
        deployer,
        programId,
        "Recycling Champions",
        "Rewards communities for increasing recycling rates",
        "token",
        100000,
        Date.now(),
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
    mockContract.addRewardManager(deployer, manager)
    mockContract.addRewardCriteria(
        manager,
        programId,
        criteriaId,
        "High Recycling Rate",
        "recycling-rate",
        50,
        "percentage",
        5000,
        "tokens",
    )
    mockContract.applyForReward(manager, rewardId, programId, zoneId, period, criteriaId, 60)
    
    // Act
    const result = mockContract.processRewardPayment(manager, rewardId, paymentTxId)
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR-REWARD-NOT-APPROVED")
  })
})

