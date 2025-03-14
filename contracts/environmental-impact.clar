;; Environmental Impact Contract
;; Measures and reports on waste reduction

;; Define data variables
(define-map sustainability-goals
  { goal-id: (string-ascii 36) }
  {
    name: (string-ascii 100),
    description: (string-ascii 200),
    target-type: (string-ascii 20),  ;; reduction, recycling, composting, etc.
    target-value: uint,
    target-unit: (string-ascii 20),  ;; kg, percentage, etc.
    start-date: uint,
    end-date: uint,
    created-by: principal,
    creation-date: uint,
    status: (string-ascii 20)  ;; active, achieved, missed, cancelled
  }
)

(define-map zone-sustainability-metrics
  {
    zone-id: (string-ascii 36),
    period: (string-ascii 10)  ;; YYYY-MM format
  }
  {
    total-waste-collected-kg: uint,
    total-waste-recycled-kg: uint,
    total-waste-composted-kg: uint,
    total-waste-landfilled-kg: uint,
    recycling-rate-percentage: uint,  ;; 0-100
    composting-rate-percentage: uint,  ;; 0-100
    landfill-diversion-rate-percentage: uint,  ;; 0-100
    carbon-emissions-saved-kg: uint,
    last-updated: uint
  }
)

(define-map impact-reports
  { report-id: (string-ascii 36) }
  {
    zone-id: (string-ascii 36),
    report-type: (string-ascii 20),  ;; monthly, quarterly, annual
    period-start: uint,
    period-end: uint,
    total-waste-reduction-kg: uint,
    carbon-footprint-reduction-kg: uint,
    resource-savings: (string-ascii 200),
    key-achievements: (string-ascii 500),
    challenges: (string-ascii 500),
    recommendations: (string-ascii 500),
    generated-by: principal,
    generation-date: uint,
    status: (string-ascii 20)  ;; draft, published, archived
  }
)

(define-map carbon-emission-factors
  { waste-type: (string-ascii 20) }
  {
    landfill-factor-kg-co2-per-kg: uint,  ;; CO2 equivalent per kg waste
    recycling-factor-kg-co2-per-kg: uint,
    composting-factor-kg-co2-per-kg: uint,
    incineration-factor-kg-co2-per-kg: uint,
    last-updated: uint
  }
)

(define-map admins principal bool)
(define-map analysts principal bool)
(define-map report-generators principal bool)

;; Define error codes
(define-constant ERR-NOT-AUTHORIZED u1)
(define-constant ERR-GOAL-EXISTS u2)
(define-constant ERR-GOAL-NOT-FOUND u3)
(define-constant ERR-METRICS-EXISTS u4)
(define-constant ERR-METRICS-NOT-FOUND u5)
(define-constant ERR-REPORT-EXISTS u6)
(define-constant ERR-REPORT-NOT-FOUND u7)
(define-constant ERR-INVALID-PARAMETERS u8)
(define-constant ERR-NOT-ANALYST u9)
(define-constant ERR-NOT-REPORT-GENERATOR u10)

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

;; Check if caller is an analyst
(define-read-only (is-analyst)
  (or
    (is-admin)
    (default-to false (map-get? analysts tx-sender))
  )
)

;; Add an analyst
(define-public (add-analyst (analyst principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set analysts analyst true))
  )
)

;; Remove an analyst
(define-public (remove-analyst (analyst principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete analysts analyst))
  )
)

;; Check if caller is a report generator
(define-read-only (is-report-generator)
  (or
    (is-admin)
    (default-to false (map-get? report-generators tx-sender))
  )
)

;; Add a report generator
(define-public (add-report-generator (generator principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set report-generators generator true))
  )
)

;; Remove a report generator
(define-public (remove-report-generator (generator principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete report-generators generator))
  )
)

;; Create a sustainability goal
(define-public (create-sustainability-goal
  (goal-id (string-ascii 36))
  (name (string-ascii 100))
  (description (string-ascii 200))
  (target-type (string-ascii 20))
  (target-value uint)
  (target-unit (string-ascii 20))
  (start-date uint)
  (end-date uint)
)
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-none (map-get? sustainability-goals { goal-id: goal-id })) (err ERR-GOAL-EXISTS))
    (asserts! (< start-date end-date) (err ERR-INVALID-PARAMETERS))

    (ok (map-set sustainability-goals
      { goal-id: goal-id }
      {
        name: name,
        description: description,
        target-type: target-type,
        target-value: target-value,
        target-unit: target-unit,
        start-date: start-date,
        end-date: end-date,
        created-by: tx-sender,
        creation-date: block-height,
        status: "active"
      }
    ))
  )
)

;; Update sustainability goal status
(define-public (update-goal-status
  (goal-id (string-ascii 36))
  (status (string-ascii 20))
)
  (let (
    (goal (unwrap! (map-get? sustainability-goals { goal-id: goal-id }) (err ERR-GOAL-NOT-FOUND)))
  )
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))

    (ok (map-set sustainability-goals
      { goal-id: goal-id }
      (merge goal { status: status })
    ))
  )
)

