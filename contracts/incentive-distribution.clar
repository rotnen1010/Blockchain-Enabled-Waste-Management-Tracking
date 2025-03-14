;; Incentive Distribution Contract
;; Rewards communities for waste reduction

;; Define data variables
(define-map incentive-programs
  { program-id: (string-ascii 36) }
  {
    name: (string-ascii 100),
    description: (string-ascii 200),
    reward-type: (string-ascii 20),  ;; token, credit, service, etc.
    budget-amount: uint,
    remaining-budget: uint,
    start-date: uint,
    end-date: uint,
    created-by: principal,
    creation-date: uint,
    status: (string-ascii 20)  ;; active, completed, cancelled
  }
)

(define-map reward-criteria
  {
    program-id: (string-ascii 36),
    criteria-id: (string-ascii 36)
  }
  {
    name: (string-ascii 100),
    metric-type: (string-ascii 20),  ;; recycling-rate, waste-reduction, etc.
    threshold-value: uint,
    threshold-unit: (string-ascii 20),  ;; percentage, kg, etc.
    reward-amount: uint,
    reward-unit: (string-ascii 20),  ;; tokens, credits, etc.
    created-date: uint,
    active: bool
  }
)

(define-map community-rewards
  {
    reward-id: (string-ascii 36)
  }
  {
    program-id: (string-ascii 36),
    zone-id: (string-ascii 36),
    period: (string-ascii 10),  ;; YYYY-MM format
    criteria-id: (string-ascii 36),
    achievement-value: uint,
    reward-amount: uint,
    status: (string-ascii 20),  ;; pending, approved, rejected, paid
    application-date: uint,
    approval-date: (optional uint),
    approved-by: (optional principal),
    payment-date: (optional uint),
    payment-tx-id: (optional (buff 32))
  }
)

(define-map zone-reward-totals
  {
    zone-id: (string-ascii 36),
    year: (string-ascii 4)  ;; YYYY format
  }
  {
    total-rewards-earned: uint,
    total-rewards-paid: uint,
    reward-count: uint,
    last-updated: uint
  }
)

(define-map admins principal bool)
(define-map reward-managers principal bool)
(define-map reward-approvers principal bool)

;; Define error codes
(define-constant ERR-NOT-AUTHORIZED u1)
(define-constant ERR-PROGRAM-EXISTS u2)
(define-constant ERR-PROGRAM-NOT-FOUND u3)
(define-constant ERR-CRITERIA-EXISTS u4)
(define-constant ERR-CRITERIA-NOT-FOUND u5)
(define-constant ERR-REWARD-EXISTS u6)
(define-constant ERR-REWARD-NOT-FOUND u7)
(define-constant ERR-INVALID-PARAMETERS u8)
(define-constant ERR-NOT-MANAGER u9)
(define-constant ERR-NOT-APPROVER u10)
(define-constant ERR-INSUFFICIENT-BUDGET u11)
(define-constant ERR-REWARD-NOT-APPROVED u12)

;; Initialize contract with contract deployer as admin
(define-data-var contract-owner principal tx-sender)

;; Check if caller is an admin
(define-read-only (is-admin)
  (or
    (is-eq tx-sender (var-get contract-owner))
    (default-to false (map-get? admins tx-sender))
  )
)

;; Add a new admin
(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set admins new-admin true))
  )
)

;; Remove an admin
(define-public (remove-admin (admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete admins admin))
  )
)

;; Check if caller is a reward manager
(define-read-only (is-reward-manager)
  (or
    (is-admin)
    (default-to false (map-get? reward-managers tx-sender))
  )
)

;; Add a reward manager
(define-public (add-reward-manager (manager principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set reward-managers manager true))
  )
)

;; Remove a reward manager
(define-public (remove-reward-manager (manager principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete reward-managers manager))
  )
)

;; Check if caller is a reward approver
(define-read-only (is-reward-approver)
  (or
    (is-admin)
    (default-to false (map-get? reward-approvers tx-sender))
  )
)

;; Add a reward approver
(define-public (add-reward-approver (approver principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set reward-approvers approver true))
  )
)

;; Remove a reward approver
(define-public (remove-reward-approver (approver principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete reward-approvers approver))
  )
)

;; Create an incentive program
(define-public (create-incentive-program
  (program-id (string-ascii 36))
  (name (string-ascii 100))
  (description (string-ascii 200))
  (reward-type (string-ascii 20))
  (budget-amount uint)
  (start-date uint)
  (end-date uint)
)
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-none (map-get? incentive-programs { program-id: program-id })) (err ERR-PROGRAM-EXISTS))
    (asserts! (< start-date end-date) (err ERR-INVALID-PARAMETERS))

    (ok (map-set incentive-programs
      { program-id: program-id }
      {
        name: name,
        description: description,
        reward-type: reward-type,
        budget-amount: budget-amount,
        remaining-budget: budget-amount,
        start-date: start-date,
        end-date: end-date,
        created-by: tx-sender,
        creation-date: block-height,
        status: "active"
      }
    ))
  )
)