;; Record zone sustainability metrics
(define-public (record-zone-metrics
  (zone-id (string-ascii 36))
  (period (string-ascii 10))
  (total-waste-collected-kg uint)
  (total-waste-recycled-kg uint)
  (total-waste-composted-kg uint)
  (total-waste-landfilled-kg uint)
)
  (begin
    (asserts! (is-analyst) (err ERR-NOT-ANALYST))

    ;; Calculate percentages
    (let (
      (recycling-rate (if (> total-waste-collected-kg u0)
                        (/ (* total-waste-recycled-kg u100) total-waste-collected-kg)
                        u0))
      (composting-rate (if (> total-waste-collected-kg u0)
                         (/ (* total-waste-composted-kg u100) total-waste-collected-kg)
                         u0))
      (landfill-diversion-rate (if (> total-waste-collected-kg u0)
                                 (/ (* (- total-waste-collected-kg total-waste-landfilled-kg) u100) total-waste-collected-kg)
                                 u0))
      (carbon-emissions-saved (calculate-carbon-savings total-waste-recycled-kg total-waste-composted-kg))
    )
      (ok (map-set zone-sustainability-metrics
        { zone-id: zone-id, period: period }
        {
          total-waste-collected-kg: total-waste-collected-kg,
          total-waste-recycled-kg: total-waste-recycled-kg,
          total-waste-composted-kg: total-waste-composted-kg,
          total-waste-landfilled-kg: total-waste-landfilled-kg,
          recycling-rate-percentage: recycling-rate,
          composting-rate-percentage: composting-rate,
          landfill-diversion-rate-percentage: landfill-diversion-rate,
          carbon-emissions-saved-kg: carbon-emissions-saved,
          last-updated: block-height
        }
      ))
    )
  )
)

;; Generate impact report
(define-public (generate-impact-report
  (report-id (string-ascii 36))
  (zone-id (string-ascii 36))
  (report-type (string-ascii 20))
  (period-start uint)
  (period-end uint)
  (total-waste-reduction-kg uint)
  (carbon-footprint-reduction-kg uint)
  (resource-savings (string-ascii 200))
  (key-achievements (string-ascii 500))
  (challenges (string-ascii 500))
  (recommendations (string-ascii 500))
)
  (begin
    (asserts! (is-report-generator) (err ERR-NOT-REPORT-GENERATOR))
    (asserts! (is-none (map-get? impact-reports { report-id: report-id })) (err ERR-REPORT-EXISTS))
    (asserts! (< period-start period-end) (err ERR-INVALID-PARAMETERS))

    (ok (map-set impact-reports
      { report-id: report-id }
      {
        zone-id: zone-id,
        report-type: report-type,
        period-start: period-start,
        period-end: period-end,
        total-waste-reduction-kg: total-waste-reduction-kg,
        carbon-footprint-reduction-kg: carbon-footprint-reduction-kg,
        resource-savings: resource-savings,
        key-achievements: key-achievements,
        challenges: challenges,
        recommendations: recommendations,
        generated-by: tx-sender,
        generation-date: block-height,
        status: "draft"
      }
    ))
  )
)

;; Update report status
(define-public (update-report-status
  (report-id (string-ascii 36))
  (status (string-ascii 20))
)
  (let (
    (report (unwrap! (map-get? impact-reports { report-id: report-id }) (err ERR-REPORT-NOT-FOUND)))
  )
    (asserts! (or (is-admin) (is-eq (get generated-by report) tx-sender)) (err ERR-NOT-AUTHORIZED))

    (ok (map-set impact-reports
      { report-id: report-id }
      (merge report { status: status })
    ))
  )
)

;; Set carbon emission factors
(define-public (set-carbon-emission-factors
  (waste-type (string-ascii 20))
  (landfill-factor-kg-co2-per-kg uint)
  (recycling-factor-kg-co2-per-kg uint)
  (composting-factor-kg-co2-per-kg uint)
  (incineration-factor-kg-co2-per-kg uint)
)
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))

    (ok (map-set carbon-emission-factors
      { waste-type: waste-type }
      {
        landfill-factor-kg-co2-per-kg: landfill-factor-kg-co2-per-kg,
        recycling-factor-kg-co2-per-kg: recycling-factor-kg-co2-per-kg,
        composting-factor-kg-co2-per-kg: composting-factor-kg-co2-per-kg,
        incineration-factor-kg-co2-per-kg: incineration-factor-kg-co2-per-kg,
        last-updated: block-height
      }
    ))
  )
)

;; Helper function to calculate carbon savings
;; In a real implementation, this would use the carbon emission factors
;; For simplicity, we're using a basic calculation
(define-private (calculate-carbon-savings (recycled-kg uint) (composted-kg uint))
  (+ (* recycled-kg u2) (* composted-kg u1))  ;; Simplified: 2kg CO2 saved per kg recycled, 1kg CO2 saved per kg composted
)

;; Get sustainability goal details
(define-read-only (get-sustainability-goal (goal-id (string-ascii 36)))
  (map-get? sustainability-goals { goal-id: goal-id })
)

;; Get zone sustainability metrics
(define-read-only (get-zone-metrics (zone-id (string-ascii 36)) (period (string-ascii 10)))
  (map-get? zone-sustainability-metrics { zone-id: zone-id, period: period })
)

;; Get impact report details
(define-read-only (get-impact-report (report-id (string-ascii 36)))
  (map-get? impact-reports { report-id: report-id })
)

;; Get carbon emission factors for a waste type
(define-read-only (get-carbon-emission-factors (waste-type (string-ascii 20)))
  (map-get? carbon-emission-factors { waste-type: waste-type })
)

;; Check if a goal has been achieved
(define-read-only (is-goal-achieved (goal-id (string-ascii 36)))
  (let (
    (goal (unwrap-panic (map-get? sustainability-goals { goal-id: goal-id })))
  )
    (is-eq (get status goal) "achieved")
  )
)

;; Check if principal is an analyst
(define-read-only (check-is-analyst (principal principal))
  (or
    (is-admin)
    (default-to false (map-get? analysts principal))
  )
)

;; Check if principal is a report generator
(define-read-only (check-is-report-generator (principal principal))
  (or
    (is-admin)
    (default-to false (map-get? report-generators principal))
  )
)