;; Update program status
(define-public (update-program-status
  (program-id (string-ascii 36))
  (status (string-ascii 20))
)
  (let (
    (program (unwrap! (map-get? incentive-programs { program-id: program-id }) (err ERR-PROGRAM-NOT-FOUND)))
  )
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))

    (ok (map-set incentive-programs
      { program-id: program-id }
      (merge program { status: status })
    ))
  )
)

;; Add reward criteria
(define-public (add-reward-criteria
  (program-id (string-ascii 36))
  (criteria-id (string-ascii 36))
  (name (string-ascii 100))
  (metric-type (string-ascii 20))
  (threshold-value uint)
  (threshold-unit (string-ascii 20))
  (reward-amount uint)
  (reward-unit (string-ascii 20))
)
  (begin
    (asserts! (is-reward-manager) (err ERR-NOT-MANAGER))
    (asserts! (is-some (map-get? incentive-programs { program-id: program-id })) (err ERR-PROGRAM-NOT-FOUND))
    (asserts! (is-none (map-get? reward-criteria { program-id: program-id, criteria-id: criteria-id })) (err ERR-CRITERIA-EXISTS))

    (ok (map-set reward-criteria
      { program-id: program-id, criteria-id: criteria-id }
      {
        name: name,
        metric-type: metric-type,
        threshold-value: threshold-value,
        threshold-unit: threshold-unit,
        reward-amount: reward-amount,
        reward-unit: reward-unit,
        created-date: block-height,
        active: true
      }
    ))
  )
)

;; Update reward criteria
(define-public (update-reward-criteria
  (program-id (string-ascii 36))
  (criteria-id (string-ascii 36))
  (name (string-ascii 100))
  (metric-type (string-ascii 20))
  (threshold-value uint)
  (threshold-unit (string-ascii 20))
  (reward-amount uint)
  (reward-unit (string-ascii 20))
  (active bool)
)
  (let (
    (criteria (unwrap! (map-get? reward-criteria { program-id: program-id, criteria-id: criteria-id }) (err ERR-CRITERIA-NOT-FOUND)))
  )
    (asserts! (is-reward-manager) (err ERR-NOT-MANAGER))

    (ok (map-set reward-criteria
      { program-id: program-id, criteria-id: criteria-id }
      {
        name: name,
        metric-type: metric-type,
        threshold-value: threshold-value,
        threshold-unit: threshold-unit,
        reward-amount: reward-amount,
        reward-unit: reward-unit,
        created-date: (get created-date criteria),
        active: active
      }
    ))
  )
)

;; Apply for a community reward
(define-public (apply-for-reward
  (reward-id (string-ascii 36))
  (program-id (string-ascii 36))
  (zone-id (string-ascii 36))
  (period (string-ascii 10))
  (criteria-id (string-ascii 36))
  (achievement-value uint)
)
  (begin
    (asserts! (is-reward-manager) (err ERR-NOT-MANAGER))
    (asserts! (is-none (map-get? community-rewards { reward-id: reward-id })) (err ERR-REWARD-EXISTS))

    ;; Verify program and criteria exist
    (let (
      (program (unwrap! (map-get? incentive-programs { program-id: program-id }) (err ERR-PROGRAM-NOT-FOUND)))
      (criteria (unwrap! (map-get? reward-criteria { program-id: program-id, criteria-id: criteria-id }) (err ERR-CRITERIA-NOT-FOUND)))
    )
      ;; Check if program is active
      (asserts! (is-eq (get status program) "active") (err ERR-INVALID-PARAMETERS))
      ;; Check if criteria is active
      (asserts! (get active criteria) (err ERR-INVALID-PARAMETERS))
      ;; Check if achievement meets threshold
      (asserts! (>= achievement-value (get threshold-value criteria)) (err ERR-INVALID-PARAMETERS))

      (ok (map-set community-rewards
        { reward-id: reward-id }
        {
          program-id: program-id,
          zone-id: zone-id,
          period: period,
          criteria-id: criteria-id,
          achievement-value: achievement-value,
          reward-amount: (get reward-amount criteria),
          status: "pending",
          application-date: block-height,
          approval-date: none,
          approved-by: none,
          payment-date: none,
          payment-tx-id: none
        }
      ))
    )
  )
)

;; Approve a community reward
(define-public (approve-reward
  (reward-id (string-ascii 36))
)
  (let (
    (reward (unwrap! (map-get? community-rewards { reward-id: reward-id }) (err ERR-REWARD-NOT-FOUND)))
    (program (unwrap! (map-get? incentive-programs { program-id: (get program-id reward) }) (err ERR-PROGRAM-NOT-FOUND)))
  )
    (asserts! (is-reward-approver) (err ERR-NOT-APPROVER))
    (asserts! (is-eq (get status reward) "pending") (err ERR-INVALID-PARAMETERS))

    ;; Check if program has sufficient budget
    (asserts! (>= (get remaining-budget program) (get reward-amount reward)) (err ERR-INSUFFICIENT-BUDGET))

    ;; Update program remaining budget
    (map-set incentive-programs
      { program-id: (get program-id reward) }
      (merge program {
        remaining-budget: (- (get remaining-budget program) (get reward-amount reward))
      })
    )

    ;; Update reward status
    (ok (map-set community-rewards
      { reward-id: reward-id }
      (merge reward {
        status: "approved",
        approval-date: (some block-height),
        approved-by: (some tx-sender)
      })
    ))
  )
)

;; Reject a community reward
(define-public (reject-reward
  (reward-id (string-ascii 36))
)
  (let (
    (reward (unwrap! (map-get? community-rewards { reward-id: reward-id }) (err ERR-REWARD-NOT-FOUND)))
  )
    (asserts! (is-reward-approver) (err ERR-NOT-APPROVER))
    (asserts! (is-eq (get status reward) "pending") (err ERR-INVALID-PARAMETERS))

    ;; Update reward status
    (ok (map-set community-rewards
      { reward-id: reward-id }
      (merge reward {
        status: "rejected",
        approval-date: (some block-height),
        approved-by: (some tx-sender)
      })
    ))
  )
)

;; Process reward payment
(define-public (process-reward-payment
  (reward-id (string-ascii 36))
  (payment-tx-id (buff 32))
)
  (let (
    (reward (unwrap! (map-get? community-rewards { reward-id: reward-id }) (err ERR-REWARD-NOT-FOUND)))
    (year (get-year-from-period (get period reward)))
  )
    (asserts! (is-reward-manager) (err ERR-NOT-MANAGER))
    (asserts! (is-eq (get status reward) "approved") (err ERR-REWARD-NOT-APPROVED))

    ;; Update zone reward totals
    (let (
      (zone-totals (default-to { total-rewards-earned: u0, total-rewards-paid: u0, reward-count: u0, last-updated: u0 }
                              (map-get? zone-reward-totals { zone-id: (get zone-id reward), year: year })))
    )
      (map-set zone-reward-totals
        { zone-id: (get zone-id reward), year: year }
        {
          total-rewards-earned: (+ (get total-rewards-earned zone-totals) (get reward-amount reward)),
          total-rewards-paid: (+ (get total-rewards-paid zone-totals) (get reward-amount reward)),
          reward-count: (+ (get reward-count zone-totals) u1),
          last-updated: block-height
        }
      )

      ;; Update reward status
      (ok (map-set community-rewards
        { reward-id: reward-id }
        (merge reward {
          status: "paid",
          payment-date: (some block-height),
          payment-tx-id: (some payment-tx-id)
        })
      ))
    )
  )
)

;; Helper function to extract year from period (YYYY-MM)
;; In a real implementation, this would parse the period properly
;; For simplicity, we're just returning a placeholder
(define-private (get-year-from-period (period (string-ascii 10)))
  "2023"
)

;; Get incentive program details
(define-read-only (get-incentive-program (program-id (string-ascii 36)))
  (map-get? incentive-programs { program-id: program-id })
)

;; Get reward criteria details
(define-read-only (get-reward-criteria (program-id (string-ascii 36)) (criteria-id (string-ascii 36)))
  (map-get? reward-criteria { program-id: program-id, criteria-id: criteria-id })
)

;; Get community reward details
(define-read-only (get-community-reward (reward-id (string-ascii 36)))
  (map-get? community-rewards { reward-id: reward-id })
)

;; Get zone reward totals
(define-read-only (get-zone-reward-totals (zone-id (string-ascii 36)) (year (string-ascii 4)))
  (default-to
    { total-rewards-earned: u0, total-rewards-paid: u0, reward-count: u0, last-updated: u0 }
    (map-get? zone-reward-totals { zone-id: zone-id, year: year })
  )
)

;; Check if a reward is approved
(define-read-only (is-reward-approved (reward-id (string-ascii 36)))
  (let (
    (reward (unwrap-panic (map-get? community-rewards { reward-id: reward-id })))
  )
    (is-eq (get status reward) "approved")
  )
)

;; Check if principal is a reward manager
(define-read-only (check-is-reward-manager (principal principal))
  (or
    (is-admin)
    (default-to false (map-get? reward-managers principal))
  )
)

;; Check if principal is a reward approver
(define-read-only (check-is-reward-approver (principal principal))
  (or
    (is-admin)
    (default-to false (map-get? reward-approvers principal))
  )
)

