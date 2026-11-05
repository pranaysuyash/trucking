// Generated read-only scenario snapshot. Regenerate with build-fixture.cjs.
window.DENSITY_FIXTURE = {
  "asOf": "2026-10-22",
  "mode": "read_only_visual_fixture",
  "reference": {
    "id": "164d2dfd-ce9b-4273-b663-885a67672688",
    "reference": "Browser verified shipment 1792678455988",
    "mode": "local_scenario",
    "revision": 23,
    "inputRevision": 2,
    "status": "invoice_ready",
    "results": {
      "asset": {
        "ok": true,
        "summary": "53' Standard Dry Van (Class 8): declared interior, door and payload snapshot ready.",
        "details": {
          "equipmentId": "dry-van-53",
          "name": "53' Standard Dry Van (Class 8)",
          "lengthIn": 630,
          "widthIn": 99.96000000000001,
          "heightIn": 110.03999999999999,
          "doorWidthIn": 98.03999999999999,
          "doorHeightIn": 108,
          "payloadLbs": 45000,
          "loadedMpg": 6.8,
          "source": "Catalog scenario template; actual equipment measurement remains separate"
        },
        "inputRevision": 2,
        "productId": "product-04-asset-studio",
        "recordedAt": "2026-10-22T14:14:42.846Z"
      },
      "carrier": {
        "ok": true,
        "summary": "Apex Freight Lines LLC: APPROVED under configured customer policy, using seeded scenario evidence. ",
        "details": {
          "dotNumber": "389211",
          "eligibility": "APPROVED",
          "evidenceSource": "seeded_scenario",
          "expiresAt": "2026-10-22T14:29:48.071Z",
          "blockers": [],
          "warnings": []
        },
        "inputRevision": 2,
        "productId": "product-08-carrier-trust",
        "recordedAt": "2026-10-22T14:14:48.832Z"
      },
      "hos": {
        "ok": true,
        "summary": "2.3 modeled transit hours for SCENARIO-DRIVER-01. Full-rest scenario only; no live ELD or appointment guarantee.",
        "details": {
          "driverId": "SCENARIO-DRIVER-01",
          "priorRestHours": 10,
          "ruleScope": "full_rest_only",
          "isLegal": true,
          "totalTransitHours": 2.3,
          "waypoints": [
            {
              "id": "wp-1",
              "type": "ORIGIN_PICKUP",
              "title": "Pre-Trip Inspection & Live Load",
              "location": "Chicago, IL",
              "distanceMiles": 0,
              "cumulativeMiles": 0,
              "durationMinutes": 15,
              "cumulativeTimeMinutes": 15,
              "dutyStatus": "ON_DUTY_NOT_DRIVING",
              "notes": "Verify commercial equipment, air brake test, bill of lading pickup."
            },
            {
              "id": "wp-2",
              "type": "DRIVING_LEG",
              "title": "Interstate Driving Leg (95 mi)",
              "location": "Corridor Mile 95",
              "distanceMiles": 95,
              "cumulativeMiles": 95,
              "durationMinutes": 104,
              "cumulativeTimeMinutes": 119,
              "dutyStatus": "DRIVING",
              "notes": "Speed maintained at ~55 MPH. Clocks running."
            },
            {
              "id": "wp-3",
              "type": "DESTINATION_DROPOFF",
              "title": "Consignee Delivery & Post-Trip DVIR",
              "location": "Milwaukee, WI",
              "distanceMiles": 0,
              "cumulativeMiles": 95,
              "durationMinutes": 20,
              "cumulativeTimeMinutes": 139,
              "dutyStatus": "ON_DUTY_NOT_DRIVING",
              "notes": "Seal verification, dock delivery receipt signature, driver post-trip inspection."
            }
          ],
          "violations": []
        },
        "inputRevision": 2,
        "productId": "product-03-hos-planner",
        "recordedAt": "2026-10-22T14:14:53.692Z"
      },
      "fit": {
        "ok": true,
        "summary": "2/2 handling units placed. Independent geometric checks passed under declared constraints.",
        "details": {
          "geometryFeasible": true,
          "violations": 0,
          "unitIds": [
            "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
            "164d2dfd-ce9b-4273-b663-885a67672688-HU-01"
          ],
          "placements": [
            {
              "unitId": "Replacement parts pallet",
              "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
              "label": "Replacement parts pallet",
              "x": 0,
              "y": 0,
              "z": 0,
              "dx": 1219.2,
              "dy": 1016,
              "dz": 1320.8,
              "order": 1,
              "stop": 1
            },
            {
              "unitId": "Machine components pallet",
              "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
              "label": "Machine components pallet",
              "x": 0,
              "y": 1016,
              "z": 0,
              "dx": 1219.2,
              "dy": 1016,
              "dz": 1219.2,
              "order": 2,
              "stop": 1
            }
          ],
          "status": "FEASIBLE_UNDER_MODELED_CONSTRAINTS",
          "solverVersion": "ep-heuristic-1.0",
          "checks": [
            {
              "id": "bounds",
              "label": "Inside interior dimensions",
              "note": "Every box lies within L × W × H of the declared interior.",
              "state": "verified"
            },
            {
              "id": "overlap",
              "label": "No overlapping items",
              "note": "Pairwise axis-aligned box test by an independent validator.",
              "state": "verified"
            },
            {
              "id": "orientation",
              "label": "Allowed orientations only",
              "note": "Each item uses an orientation permitted by its rotation rule.",
              "state": "verified"
            },
            {
              "id": "support",
              "label": "Base support & no-stack",
              "note": "Each raised item rests on surfaces at its exact base height, none marked no-stack.",
              "state": "verified"
            },
            {
              "id": "payload",
              "label": "Declared payload",
              "state": "verified",
              "note": "Sum of declared unit weights vs the declared payload figure."
            },
            {
              "id": "door",
              "label": "Door opening",
              "state": "verified",
              "note": "Each item's cross-section in its placed orientation fits the declared opening. Interior path and handling equipment are NOT modeled."
            },
            {
              "id": "axle",
              "label": "Axle / axle-group loads & legal limits",
              "state": "not_modeled",
              "note": "Needs vehicle configuration, tare and jurisdiction. Verify with scales and a qualified person."
            },
            {
              "id": "securement",
              "label": "Load securement",
              "state": "not_modeled",
              "note": "Depends on restraint equipment and applicable rules, not on box geometry."
            },
            {
              "id": "handling",
              "label": "Forklift / manual handling access",
              "state": "not_modeled",
              "note": "Loading order, aisle and reach are not simulated."
            },
            {
              "id": "stops",
              "label": "Multi-stop access order",
              "state": "not_modeled",
              "note": "Unload sequence is not modeled."
            },
            {
              "id": "cog",
              "label": "Centre of gravity (height & lateral)",
              "state": "not_modeled",
              "note": "Longitudinal centroid is shown as information only."
            }
          ],
          "limitation": "No physical scale, restraint or road-legal certification."
        },
        "inputRevision": 2,
        "productId": "product-01-cargo-fit",
        "recordedAt": "2026-10-22T14:14:44.716Z"
      },
      "warehouse": {
        "ok": true,
        "summary": "2/2 identified units have compatible receiving locations.",
        "details": {
          "facilityId": "LOCAL-RECEIVING-01",
          "assignments": [
            {
              "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
              "slotId": "R01-B02-L1-A",
              "slotCode": "R01-B02-L1-A"
            },
            {
              "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
              "slotId": "R01-B02-L1-B",
              "slotCode": "R01-B02-L1-B"
            }
          ],
          "recommendations": [
            {
              "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
              "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
              "description": "Machine components pallet",
              "weightLbs": 1250,
              "dimensions": {
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 48
              },
              "environmentalClass": "ambient",
              "status": "proposed",
              "targetSlotId": "R01-B02-L1-A",
              "targetLocationCode": "R01-B02-L1-A",
              "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
              "suitabilityScore": 90,
              "reason": "Optimal high-bay rack storage (Level 1)",
              "violations": [
                "Zone does not support AMBIENT classification (requires certified storage)",
                "Exterior yard slots require intermodal or ISO containerized cargo"
              ],
              "alternativeSlotIds": [
                "R01-B02-L1-B",
                "R01-B02-L2-A",
                "R01-B02-L3-B"
              ]
            },
            {
              "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
              "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
              "description": "Replacement parts pallet",
              "weightLbs": 1500,
              "dimensions": {
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 52
              },
              "environmentalClass": "ambient",
              "status": "proposed",
              "targetSlotId": "R01-B02-L1-B",
              "targetLocationCode": "R01-B02-L1-B",
              "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
              "suitabilityScore": 90,
              "reason": "Optimal high-bay rack storage (Level 1)",
              "violations": [
                "Zone does not support AMBIENT classification (requires certified storage)",
                "Exterior yard slots require intermodal or ISO containerized cargo"
              ],
              "alternativeSlotIds": [
                "R01-B02-L2-A",
                "R01-B02-L3-B",
                "R01-B03-L1-A"
              ]
            }
          ]
        },
        "inputRevision": 2,
        "productId": "product-06-warehouse-space-flow",
        "recordedAt": "2026-10-22T14:14:45.817Z"
      },
      "yard": {
        "ok": true,
        "summary": "Compatible scenario dock 6 allocated to SCENARIO-TRAILER-01. Seal verification remains an execution task.",
        "details": {
          "doorId": "DOOR-06",
          "trailerId": "SCENARIO-TRAILER-01",
          "available": true,
          "facilityId": "LOCAL-ORIGIN-01"
        },
        "inputRevision": 2,
        "productId": "product-07-yard-dock",
        "recordedAt": "2026-10-22T14:14:47.137Z"
      },
      "quote": {
        "ok": true,
        "summary": "USD 287.87 carrier estimate using declared costs and dated diesel input. Publishing accepts these terms for this local scenario only.",
        "details": {
          "currency": "USD",
          "lines": [
            {
              "label": "Linehaul",
              "cents": 21690
            },
            {
              "label": "Fuel surcharge",
              "cents": 7097
            },
            {
              "label": "Approved scenario accessorials",
              "cents": 0
            }
          ],
          "totalCents": 28787,
          "accepted": true,
          "profile": {
            "id": "local-scenario",
            "name": "Declared scenario cost profile",
            "annualMilesBenchmark": 100000,
            "truckPaymentMonthly": 2100,
            "trailerPaymentMonthly": 750,
            "insuranceMonthly": 1250,
            "permitsLicensesMonthly": 200,
            "dispatchSoftwareMonthly": 350,
            "driverCpm": 0.68,
            "maintenanceTiresCpm": 0.22,
            "tollsTotal": 0,
            "miscellaneousCpm": 0.05,
            "avgMpgLoaded": 6.8,
            "avgMpgEmpty": 7.5,
            "currentDieselPricePerGallon": 6.276,
            "fscPegBasePricePerGallon": 1.2
          },
          "dieselObservedOn": "2026-10-19",
          "scenarioMargin": {
            "totalShipperInvoice": 287.87,
            "totalCarrierPayable": 287.87,
            "grossMarginAmount": 0,
            "grossMarginPercent": 0,
            "agentCommissionAmount": 0,
            "brokerNetRetained": 0,
            "status": "LOW_MARGIN_WARNING",
            "requiresManagementApproval": true,
            "alertMessage": "LOW MARGIN ALERT: Gross margin of 0% is below the mandatory 12% threshold. Manager sign-off required prior to rate confirmation release."
          }
        },
        "inputRevision": 2,
        "productId": "product-02-freight-pricing",
        "recordedAt": "2026-10-22T14:14:55.289Z"
      }
    },
    "exceptions": [
      {
        "id": "06baac40-4f04-41d2-bd3b-c0f2f5a1ae5d",
        "message": "Scenario receiving delay requires review.",
        "resolved": true,
        "resolution": "Receiving completed; local scenario delay reviewed with no additional charge."
      }
    ],
    "operations": {
      "3ba70f76-3900-4664-b5cb-afe387461dee": {
        "fingerprint": "ea305e2df717e2097eb59909fd8b119b46d5b80f139616d5beebbd000ce0f70a"
      },
      "f2527e87-6ca4-4f48-9573-bbe04b9f11d4": {
        "fingerprint": "b40c3dcafc0d90af4040f29b523ed154eb515c4d9a95c8183117c78b28a6a4eb"
      },
      "5620d0d0-9f95-4358-90b6-d47b3c0ddf82": {
        "fingerprint": "0bf3487b54f48bcb48250f5b6c6acd2073d0b8ec47e866025b961fed3cf9259f"
      },
      "803ae3a4-f49f-445c-9f49-0caac2f3a64c": {
        "fingerprint": "815b00a68516c7844fd3322fed1946bd3770aba2034e5ffe969351fe33cd720d"
      },
      "381dc2e6-b5ec-48fd-8ff4-b1f9ff409abb": {
        "fingerprint": "6848e781b8d9a39215c8d77abb483bb7d3f81ca028c998ef5f54094b82c3d054"
      },
      "276e50ee-e6f0-4626-a10e-34b3f9241b4b": {
        "fingerprint": "e6afc3d9596ba91ee2deb7c5915c2293682b0bb751780a609084303b3ef14d15"
      },
      "c29e11ae-c255-401f-90fd-4ab97a25ded4": {
        "fingerprint": "5b469f1952756aa16e61c2a87b607df0ded05eb03c17b6912637e28754827fec"
      },
      "45c4e49a-2f53-4a65-85a9-041f5a5683a3": {
        "fingerprint": "f5ee9f111e8dc0bb8510a91e70e30b8e3bf365ab461e4c234b27b9c08cce6e99"
      },
      "8a03d3dc-00bb-40f2-82bb-be7cb767629e": {
        "fingerprint": "c6fee7d1573ef68efab5944a32122c2971052e23ef8abf562279e2d85045a8a9"
      },
      "19d6606d-451d-4bd5-b2ba-ab17afa01752": {
        "fingerprint": "10dffc4fe0dc5d74bac97c2143ba2c9907843fc4f660be116b892d02702422fe"
      },
      "de4d2f80-57f4-48f3-b829-3c284feee940": {
        "fingerprint": "becde0b4f6252fa4f3cb96dba0e343391b3444c523002440a2d28cc422ecbfcd"
      },
      "6caa3391-c104-4e0e-b2ae-58f315625623": {
        "fingerprint": "5a21c74e9bd6b2e0361b64321785f1104cfa2ccfca2e5f8021f0bcaebbf202ba"
      },
      "2debef72-58bb-47dd-9660-b2b746cbbb60": {
        "fingerprint": "3e0921bc9549d78f5702aa2418072cbe5645f582bb4a0aa43871c9601b829726"
      },
      "c615c77a-5655-41ab-a2af-3d7c6bb6b487": {
        "fingerprint": "e7ec3147ce0fd1c7542550524582b01c42ed2a210453bb19d193f25b0317cdf6"
      },
      "166a157a-bb05-4436-b267-cb1cec545181": {
        "fingerprint": "c6a208ed5921a1a40ef8e347184f1206dd46ea1dfdf75b901b53272021f8b525"
      },
      "ee60385d-88a8-4a58-a64e-dfd6ea05bcc3": {
        "fingerprint": "5aac38fb19c35bf3353657e59d184b039e7a7be8ffa6a7139638c6a5e9bbef11"
      },
      "13ccc231-d5d0-4b3b-9d2e-36feacb35244": {
        "fingerprint": "e70203e28a60497426c9d35d0b2b753e260fdc8fcd0ebd97b9d85433a24ea7b2"
      },
      "87ed6a97-1cc0-481e-b005-b394f9aa62d0": {
        "fingerprint": "15d059373c9e84e9e87977089a5478ead1d84da46996c8ff6b4fb2aff50f63e2"
      },
      "06baac40-4f04-41d2-bd3b-c0f2f5a1ae5d": {
        "fingerprint": "60fee4d325ce685f756b0c6e05b94db77cca19674664ffaebd6139e15645b3a0"
      },
      "dd40d60e-0e7d-44b8-8917-d80a6a297abf": {
        "fingerprint": "0017e28629244c1ade99d70a9fe305c192f2cdaf8e322a3ffa145966c80ca1f5"
      },
      "54f74f6c-cea2-4150-adeb-c0043061f622": {
        "fingerprint": "26176840d58137a55ff86ac7addb691050ebb2b43e8351ec4b664688044e0c30"
      },
      "cde0021e-ac0c-4cea-be8a-319e54944c78": {
        "fingerprint": "1fd89638e175cf28cd510c0be1505e96181381c6b95fd8ec5187ed45bb71fe66"
      }
    },
    "input": {
      "origin": "Chicago, IL",
      "destination": "Milwaukee, WI",
      "loadedMiles": 95,
      "deadheadMiles": 12,
      "equipmentId": "dry-van-53",
      "carrierDot": "389211",
      "driverId": "SCENARIO-DRIVER-01",
      "tractorId": "SCENARIO-TRACTOR-01",
      "trailerId": "SCENARIO-TRAILER-01",
      "priorRestHours": 10,
      "units": [
        {
          "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
          "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
          "description": "Machine components pallet",
          "lengthIn": 48,
          "widthIn": 40,
          "heightIn": 48,
          "weightLbs": 1250,
          "stackable": false,
          "temperatureClass": "ambient"
        },
        {
          "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
          "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
          "description": "Replacement parts pallet",
          "lengthIn": 48,
          "widthIn": 40,
          "heightIn": 52,
          "weightLbs": 1500,
          "stackable": false,
          "temperatureClass": "ambient"
        }
      ]
    },
    "events": [
      {
        "id": "9ea1f89f-122e-419b-ab8b-c652c4ae8005",
        "type": "created",
        "productId": "command-center-portal",
        "at": "2026-10-22T14:14:16.209Z",
        "inputRevision": 1,
        "note": "Explicit local scenario created. No live carrier, device or physical delivery evidence.",
        "payload": {
          "input": {
            "origin": "Chicago, IL",
            "destination": "Milwaukee, WI",
            "loadedMiles": 95,
            "deadheadMiles": 12,
            "equipmentId": "dry-van-53",
            "carrierDot": "389211",
            "driverId": "SCENARIO-DRIVER-01",
            "tractorId": "SCENARIO-TRACTOR-01",
            "trailerId": "SCENARIO-TRAILER-01",
            "priorRestHours": 10,
            "units": [
              {
                "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                "description": "Machine components pallet",
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 48,
                "weightLbs": 1200,
                "stackable": false,
                "temperatureClass": "ambient"
              },
              {
                "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                "description": "Replacement parts pallet",
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 52,
                "weightLbs": 1500,
                "stackable": false,
                "temperatureClass": "ambient"
              }
            ]
          }
        }
      },
      {
        "id": "42aea788-f93c-47be-833b-6d2db06d722d",
        "type": "evaluate",
        "productId": "product-04-asset-studio",
        "at": "2026-10-22T14:14:17.409Z",
        "inputRevision": 1,
        "note": "asset: 53' Standard Dry Van (Class 8): declared interior, door and payload snapshot ready.",
        "payload": {
          "stage": "asset",
          "result": {
            "ok": true,
            "summary": "53' Standard Dry Van (Class 8): declared interior, door and payload snapshot ready.",
            "details": {
              "equipmentId": "dry-van-53",
              "name": "53' Standard Dry Van (Class 8)",
              "lengthIn": 630,
              "widthIn": 99.96000000000001,
              "heightIn": 110.03999999999999,
              "doorWidthIn": 98.03999999999999,
              "doorHeightIn": 108,
              "payloadLbs": 45000,
              "loadedMpg": 6.8,
              "source": "Catalog scenario template; actual equipment measurement remains separate"
            }
          }
        }
      },
      {
        "id": "b8b301a7-45b3-4e31-846e-8f3434a09c84",
        "type": "evaluate",
        "productId": "product-01-cargo-fit",
        "at": "2026-10-22T14:14:19.403Z",
        "inputRevision": 1,
        "note": "fit: 2/2 handling units placed. Independent geometric checks passed under declared constraints.",
        "payload": {
          "stage": "fit",
          "result": {
            "ok": true,
            "summary": "2/2 handling units placed. Independent geometric checks passed under declared constraints.",
            "details": {
              "geometryFeasible": true,
              "violations": 0,
              "unitIds": [
                "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                "164d2dfd-ce9b-4273-b663-885a67672688-HU-01"
              ],
              "placements": [
                {
                  "unitId": "Replacement parts pallet",
                  "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "label": "Replacement parts pallet",
                  "x": 0,
                  "y": 0,
                  "z": 0,
                  "dx": 1219.2,
                  "dy": 1016,
                  "dz": 1320.8,
                  "order": 1,
                  "stop": 1
                },
                {
                  "unitId": "Machine components pallet",
                  "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "label": "Machine components pallet",
                  "x": 0,
                  "y": 1016,
                  "z": 0,
                  "dx": 1219.2,
                  "dy": 1016,
                  "dz": 1219.2,
                  "order": 2,
                  "stop": 1
                }
              ],
              "status": "FEASIBLE_UNDER_MODELED_CONSTRAINTS",
              "solverVersion": "ep-heuristic-1.0",
              "checks": [
                {
                  "id": "bounds",
                  "label": "Inside interior dimensions",
                  "note": "Every box lies within L × W × H of the declared interior.",
                  "state": "verified"
                },
                {
                  "id": "overlap",
                  "label": "No overlapping items",
                  "note": "Pairwise axis-aligned box test by an independent validator.",
                  "state": "verified"
                },
                {
                  "id": "orientation",
                  "label": "Allowed orientations only",
                  "note": "Each item uses an orientation permitted by its rotation rule.",
                  "state": "verified"
                },
                {
                  "id": "support",
                  "label": "Base support & no-stack",
                  "note": "Each raised item rests on surfaces at its exact base height, none marked no-stack.",
                  "state": "verified"
                },
                {
                  "id": "payload",
                  "label": "Declared payload",
                  "state": "verified",
                  "note": "Sum of declared unit weights vs the declared payload figure."
                },
                {
                  "id": "door",
                  "label": "Door opening",
                  "state": "verified",
                  "note": "Each item's cross-section in its placed orientation fits the declared opening. Interior path and handling equipment are NOT modeled."
                },
                {
                  "id": "axle",
                  "label": "Axle / axle-group loads & legal limits",
                  "state": "not_modeled",
                  "note": "Needs vehicle configuration, tare and jurisdiction. Verify with scales and a qualified person."
                },
                {
                  "id": "securement",
                  "label": "Load securement",
                  "state": "not_modeled",
                  "note": "Depends on restraint equipment and applicable rules, not on box geometry."
                },
                {
                  "id": "handling",
                  "label": "Forklift / manual handling access",
                  "state": "not_modeled",
                  "note": "Loading order, aisle and reach are not simulated."
                },
                {
                  "id": "stops",
                  "label": "Multi-stop access order",
                  "state": "not_modeled",
                  "note": "Unload sequence is not modeled."
                },
                {
                  "id": "cog",
                  "label": "Centre of gravity (height & lateral)",
                  "state": "not_modeled",
                  "note": "Longitudinal centroid is shown as information only."
                }
              ],
              "limitation": "No physical scale, restraint or road-legal certification."
            }
          }
        }
      },
      {
        "id": "f110f58d-1ea9-4fbf-bec6-fc6925db59d3",
        "type": "evaluate",
        "productId": "product-06-warehouse-space-flow",
        "at": "2026-10-22T14:14:22.695Z",
        "inputRevision": 1,
        "note": "warehouse: 2/2 identified units have compatible receiving locations.",
        "payload": {
          "stage": "warehouse",
          "result": {
            "ok": true,
            "summary": "2/2 identified units have compatible receiving locations.",
            "details": {
              "facilityId": "LOCAL-RECEIVING-01",
              "assignments": [
                {
                  "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                  "slotId": "R01-B02-L1-A",
                  "slotCode": "R01-B02-L1-A"
                },
                {
                  "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                  "slotId": "R01-B02-L1-B",
                  "slotCode": "R01-B02-L1-B"
                }
              ],
              "recommendations": [
                {
                  "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                  "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "description": "Machine components pallet",
                  "weightLbs": 1200,
                  "dimensions": {
                    "lengthIn": 48,
                    "widthIn": 40,
                    "heightIn": 48
                  },
                  "environmentalClass": "ambient",
                  "status": "proposed",
                  "targetSlotId": "R01-B02-L1-A",
                  "targetLocationCode": "R01-B02-L1-A",
                  "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
                  "suitabilityScore": 90,
                  "reason": "Optimal high-bay rack storage (Level 1)",
                  "violations": [
                    "Zone does not support AMBIENT classification (requires certified storage)",
                    "Exterior yard slots require intermodal or ISO containerized cargo"
                  ],
                  "alternativeSlotIds": [
                    "R01-B02-L1-B",
                    "R01-B02-L2-A",
                    "R01-B02-L3-B"
                  ]
                },
                {
                  "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                  "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "description": "Replacement parts pallet",
                  "weightLbs": 1500,
                  "dimensions": {
                    "lengthIn": 48,
                    "widthIn": 40,
                    "heightIn": 52
                  },
                  "environmentalClass": "ambient",
                  "status": "proposed",
                  "targetSlotId": "R01-B02-L1-B",
                  "targetLocationCode": "R01-B02-L1-B",
                  "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
                  "suitabilityScore": 90,
                  "reason": "Optimal high-bay rack storage (Level 1)",
                  "violations": [
                    "Zone does not support AMBIENT classification (requires certified storage)",
                    "Exterior yard slots require intermodal or ISO containerized cargo"
                  ],
                  "alternativeSlotIds": [
                    "R01-B02-L2-A",
                    "R01-B02-L3-B",
                    "R01-B03-L1-A"
                  ]
                }
              ]
            }
          }
        }
      },
      {
        "id": "bcb0d38c-5a8b-48e7-93be-8e90fce18eb9",
        "type": "evaluate",
        "productId": "product-07-yard-dock",
        "at": "2026-10-22T14:14:26.502Z",
        "inputRevision": 1,
        "note": "yard: Compatible scenario dock 6 allocated to SCENARIO-TRAILER-01. Seal verification remains an execution task.",
        "payload": {
          "stage": "yard",
          "result": {
            "ok": true,
            "summary": "Compatible scenario dock 6 allocated to SCENARIO-TRAILER-01. Seal verification remains an execution task.",
            "details": {
              "doorId": "DOOR-06",
              "trailerId": "SCENARIO-TRAILER-01",
              "available": true,
              "facilityId": "LOCAL-ORIGIN-01"
            }
          }
        }
      },
      {
        "id": "184fd87d-ab5f-41a8-b171-f89ef05581ee",
        "type": "evaluate",
        "productId": "product-08-carrier-trust",
        "at": "2026-10-22T14:14:29.900Z",
        "inputRevision": 1,
        "note": "carrier: Apex Freight Lines LLC: APPROVED under configured customer policy, using seeded scenario evidence. ",
        "payload": {
          "stage": "carrier",
          "result": {
            "ok": true,
            "summary": "Apex Freight Lines LLC: APPROVED under configured customer policy, using seeded scenario evidence. ",
            "details": {
              "dotNumber": "389211",
              "eligibility": "APPROVED",
              "evidenceSource": "seeded_scenario",
              "expiresAt": "2026-10-22T14:29:29.323Z",
              "blockers": [],
              "warnings": []
            }
          }
        }
      },
      {
        "id": "dfe519c9-2c09-45e6-a3e0-fc0bff77614d",
        "type": "evaluate",
        "productId": "product-03-hos-planner",
        "at": "2026-10-22T14:14:34.821Z",
        "inputRevision": 1,
        "note": "hos: 2.3 modeled transit hours for SCENARIO-DRIVER-01. Full-rest scenario only; no live ELD or appointment guarantee.",
        "payload": {
          "stage": "hos",
          "result": {
            "ok": true,
            "summary": "2.3 modeled transit hours for SCENARIO-DRIVER-01. Full-rest scenario only; no live ELD or appointment guarantee.",
            "details": {
              "driverId": "SCENARIO-DRIVER-01",
              "priorRestHours": 10,
              "ruleScope": "full_rest_only",
              "isLegal": true,
              "totalTransitHours": 2.3,
              "waypoints": [
                {
                  "id": "wp-1",
                  "type": "ORIGIN_PICKUP",
                  "title": "Pre-Trip Inspection & Live Load",
                  "location": "Chicago, IL",
                  "distanceMiles": 0,
                  "cumulativeMiles": 0,
                  "durationMinutes": 15,
                  "cumulativeTimeMinutes": 15,
                  "dutyStatus": "ON_DUTY_NOT_DRIVING",
                  "notes": "Verify commercial equipment, air brake test, bill of lading pickup."
                },
                {
                  "id": "wp-2",
                  "type": "DRIVING_LEG",
                  "title": "Interstate Driving Leg (95 mi)",
                  "location": "Corridor Mile 95",
                  "distanceMiles": 95,
                  "cumulativeMiles": 95,
                  "durationMinutes": 104,
                  "cumulativeTimeMinutes": 119,
                  "dutyStatus": "DRIVING",
                  "notes": "Speed maintained at ~55 MPH. Clocks running."
                },
                {
                  "id": "wp-3",
                  "type": "DESTINATION_DROPOFF",
                  "title": "Consignee Delivery & Post-Trip DVIR",
                  "location": "Milwaukee, WI",
                  "distanceMiles": 0,
                  "cumulativeMiles": 95,
                  "durationMinutes": 20,
                  "cumulativeTimeMinutes": 139,
                  "dutyStatus": "ON_DUTY_NOT_DRIVING",
                  "notes": "Seal verification, dock delivery receipt signature, driver post-trip inspection."
                }
              ],
              "violations": []
            }
          }
        }
      },
      {
        "id": "99a12c98-9ccc-4387-8920-408f995216ac",
        "type": "evaluate",
        "productId": "product-02-freight-pricing",
        "at": "2026-10-22T14:14:39.085Z",
        "inputRevision": 1,
        "note": "quote: USD 287.87 carrier estimate using declared costs and dated diesel input. Publishing accepts these terms for this local scenario only.",
        "payload": {
          "stage": "quote",
          "result": {
            "ok": true,
            "summary": "USD 287.87 carrier estimate using declared costs and dated diesel input. Publishing accepts these terms for this local scenario only.",
            "details": {
              "currency": "USD",
              "lines": [
                {
                  "label": "Linehaul",
                  "cents": 21690
                },
                {
                  "label": "Fuel surcharge",
                  "cents": 7097
                },
                {
                  "label": "Approved scenario accessorials",
                  "cents": 0
                }
              ],
              "totalCents": 28787,
              "accepted": true,
              "profile": {
                "id": "local-scenario",
                "name": "Declared scenario cost profile",
                "annualMilesBenchmark": 100000,
                "truckPaymentMonthly": 2100,
                "trailerPaymentMonthly": 750,
                "insuranceMonthly": 1250,
                "permitsLicensesMonthly": 200,
                "dispatchSoftwareMonthly": 350,
                "driverCpm": 0.68,
                "maintenanceTiresCpm": 0.22,
                "tollsTotal": 0,
                "miscellaneousCpm": 0.05,
                "avgMpgLoaded": 6.8,
                "avgMpgEmpty": 7.5,
                "currentDieselPricePerGallon": 6.276,
                "fscPegBasePricePerGallon": 1.2
              },
              "dieselObservedOn": "2026-10-19",
              "scenarioMargin": {
                "totalShipperInvoice": 287.87,
                "totalCarrierPayable": 287.87,
                "grossMarginAmount": 0,
                "grossMarginPercent": 0,
                "agentCommissionAmount": 0,
                "brokerNetRetained": 0,
                "status": "LOW_MARGIN_WARNING",
                "requiresManagementApproval": true,
                "alertMessage": "LOW MARGIN ALERT: Gross margin of 0% is below the mandatory 12% threshold. Manager sign-off required prior to rate confirmation release."
              }
            }
          }
        }
      },
      {
        "id": "ac03d38e-a983-4e52-9eca-162d24a25d6c",
        "type": "amend",
        "productId": "command-center-portal",
        "at": "2026-10-22T14:14:41.605Z",
        "inputRevision": 2,
        "note": "Shipment inputs amended; earlier planning decisions are retained as stale.",
        "payload": {
          "input": {
            "origin": "Chicago, IL",
            "destination": "Milwaukee, WI",
            "loadedMiles": 95,
            "deadheadMiles": 12,
            "equipmentId": "dry-van-53",
            "carrierDot": "389211",
            "driverId": "SCENARIO-DRIVER-01",
            "tractorId": "SCENARIO-TRACTOR-01",
            "trailerId": "SCENARIO-TRAILER-01",
            "priorRestHours": 10,
            "units": [
              {
                "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                "description": "Machine components pallet",
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 48,
                "weightLbs": 1250,
                "stackable": false,
                "temperatureClass": "ambient"
              },
              {
                "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                "description": "Replacement parts pallet",
                "lengthIn": 48,
                "widthIn": 40,
                "heightIn": 52,
                "weightLbs": 1500,
                "stackable": false,
                "temperatureClass": "ambient"
              }
            ]
          }
        }
      },
      {
        "id": "c2c68f73-d2e5-457b-a7ac-fc23600af1bd",
        "type": "evaluate",
        "productId": "product-04-asset-studio",
        "at": "2026-10-22T14:14:42.846Z",
        "inputRevision": 2,
        "note": "asset: 53' Standard Dry Van (Class 8): declared interior, door and payload snapshot ready.",
        "payload": {
          "stage": "asset",
          "result": {
            "ok": true,
            "summary": "53' Standard Dry Van (Class 8): declared interior, door and payload snapshot ready.",
            "details": {
              "equipmentId": "dry-van-53",
              "name": "53' Standard Dry Van (Class 8)",
              "lengthIn": 630,
              "widthIn": 99.96000000000001,
              "heightIn": 110.03999999999999,
              "doorWidthIn": 98.03999999999999,
              "doorHeightIn": 108,
              "payloadLbs": 45000,
              "loadedMpg": 6.8,
              "source": "Catalog scenario template; actual equipment measurement remains separate"
            }
          }
        }
      },
      {
        "id": "034ce804-aedb-4052-a81c-94ff8447b0b2",
        "type": "evaluate",
        "productId": "product-01-cargo-fit",
        "at": "2026-10-22T14:14:44.716Z",
        "inputRevision": 2,
        "note": "fit: 2/2 handling units placed. Independent geometric checks passed under declared constraints.",
        "payload": {
          "stage": "fit",
          "result": {
            "ok": true,
            "summary": "2/2 handling units placed. Independent geometric checks passed under declared constraints.",
            "details": {
              "geometryFeasible": true,
              "violations": 0,
              "unitIds": [
                "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                "164d2dfd-ce9b-4273-b663-885a67672688-HU-01"
              ],
              "placements": [
                {
                  "unitId": "Replacement parts pallet",
                  "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "label": "Replacement parts pallet",
                  "x": 0,
                  "y": 0,
                  "z": 0,
                  "dx": 1219.2,
                  "dy": 1016,
                  "dz": 1320.8,
                  "order": 1,
                  "stop": 1
                },
                {
                  "unitId": "Machine components pallet",
                  "rowUid": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "label": "Machine components pallet",
                  "x": 0,
                  "y": 1016,
                  "z": 0,
                  "dx": 1219.2,
                  "dy": 1016,
                  "dz": 1219.2,
                  "order": 2,
                  "stop": 1
                }
              ],
              "status": "FEASIBLE_UNDER_MODELED_CONSTRAINTS",
              "solverVersion": "ep-heuristic-1.0",
              "checks": [
                {
                  "id": "bounds",
                  "label": "Inside interior dimensions",
                  "note": "Every box lies within L × W × H of the declared interior.",
                  "state": "verified"
                },
                {
                  "id": "overlap",
                  "label": "No overlapping items",
                  "note": "Pairwise axis-aligned box test by an independent validator.",
                  "state": "verified"
                },
                {
                  "id": "orientation",
                  "label": "Allowed orientations only",
                  "note": "Each item uses an orientation permitted by its rotation rule.",
                  "state": "verified"
                },
                {
                  "id": "support",
                  "label": "Base support & no-stack",
                  "note": "Each raised item rests on surfaces at its exact base height, none marked no-stack.",
                  "state": "verified"
                },
                {
                  "id": "payload",
                  "label": "Declared payload",
                  "state": "verified",
                  "note": "Sum of declared unit weights vs the declared payload figure."
                },
                {
                  "id": "door",
                  "label": "Door opening",
                  "state": "verified",
                  "note": "Each item's cross-section in its placed orientation fits the declared opening. Interior path and handling equipment are NOT modeled."
                },
                {
                  "id": "axle",
                  "label": "Axle / axle-group loads & legal limits",
                  "state": "not_modeled",
                  "note": "Needs vehicle configuration, tare and jurisdiction. Verify with scales and a qualified person."
                },
                {
                  "id": "securement",
                  "label": "Load securement",
                  "state": "not_modeled",
                  "note": "Depends on restraint equipment and applicable rules, not on box geometry."
                },
                {
                  "id": "handling",
                  "label": "Forklift / manual handling access",
                  "state": "not_modeled",
                  "note": "Loading order, aisle and reach are not simulated."
                },
                {
                  "id": "stops",
                  "label": "Multi-stop access order",
                  "state": "not_modeled",
                  "note": "Unload sequence is not modeled."
                },
                {
                  "id": "cog",
                  "label": "Centre of gravity (height & lateral)",
                  "state": "not_modeled",
                  "note": "Longitudinal centroid is shown as information only."
                }
              ],
              "limitation": "No physical scale, restraint or road-legal certification."
            }
          }
        }
      },
      {
        "id": "de14c7f2-3ed4-4415-9b2a-7683a541e5d8",
        "type": "evaluate",
        "productId": "product-06-warehouse-space-flow",
        "at": "2026-10-22T14:14:45.817Z",
        "inputRevision": 2,
        "note": "warehouse: 2/2 identified units have compatible receiving locations.",
        "payload": {
          "stage": "warehouse",
          "result": {
            "ok": true,
            "summary": "2/2 identified units have compatible receiving locations.",
            "details": {
              "facilityId": "LOCAL-RECEIVING-01",
              "assignments": [
                {
                  "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                  "slotId": "R01-B02-L1-A",
                  "slotCode": "R01-B02-L1-A"
                },
                {
                  "unitId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                  "slotId": "R01-B02-L1-B",
                  "slotCode": "R01-B02-L1-B"
                }
              ],
              "recommendations": [
                {
                  "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
                  "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
                  "description": "Machine components pallet",
                  "weightLbs": 1250,
                  "dimensions": {
                    "lengthIn": 48,
                    "widthIn": 40,
                    "heightIn": 48
                  },
                  "environmentalClass": "ambient",
                  "status": "proposed",
                  "targetSlotId": "R01-B02-L1-A",
                  "targetLocationCode": "R01-B02-L1-A",
                  "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
                  "suitabilityScore": 90,
                  "reason": "Optimal high-bay rack storage (Level 1)",
                  "violations": [
                    "Zone does not support AMBIENT classification (requires certified storage)",
                    "Exterior yard slots require intermodal or ISO containerized cargo"
                  ],
                  "alternativeSlotIds": [
                    "R01-B02-L1-B",
                    "R01-B02-L2-A",
                    "R01-B02-L3-B"
                  ]
                },
                {
                  "palletId": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
                  "sku": "SKU-CF-164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
                  "description": "Replacement parts pallet",
                  "weightLbs": 1500,
                  "dimensions": {
                    "lengthIn": 48,
                    "widthIn": 40,
                    "heightIn": 52
                  },
                  "environmentalClass": "ambient",
                  "status": "proposed",
                  "targetSlotId": "R01-B02-L1-B",
                  "targetLocationCode": "R01-B02-L1-B",
                  "targetZoneName": "Selective High-Bay Racks (Aisles R01–R03)",
                  "suitabilityScore": 90,
                  "reason": "Optimal high-bay rack storage (Level 1)",
                  "violations": [
                    "Zone does not support AMBIENT classification (requires certified storage)",
                    "Exterior yard slots require intermodal or ISO containerized cargo"
                  ],
                  "alternativeSlotIds": [
                    "R01-B02-L2-A",
                    "R01-B02-L3-B",
                    "R01-B03-L1-A"
                  ]
                }
              ]
            }
          }
        }
      },
      {
        "id": "7dfac377-8427-4ead-a349-c2f3b73eb2a2",
        "type": "evaluate",
        "productId": "product-07-yard-dock",
        "at": "2026-10-22T14:14:47.137Z",
        "inputRevision": 2,
        "note": "yard: Compatible scenario dock 6 allocated to SCENARIO-TRAILER-01. Seal verification remains an execution task.",
        "payload": {
          "stage": "yard",
          "result": {
            "ok": true,
            "summary": "Compatible scenario dock 6 allocated to SCENARIO-TRAILER-01. Seal verification remains an execution task.",
            "details": {
              "doorId": "DOOR-06",
              "trailerId": "SCENARIO-TRAILER-01",
              "available": true,
              "facilityId": "LOCAL-ORIGIN-01"
            }
          }
        }
      },
      {
        "id": "32631b5b-1cea-4d2b-aa60-03898516a004",
        "type": "evaluate",
        "productId": "product-08-carrier-trust",
        "at": "2026-10-22T14:14:48.832Z",
        "inputRevision": 2,
        "note": "carrier: Apex Freight Lines LLC: APPROVED under configured customer policy, using seeded scenario evidence. ",
        "payload": {
          "stage": "carrier",
          "result": {
            "ok": true,
            "summary": "Apex Freight Lines LLC: APPROVED under configured customer policy, using seeded scenario evidence. ",
            "details": {
              "dotNumber": "389211",
              "eligibility": "APPROVED",
              "evidenceSource": "seeded_scenario",
              "expiresAt": "2026-10-22T14:29:48.071Z",
              "blockers": [],
              "warnings": []
            }
          }
        }
      },
      {
        "id": "9dde0f3b-7c0c-40fc-994f-fc8454f84b68",
        "type": "evaluate",
        "productId": "product-03-hos-planner",
        "at": "2026-10-22T14:14:53.692Z",
        "inputRevision": 2,
        "note": "hos: 2.3 modeled transit hours for SCENARIO-DRIVER-01. Full-rest scenario only; no live ELD or appointment guarantee.",
        "payload": {
          "stage": "hos",
          "result": {
            "ok": true,
            "summary": "2.3 modeled transit hours for SCENARIO-DRIVER-01. Full-rest scenario only; no live ELD or appointment guarantee.",
            "details": {
              "driverId": "SCENARIO-DRIVER-01",
              "priorRestHours": 10,
              "ruleScope": "full_rest_only",
              "isLegal": true,
              "totalTransitHours": 2.3,
              "waypoints": [
                {
                  "id": "wp-1",
                  "type": "ORIGIN_PICKUP",
                  "title": "Pre-Trip Inspection & Live Load",
                  "location": "Chicago, IL",
                  "distanceMiles": 0,
                  "cumulativeMiles": 0,
                  "durationMinutes": 15,
                  "cumulativeTimeMinutes": 15,
                  "dutyStatus": "ON_DUTY_NOT_DRIVING",
                  "notes": "Verify commercial equipment, air brake test, bill of lading pickup."
                },
                {
                  "id": "wp-2",
                  "type": "DRIVING_LEG",
                  "title": "Interstate Driving Leg (95 mi)",
                  "location": "Corridor Mile 95",
                  "distanceMiles": 95,
                  "cumulativeMiles": 95,
                  "durationMinutes": 104,
                  "cumulativeTimeMinutes": 119,
                  "dutyStatus": "DRIVING",
                  "notes": "Speed maintained at ~55 MPH. Clocks running."
                },
                {
                  "id": "wp-3",
                  "type": "DESTINATION_DROPOFF",
                  "title": "Consignee Delivery & Post-Trip DVIR",
                  "location": "Milwaukee, WI",
                  "distanceMiles": 0,
                  "cumulativeMiles": 95,
                  "durationMinutes": 20,
                  "cumulativeTimeMinutes": 139,
                  "dutyStatus": "ON_DUTY_NOT_DRIVING",
                  "notes": "Seal verification, dock delivery receipt signature, driver post-trip inspection."
                }
              ],
              "violations": []
            }
          }
        }
      },
      {
        "id": "02729181-c609-4d06-a248-e842630f8b5e",
        "type": "evaluate",
        "productId": "product-02-freight-pricing",
        "at": "2026-10-22T14:14:55.289Z",
        "inputRevision": 2,
        "note": "quote: USD 287.87 carrier estimate using declared costs and dated diesel input. Publishing accepts these terms for this local scenario only.",
        "payload": {
          "stage": "quote",
          "result": {
            "ok": true,
            "summary": "USD 287.87 carrier estimate using declared costs and dated diesel input. Publishing accepts these terms for this local scenario only.",
            "details": {
              "currency": "USD",
              "lines": [
                {
                  "label": "Linehaul",
                  "cents": 21690
                },
                {
                  "label": "Fuel surcharge",
                  "cents": 7097
                },
                {
                  "label": "Approved scenario accessorials",
                  "cents": 0
                }
              ],
              "totalCents": 28787,
              "accepted": true,
              "profile": {
                "id": "local-scenario",
                "name": "Declared scenario cost profile",
                "annualMilesBenchmark": 100000,
                "truckPaymentMonthly": 2100,
                "trailerPaymentMonthly": 750,
                "insuranceMonthly": 1250,
                "permitsLicensesMonthly": 200,
                "dispatchSoftwareMonthly": 350,
                "driverCpm": 0.68,
                "maintenanceTiresCpm": 0.22,
                "tollsTotal": 0,
                "miscellaneousCpm": 0.05,
                "avgMpgLoaded": 6.8,
                "avgMpgEmpty": 7.5,
                "currentDieselPricePerGallon": 6.276,
                "fscPegBasePricePerGallon": 1.2
              },
              "dieselObservedOn": "2026-10-19",
              "scenarioMargin": {
                "totalShipperInvoice": 287.87,
                "totalCarrierPayable": 287.87,
                "grossMarginAmount": 0,
                "grossMarginPercent": 0,
                "agentCommissionAmount": 0,
                "brokerNetRetained": 0,
                "status": "LOW_MARGIN_WARNING",
                "requiresManagementApproval": true,
                "alertMessage": "LOW MARGIN ALERT: Gross margin of 0% is below the mandatory 12% threshold. Manager sign-off required prior to rate confirmation release."
              }
            }
          }
        }
      },
      {
        "id": "a358f207-fdb2-42a9-ab80-6628d23e93f1",
        "type": "dispatch",
        "productId": "command-center-portal",
        "at": "2026-10-22T14:14:58.118Z",
        "inputRevision": 2,
        "note": "Scenario dispatch approved against current planning decisions.",
        "payload": {}
      },
      {
        "id": "0c24491f-0d8d-4ff0-a71c-aaa5e88cc064",
        "type": "depart",
        "productId": "product-05-fleet-telematics",
        "at": "2026-10-22T14:15:00.562Z",
        "inputRevision": 2,
        "note": "Scenario departure recorded; this is simulated motion evidence.",
        "payload": {
          "tractorId": "SCENARIO-TRACTOR-01"
        }
      },
      {
        "id": "56aef341-dbb8-4122-ad70-9ade849df99f",
        "type": "arrive",
        "productId": "product-05-fleet-telematics",
        "at": "2026-10-22T14:15:00.661Z",
        "inputRevision": 2,
        "note": "Scenario arrival recorded at receiving facility.",
        "payload": {
          "tractorId": "SCENARIO-TRACTOR-01"
        }
      },
      {
        "id": "387bf0f3-d106-4fac-91da-14ea5401b689",
        "type": "exception.open",
        "productId": "product-05-fleet-telematics",
        "at": "2026-10-22T14:15:00.870Z",
        "inputRevision": 2,
        "note": "Scenario receiving delay requires review.",
        "payload": {
          "message": "Scenario receiving delay requires review."
        }
      },
      {
        "id": "c1de0211-ca5b-4230-9362-3ff35c913708",
        "type": "deliver",
        "productId": "product-06-warehouse-space-flow",
        "at": "2026-10-22T14:15:04.298Z",
        "inputRevision": 2,
        "note": "Manually entered scenario receipt confirmed by Local scenario receiver.",
        "payload": {
          "receiver": "Local scenario receiver",
          "units": [
            {
              "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
              "slotCode": "R01-B02-L1-A"
            },
            {
              "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
              "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
              "slotCode": "R01-B02-L1-B"
            }
          ]
        }
      },
      {
        "id": "fdd82deb-304c-4720-803c-d1024694ad70",
        "type": "exception.resolve",
        "productId": "command-center-portal",
        "at": "2026-10-22T14:15:06.825Z",
        "inputRevision": 2,
        "note": "Receiving completed; local scenario delay reviewed with no additional charge.",
        "payload": {
          "id": "06baac40-4f04-41d2-bd3b-c0f2f5a1ae5d",
          "resolution": "Receiving completed; local scenario delay reviewed with no additional charge."
        }
      },
      {
        "id": "196b31bb-a855-4bbd-8017-4b4a66bf70a7",
        "type": "invoice",
        "productId": "command-center-portal",
        "at": "2026-10-22T14:15:07.112Z",
        "inputRevision": 2,
        "note": "Scenario invoice reconciled to accepted quote and receipt; ready for local export, not paid.",
        "payload": {
          "totalCents": 28787
        }
      }
    ],
    "creationOperationId": "0553b090-0acc-46ed-9645-50a021410ef7",
    "delivery": {
      "receiver": "Local scenario receiver",
      "receivedAt": "2026-10-22T14:15:04.298Z",
      "units": [
        {
          "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-01",
          "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-01",
          "slotCode": "R01-B02-L1-A"
        },
        {
          "id": "164d2dfd-ce9b-4273-b663-885a67672688-HU-02",
          "barcode": "164d2dfd-ce9b-4273-b663-885a67672688-02",
          "slotCode": "R01-B02-L1-B"
        }
      ]
    },
    "invoice": {
      "number": "DRAFT-164d2dfd-ce9b-4273-b663-885a67672688",
      "totalCents": 28787,
      "currency": "USD",
      "preparedAt": "2026-10-22T14:15:07.112Z",
      "evidenceEventIds": [
        "9ea1f89f-122e-419b-ab8b-c652c4ae8005",
        "42aea788-f93c-47be-833b-6d2db06d722d",
        "b8b301a7-45b3-4e31-846e-8f3434a09c84",
        "f110f58d-1ea9-4fbf-bec6-fc6925db59d3",
        "bcb0d38c-5a8b-48e7-93be-8e90fce18eb9",
        "184fd87d-ab5f-41a8-b171-f89ef05581ee",
        "dfe519c9-2c09-45e6-a3e0-fc0bff77614d",
        "99a12c98-9ccc-4387-8920-408f995216ac",
        "ac03d38e-a983-4e52-9eca-162d24a25d6c",
        "c2c68f73-d2e5-457b-a7ac-fc23600af1bd",
        "034ce804-aedb-4052-a81c-94ff8447b0b2",
        "de14c7f2-3ed4-4415-9b2a-7683a541e5d8",
        "7dfac377-8427-4ead-a349-c2f3b73eb2a2",
        "32631b5b-1cea-4d2b-aa60-03898516a004",
        "9dde0f3b-7c0c-40fc-994f-fc8454f84b68",
        "02729181-c609-4d06-a248-e842630f8b5e",
        "a358f207-fdb2-42a9-ab80-6628d23e93f1",
        "0c24491f-0d8d-4ff0-a71c-aaa5e88cc064",
        "56aef341-dbb8-4122-ad70-9ade849df99f",
        "387bf0f3-d106-4fac-91da-14ea5401b689",
        "c1de0211-ca5b-4230-9362-3ff35c913708",
        "fdd82deb-304c-4720-803c-d1024694ad70"
      ]
    }
  },
  "vehicles": [
    {
      "id": "dry-van-53",
      "name": "53' Standard Dry Van (Class 8)",
      "code": "DV53",
      "category": "class_8_combination",
      "subtype": "dry_van_53",
      "description": "The backbone of North American freight: tandem-axle 53-foot dry van with sliding bogie for general palletized merchandise.",
      "exterior": {
        "lengthFt": 72,
        "widthFt": 8.5,
        "heightFt": 13.5,
        "wheelbaseIn": 228,
        "groundClearanceIn": 13,
        "turningRadiusFt": 45
      },
      "interior": {
        "lengthFt": 52.5,
        "widthFt": 8.33,
        "heightFt": 9.17,
        "lengthMm": 16002,
        "widthMm": 2540,
        "heightMm": 2794,
        "doorWidthFt": 8.17,
        "doorHeightFt": 9,
        "floorHeightIn": 48
      },
      "weight": {
        "curbWeightLbs": 33500,
        "gvwrLbs": 80000,
        "maxPayloadLbs": 45000,
        "gcwrLbs": 80000
      },
      "volumetric": {
        "cubicFt": 4010,
        "cubicMeters": 113.5,
        "standardGmaPalletFloorCap": 26,
        "doubleStackPalletCap": 52
      },
      "powertrain": {
        "engineType": "Detroit DD15 14.8L Turbo Diesel",
        "horsepower": 505,
        "torqueLbFt": 1750,
        "axles": "6x4",
        "transmission": "DT12 Automated Manual 12-Speed",
        "maxGradeabilityPct": 18,
        "topSpeedMph": 75
      },
      "fuelEnergy": {
        "fuelType": "diesel",
        "capacity": 200,
        "capacityUnit": "gal",
        "loadedMpg": 6.8,
        "emptyMpg": 8.4,
        "loadedRangeMiles": 1360,
        "emptyRangeMiles": 1680,
        "refuelTimeMinutes": 15,
        "co2GramsPerMile": 1480
      },
      "regulatory": {
        "dotClass": "Class 8",
        "bridgeLawAxleLimits": {
          "steerLbs": 12000,
          "driveTandemLbs": 34000,
          "trailerTandemLbs": 34000
        },
        "tempControl": null,
        "tieDownTracks": 4,
        "floorRatingLbsPerSqFt": 650
      }
    },
    {
      "id": "reefer-53",
      "name": "53' Refrigerated Trailer / Reefer",
      "code": "RF53",
      "category": "class_8_combination",
      "subtype": "reefer_53",
      "description": "Thermally insulated trailer with nose-mounted Carrier/Thermo King multi-temp refrigeration unit for food and pharmaceuticals.",
      "exterior": {
        "lengthFt": 73,
        "widthFt": 8.5,
        "heightFt": 13.5,
        "wheelbaseIn": 228,
        "groundClearanceIn": 13,
        "turningRadiusFt": 45
      },
      "interior": {
        "lengthFt": 52,
        "widthFt": 8.12,
        "heightFt": 8.75,
        "lengthMm": 15850,
        "widthMm": 2475,
        "heightMm": 2667,
        "doorWidthFt": 8,
        "doorHeightFt": 8.5,
        "floorHeightIn": 50
      },
      "weight": {
        "curbWeightLbs": 36200,
        "gvwrLbs": 80000,
        "maxPayloadLbs": 43500,
        "gcwrLbs": 80000
      },
      "volumetric": {
        "cubicFt": 3695,
        "cubicMeters": 104.6,
        "standardGmaPalletFloorCap": 26,
        "doubleStackPalletCap": 48
      },
      "powertrain": {
        "engineType": "Cummins X15 15.0L High Output Diesel",
        "horsepower": 565,
        "torqueLbFt": 1850,
        "axles": "6x4",
        "transmission": "Eaton Endurant 12-Speed Automated",
        "maxGradeabilityPct": 19,
        "topSpeedMph": 75
      },
      "fuelEnergy": {
        "fuelType": "diesel",
        "capacity": 250,
        "capacityUnit": "gal",
        "loadedMpg": 6.2,
        "emptyMpg": 7.9,
        "loadedRangeMiles": 1550,
        "emptyRangeMiles": 1975,
        "refuelTimeMinutes": 18,
        "co2GramsPerMile": 1620
      },
      "regulatory": {
        "dotClass": "Class 8",
        "bridgeLawAxleLimits": {
          "steerLbs": 12000,
          "driveTandemLbs": 34000,
          "trailerTandemLbs": 34000
        },
        "tempControl": {
          "minTempF": -20,
          "maxTempF": 75,
          "burnGalPerHour": 0.55
        },
        "tieDownTracks": 4,
        "floorRatingLbsPerSqFt": 600
      }
    },
    {
      "id": "flatbed-48",
      "name": "48' Standard Flatbed Platform",
      "code": "FB48",
      "category": "class_8_combination",
      "subtype": "flatbed_48",
      "description": "Open steel and aluminum deck with winch straps, stake pockets, and DOT headache rack for machinery, steel coils, and lumber.",
      "exterior": {
        "lengthFt": 68,
        "widthFt": 8.5,
        "heightFt": 13,
        "wheelbaseIn": 224,
        "groundClearanceIn": 14,
        "turningRadiusFt": 42
      },
      "interior": {
        "lengthFt": 48,
        "widthFt": 8.5,
        "heightFt": 8.5,
        "lengthMm": 14630,
        "widthMm": 2590,
        "heightMm": 2590,
        "doorWidthFt": 8.5,
        "doorHeightFt": 8.5,
        "floorHeightIn": 60
      },
      "weight": {
        "curbWeightLbs": 31000,
        "gvwrLbs": 80000,
        "maxPayloadLbs": 48000,
        "gcwrLbs": 80000
      },
      "volumetric": {
        "cubicFt": 3468,
        "cubicMeters": 98.2,
        "standardGmaPalletFloorCap": 24,
        "doubleStackPalletCap": 48
      },
      "powertrain": {
        "engineType": "Detroit DD13 12.8L Turbo Diesel",
        "horsepower": 470,
        "torqueLbFt": 1650,
        "axles": "6x4",
        "transmission": "DT12 Automated Manual",
        "maxGradeabilityPct": 18,
        "topSpeedMph": 75
      },
      "fuelEnergy": {
        "fuelType": "diesel",
        "capacity": 200,
        "capacityUnit": "gal",
        "loadedMpg": 6.9,
        "emptyMpg": 8.6,
        "loadedRangeMiles": 1380,
        "emptyRangeMiles": 1720,
        "refuelTimeMinutes": 15,
        "co2GramsPerMile": 1450
      },
      "regulatory": {
        "dotClass": "Class 8",
        "bridgeLawAxleLimits": {
          "steerLbs": 12000,
          "driveTandemLbs": 34000,
          "trailerTandemLbs": 34000
        },
        "tempControl": null,
        "tieDownTracks": 12,
        "floorRatingLbsPerSqFt": 800
      }
    },
    {
      "id": "box-truck-26",
      "name": "26' Box Truck with Hydraulic Liftgate",
      "code": "BX26",
      "category": "straight_truck_class_6_7",
      "subtype": "box_truck_26",
      "description": "Class 7 commercial straight truck with 3,000-lb tuck-away hydraulic liftgate for urban retail and residential freight delivery.",
      "exterior": {
        "lengthFt": 35.5,
        "widthFt": 8.5,
        "heightFt": 12.8,
        "wheelbaseIn": 254,
        "groundClearanceIn": 11,
        "turningRadiusFt": 32
      },
      "interior": {
        "lengthFt": 25.5,
        "widthFt": 8.1,
        "heightFt": 8.5,
        "lengthMm": 7772,
        "widthMm": 2469,
        "heightMm": 2591,
        "doorWidthFt": 7.9,
        "doorHeightFt": 8.1,
        "floorHeightIn": 46
      },
      "weight": {
        "curbWeightLbs": 15800,
        "gvwrLbs": 26000,
        "maxPayloadLbs": 10200,
        "gcwrLbs": 26000
      },
      "volumetric": {
        "cubicFt": 1755,
        "cubicMeters": 49.7,
        "standardGmaPalletFloorCap": 12,
        "doubleStackPalletCap": 24
      },
      "powertrain": {
        "engineType": "Cummins B6.7 6.7L Turbo Diesel",
        "horsepower": 260,
        "torqueLbFt": 660,
        "axles": "4x2",
        "transmission": "Allison 2500 RDS 6-Speed Automatic",
        "maxGradeabilityPct": 15,
        "topSpeedMph": 75
      },
      "fuelEnergy": {
        "fuelType": "diesel",
        "capacity": 70,
        "capacityUnit": "gal",
        "loadedMpg": 9.8,
        "emptyMpg": 12.2,
        "loadedRangeMiles": 686,
        "emptyRangeMiles": 854,
        "refuelTimeMinutes": 8,
        "co2GramsPerMile": 1030
      },
      "regulatory": {
        "dotClass": "Class 6",
        "bridgeLawAxleLimits": {
          "steerLbs": 10000,
          "driveTandemLbs": 19000,
          "trailerTandemLbs": 0
        },
        "tempControl": null,
        "tieDownTracks": 3,
        "floorRatingLbsPerSqFt": 500
      }
    }
  ],
  "carrier": {
    "dotNumber": "389211",
    "mcNumber": "948102",
    "legalName": "Apex Freight Lines LLC",
    "dbaName": "Apex Express",
    "physicalAddress": "100 Logistics Blvd, Suite 400",
    "city": "Joliet",
    "state": "IL",
    "zip": "60436",
    "operatingAuthority": "AUTHORIZED_FOR_HIRE",
    "safetyRating": "SATISFACTORY",
    "safetyRatingDate": "2023-04-12",
    "powerUnitCount": 42,
    "driverCount": 48,
    "mcs150Date": "2024-02-15",
    "basics": [
      {
        "name": "Unsafe Driving",
        "code": "unsafe_driving",
        "percentile": 18,
        "interventionThreshold": 65,
        "exceedsThreshold": false,
        "totalViolations": 3,
        "seriousViolations": 0
      },
      {
        "name": "Crash Indicator",
        "code": "crash_indicator",
        "percentile": 12,
        "interventionThreshold": 65,
        "exceedsThreshold": false,
        "totalViolations": 1,
        "seriousViolations": 0
      },
      {
        "name": "Hours-of-Service",
        "code": "hos_compliance",
        "percentile": 24,
        "interventionThreshold": 65,
        "exceedsThreshold": false,
        "totalViolations": 4,
        "seriousViolations": 0
      },
      {
        "name": "Vehicle Maint.",
        "code": "vehicle_maint",
        "percentile": 32,
        "interventionThreshold": 80,
        "exceedsThreshold": false,
        "totalViolations": 6,
        "seriousViolations": 0
      },
      {
        "name": "Drugs & Alcohol",
        "code": "drugs_alcohol",
        "percentile": 0,
        "interventionThreshold": 80,
        "exceedsThreshold": false,
        "totalViolations": 0,
        "seriousViolations": 0
      },
      {
        "name": "Hazardous Materials",
        "code": "hazmat",
        "percentile": 8,
        "interventionThreshold": 80,
        "exceedsThreshold": false,
        "totalViolations": 1,
        "seriousViolations": 0
      },
      {
        "name": "Driver Fitness",
        "code": "driver_fitness",
        "percentile": 14,
        "interventionThreshold": 80,
        "exceedsThreshold": false,
        "totalViolations": 2,
        "seriousViolations": 0
      }
    ],
    "insurancePolicies": [
      {
        "type": "commercial_auto",
        "producer": "Gallagher Commercial Transportation",
        "underwriter": "Travelers Property Casualty",
        "amBestRating": "A++ (Superior)",
        "policyNumber": "TRAV-CA-9948201",
        "effectiveDate": "2026-01-01",
        "expirationDate": "2027-01-01",
        "coverageLimitUsd": 1000000,
        "requiredMinimumUsd": 1000000,
        "isCompliant": true,
        "daysUntilExpiration": 71
      },
      {
        "type": "motor_truck_cargo",
        "producer": "Gallagher Commercial Transportation",
        "underwriter": "Great American Insurance Co",
        "amBestRating": "A+ (Superior)",
        "policyNumber": "GAIC-CR-4418290",
        "effectiveDate": "2026-01-01",
        "expirationDate": "2027-01-01",
        "coverageLimitUsd": 250000,
        "requiredMinimumUsd": 100000,
        "isCompliant": true,
        "daysUntilExpiration": 71
      },
      {
        "type": "general_liability",
        "producer": "Gallagher Commercial Transportation",
        "underwriter": "Travelers Property Casualty",
        "amBestRating": "A++ (Superior)",
        "policyNumber": "TRAV-GL-8812903",
        "effectiveDate": "2026-01-01",
        "expirationDate": "2027-01-01",
        "coverageLimitUsd": 1000000,
        "requiredMinimumUsd": 1000000,
        "isCompliant": true,
        "daysUntilExpiration": 71
      }
    ],
    "fraudIndicators": {
      "chameleonCarrierRisk": "low",
      "doubleBrokeringRisk": "low",
      "recentOwnershipChange": false,
      "freightGuardReportsCount": 0,
      "unauthorizedContactEmailDomain": false
    },
    "compositeSafetyScore": 100,
    "dispatchEligibility": "APPROVED",
    "blockers": [],
    "warnings": []
  },
  "facility": {
    "id": "FACILITY-DC-04",
    "code": "DC-04",
    "name": "Midwest Logistics Hub & Freight Terminal",
    "address": "4200 Logistics Parkway, Joliet, IL 60436",
    "totalSquareFeet": 125000,
    "clearHeightFt": 36,
    "zones": [
      {
        "id": "ZONE-DOCK",
        "code": "ZD-REC",
        "name": "Receiving Dock Bays",
        "type": "receiving_dock",
        "canvasBounds": {
          "x": 20,
          "y": 15,
          "width": 380,
          "height": 80
        },
        "color": "#0284c7"
      },
      {
        "id": "ZONE-STAGING",
        "code": "ZS-INB",
        "name": "Inbound Ingest Staging",
        "type": "inbound_staging",
        "canvasBounds": {
          "x": 410,
          "y": 15,
          "width": 340,
          "height": 80
        },
        "color": "#eab308"
      },
      {
        "id": "ZONE-RACKS",
        "code": "ZR-AMB",
        "name": "Selective High-Bay Racks (Aisles R01–R03)",
        "type": "high_bay_rack",
        "canvasBounds": {
          "x": 20,
          "y": 110,
          "width": 400,
          "height": 290
        },
        "color": "#6366f1"
      },
      {
        "id": "ZONE-BULK",
        "code": "ZB-FLR",
        "name": "Bulk Floor Storage (Slab-on-Grade)",
        "type": "bulk_floor",
        "canvasBounds": {
          "x": 430,
          "y": 110,
          "width": 330,
          "height": 150
        },
        "color": "#14b8a6"
      },
      {
        "id": "ZONE-COLD",
        "code": "ZC-VAULT",
        "name": "Reefer Cold Vault (34°F Perishables)",
        "type": "cold_vault",
        "canvasBounds": {
          "x": 430,
          "y": 270,
          "width": 330,
          "height": 130
        },
        "temperatureRangeF": {
          "min": 32,
          "max": 38
        },
        "color": "#06b6d4"
      },
      {
        "id": "ZONE-HAZMAT",
        "code": "ZH-CONT",
        "name": "HazMat Spill-Containment Pad",
        "type": "bulk_floor",
        "canvasBounds": {
          "x": 770,
          "y": 110,
          "width": 235,
          "height": 155
        },
        "color": "#f97316"
      },
      {
        "id": "ZONE-YARD",
        "code": "ZY-OVERFLOW",
        "name": "Yard & Intermodal Container Depot",
        "type": "yard_container_storage",
        "canvasBounds": {
          "x": 770,
          "y": 270,
          "width": 235,
          "height": 130
        },
        "color": "#84cc16"
      }
    ]
  },
  "slots": [
    {
      "id": "DOCK-01",
      "code": "D-01",
      "zoneId": "ZONE-DOCK",
      "type": "dock_door",
      "canvasCoords": {
        "x": 30,
        "y": 30,
        "width": 75,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 162
      },
      "maxWeightLbs": 80000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "DOCK-02",
      "code": "D-02",
      "zoneId": "ZONE-DOCK",
      "type": "dock_door",
      "canvasCoords": {
        "x": 120,
        "y": 30,
        "width": 75,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 162
      },
      "maxWeightLbs": 80000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "TRUCK-INBOUND-884"
    },
    {
      "id": "DOCK-03",
      "code": "D-03",
      "zoneId": "ZONE-DOCK",
      "type": "dock_door",
      "canvasCoords": {
        "x": 210,
        "y": 30,
        "width": 75,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 162
      },
      "maxWeightLbs": 80000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "DOCK-04",
      "code": "D-04",
      "zoneId": "ZONE-DOCK",
      "type": "dock_door",
      "canvasCoords": {
        "x": 300,
        "y": 30,
        "width": 75,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 162
      },
      "maxWeightLbs": 80000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "STG-A",
      "code": "STAGING-A",
      "zoneId": "ZONE-STAGING",
      "type": "staging_lane",
      "canvasCoords": {
        "x": 420,
        "y": 30,
        "width": 95,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 360,
        "widthIn": 120,
        "heightIn": 96
      },
      "maxWeightLbs": 45000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "STAGE-BATCH-01"
    },
    {
      "id": "STG-B",
      "code": "STAGING-B",
      "zoneId": "ZONE-STAGING",
      "type": "staging_lane",
      "canvasCoords": {
        "x": 530,
        "y": 30,
        "width": 95,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 360,
        "widthIn": 120,
        "heightIn": 96
      },
      "maxWeightLbs": 45000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "STG-C",
      "code": "STAGING-C",
      "zoneId": "ZONE-STAGING",
      "type": "staging_lane",
      "canvasCoords": {
        "x": 640,
        "y": 30,
        "width": 95,
        "height": 50
      },
      "dimensions": {
        "lengthIn": 360,
        "widthIn": 120,
        "heightIn": 96
      },
      "maxWeightLbs": 45000,
      "allowedClasses": [
        "ambient",
        "chilled",
        "frozen",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B01-L1-A",
      "code": "R01-B01-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B01-L1-A"
    },
    {
      "id": "R01-B01-L1-B",
      "code": "R01-B01-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B01-L2-A",
      "code": "R01-B01-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B01-L2-B",
      "code": "R01-B01-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B01-L3-A",
      "code": "R01-B01-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B01-L3-B",
      "code": "R01-B01-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B01",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B01-L3-B"
    },
    {
      "id": "R01-B02-L1-A",
      "code": "R01-B02-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B02-L1-B",
      "code": "R01-B02-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B02-L2-A",
      "code": "R01-B02-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B02-L2-B",
      "code": "R01-B02-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B02-L2-B"
    },
    {
      "id": "R01-B02-L3-A",
      "code": "R01-B02-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B02-L3-A"
    },
    {
      "id": "R01-B02-L3-B",
      "code": "R01-B02-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B02",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B03-L1-A",
      "code": "R01-B03-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B03-L1-B",
      "code": "R01-B03-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B03-L1-B"
    },
    {
      "id": "R01-B03-L2-A",
      "code": "R01-B03-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B03-L2-A"
    },
    {
      "id": "R01-B03-L2-B",
      "code": "R01-B03-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B03-L3-A",
      "code": "R01-B03-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B03-L3-B",
      "code": "R01-B03-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B03",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B04-L1-A",
      "code": "R01-B04-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B04-L1-A"
    },
    {
      "id": "R01-B04-L1-B",
      "code": "R01-B04-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 130,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R01-B04-L2-A",
      "code": "R01-B04-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B04-L2-B",
      "code": "R01-B04-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 155,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B04-L3-A",
      "code": "R01-B04-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R01-B04-L3-B",
      "code": "R01-B04-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R01",
      "bay": "B04",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 180,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R01-B04-L3-B"
    },
    {
      "id": "R02-B01-L1-A",
      "code": "R02-B01-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B01-L1-A"
    },
    {
      "id": "R02-B01-L1-B",
      "code": "R02-B01-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R02-B01-L2-A",
      "code": "R02-B01-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B01-L2-B",
      "code": "R02-B01-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B01-L3-A",
      "code": "R02-B01-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B01-L3-B",
      "code": "R02-B01-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B01",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B01-L3-B"
    },
    {
      "id": "R02-B02-L1-A",
      "code": "R02-B02-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R02-B02-L1-B",
      "code": "R02-B02-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R02-B02-L2-A",
      "code": "R02-B02-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B02-L2-B",
      "code": "R02-B02-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B02-L2-B"
    },
    {
      "id": "R02-B02-L3-A",
      "code": "R02-B02-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B02-L3-A"
    },
    {
      "id": "R02-B02-L3-B",
      "code": "R02-B02-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B02",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B03-L1-A",
      "code": "R02-B03-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R02-B03-L1-B",
      "code": "R02-B03-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B03-L1-B"
    },
    {
      "id": "R02-B03-L2-A",
      "code": "R02-B03-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B03-L2-A"
    },
    {
      "id": "R02-B03-L2-B",
      "code": "R02-B03-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B03-L3-A",
      "code": "R02-B03-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B03-L3-B",
      "code": "R02-B03-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B03",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B04-L1-A",
      "code": "R02-B04-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B04-L1-A"
    },
    {
      "id": "R02-B04-L1-B",
      "code": "R02-B04-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 220,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R02-B04-L2-A",
      "code": "R02-B04-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B04-L2-B",
      "code": "R02-B04-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 245,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B04-L3-A",
      "code": "R02-B04-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R02-B04-L3-B",
      "code": "R02-B04-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R02",
      "bay": "B04",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 270,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R02-B04-L3-B"
    },
    {
      "id": "R03-B01-L1-A",
      "code": "R03-B01-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B01-L1-A"
    },
    {
      "id": "R03-B01-L1-B",
      "code": "R03-B01-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R03-B01-L2-A",
      "code": "R03-B01-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B01-L2-B",
      "code": "R03-B01-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B01-L3-A",
      "code": "R03-B01-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 30,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B01-L3-B",
      "code": "R03-B01-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B01",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 72,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B01-L3-B"
    },
    {
      "id": "R03-B02-L1-A",
      "code": "R03-B02-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R03-B02-L1-B",
      "code": "R03-B02-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R03-B02-L2-A",
      "code": "R03-B02-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B02-L2-B",
      "code": "R03-B02-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B02-L2-B"
    },
    {
      "id": "R03-B02-L3-A",
      "code": "R03-B02-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 125,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B02-L3-A"
    },
    {
      "id": "R03-B02-L3-B",
      "code": "R03-B02-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B02",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 167,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B03-L1-A",
      "code": "R03-B03-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R03-B03-L1-B",
      "code": "R03-B03-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B03-L1-B"
    },
    {
      "id": "R03-B03-L2-A",
      "code": "R03-B03-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B03-L2-A"
    },
    {
      "id": "R03-B03-L2-B",
      "code": "R03-B03-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B03-L3-A",
      "code": "R03-B03-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 220,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B03-L3-B",
      "code": "R03-B03-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B03",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 262,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B04-L1-A",
      "code": "R03-B04-L1-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 1,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B04-L1-A"
    },
    {
      "id": "R03-B04-L1-B",
      "code": "R03-B04-L1-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 1,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 310,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2800,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "R03-B04-L2-A",
      "code": "R03-B04-L2-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 2,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B04-L2-B",
      "code": "R03-B04-L2-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 2,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 335,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 68
      },
      "maxWeightLbs": 2500,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B04-L3-A",
      "code": "R03-B04-L3-A",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 3,
      "position": "A",
      "canvasCoords": {
        "x": 315,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "available"
    },
    {
      "id": "R03-B04-L3-B",
      "code": "R03-B04-L3-B",
      "zoneId": "ZONE-RACKS",
      "type": "rack_bin",
      "aisle": "R03",
      "bay": "B04",
      "level": 3,
      "position": "B",
      "canvasCoords": {
        "x": 357,
        "y": 360,
        "width": 38,
        "height": 20
      },
      "dimensions": {
        "lengthIn": 48,
        "widthIn": 40,
        "heightIn": 76
      },
      "maxWeightLbs": 2000,
      "bayMaxWeightLbs": 6000,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": false,
      "status": "occupied",
      "currentOccupantId": "PRE-STOCK-R03-B04-L3-B"
    },
    {
      "id": "BLK-01",
      "code": "BULK-01",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 440,
        "y": 130,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-HEAVY-PRESS-01"
    },
    {
      "id": "BLK-02",
      "code": "BULK-02",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 545,
        "y": 130,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "BLK-03",
      "code": "BULK-03",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 650,
        "y": 130,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "BLK-04",
      "code": "BULK-04",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 440,
        "y": 195,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "BLK-05",
      "code": "BULK-05",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 545,
        "y": 195,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "BLK-06",
      "code": "BULK-06",
      "zoneId": "ZONE-BULK",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 650,
        "y": 195,
        "width": 95,
        "height": 55
      },
      "dimensions": {
        "lengthIn": 96,
        "widthIn": 96,
        "heightIn": 180
      },
      "maxWeightLbs": 8500,
      "allowedClasses": [
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "COLD-01",
      "code": "COLD-01",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 440,
        "y": 285,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "COLD-02",
      "code": "COLD-02",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 545,
        "y": 285,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-DAIRY-PALLET"
    },
    {
      "id": "COLD-03",
      "code": "COLD-03",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 650,
        "y": 285,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "COLD-04",
      "code": "COLD-04",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 440,
        "y": 340,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "COLD-05",
      "code": "COLD-05",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 545,
        "y": 340,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "COLD-06",
      "code": "COLD-06",
      "zoneId": "ZONE-COLD",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 650,
        "y": 340,
        "width": 95,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 54,
        "widthIn": 48,
        "heightIn": 84
      },
      "maxWeightLbs": 3500,
      "allowedClasses": [
        "chilled",
        "frozen"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "HAZ-01",
      "code": "HAZ-01",
      "zoneId": "ZONE-HAZMAT",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 780,
        "y": 130,
        "width": 100,
        "height": 60
      },
      "dimensions": {
        "lengthIn": 60,
        "widthIn": 60,
        "heightIn": 96
      },
      "maxWeightLbs": 4500,
      "allowedClasses": [
        "hazmat",
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "PRE-CHEM-DRUM-PALLET"
    },
    {
      "id": "HAZ-02",
      "code": "HAZ-02",
      "zoneId": "ZONE-HAZMAT",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 890,
        "y": 130,
        "width": 100,
        "height": 60
      },
      "dimensions": {
        "lengthIn": 60,
        "widthIn": 60,
        "heightIn": 96
      },
      "maxWeightLbs": 4500,
      "allowedClasses": [
        "hazmat",
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "HAZ-03",
      "code": "HAZ-03",
      "zoneId": "ZONE-HAZMAT",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 780,
        "y": 200,
        "width": 100,
        "height": 60
      },
      "dimensions": {
        "lengthIn": 60,
        "widthIn": 60,
        "heightIn": 96
      },
      "maxWeightLbs": 4500,
      "allowedClasses": [
        "hazmat",
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "HAZ-04",
      "code": "HAZ-04",
      "zoneId": "ZONE-HAZMAT",
      "type": "floor_bulk",
      "canvasCoords": {
        "x": 890,
        "y": 200,
        "width": 100,
        "height": 60
      },
      "dimensions": {
        "lengthIn": 60,
        "widthIn": 60,
        "heightIn": 96
      },
      "maxWeightLbs": 4500,
      "allowedClasses": [
        "hazmat",
        "ambient"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "YARD-01",
      "code": "Y-01",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 780,
        "y": 285,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "YARD-02",
      "code": "Y-02",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 890,
        "y": 285,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "occupied",
      "currentOccupantId": "CONTAINER-MSKU-910284"
    },
    {
      "id": "YARD-03",
      "code": "Y-03",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 780,
        "y": 340,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "YARD-04",
      "code": "Y-04",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 890,
        "y": 340,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "YARD-05",
      "code": "Y-05",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 780,
        "y": 395,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    },
    {
      "id": "YARD-06",
      "code": "Y-06",
      "zoneId": "ZONE-YARD",
      "type": "yard_slot",
      "canvasCoords": {
        "x": 890,
        "y": 395,
        "width": 100,
        "height": 48
      },
      "dimensions": {
        "lengthIn": 636,
        "widthIn": 102,
        "heightIn": 114
      },
      "maxWeightLbs": 65000,
      "allowedClasses": [
        "ambient",
        "hazmat"
      ],
      "groundOnlyAllowed": true,
      "status": "available"
    }
  ],
  "yard": {
    "doors": [
      {
        "doorId": "DOOR-01",
        "doorNumber": 1,
        "type": "REEFER",
        "status": "OCCUPIED",
        "assignedTrailerId": "TR-7701",
        "currentPalletCount": 26,
        "estimatedClearMinutes": 25
      },
      {
        "doorId": "DOOR-02",
        "doorNumber": 2,
        "type": "REEFER",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-03",
        "doorNumber": 3,
        "type": "REEFER",
        "status": "RESERVED",
        "estimatedClearMinutes": 45
      },
      {
        "doorId": "DOOR-04",
        "doorNumber": 4,
        "type": "REEFER",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-05",
        "doorNumber": 5,
        "type": "DRY_VAN",
        "status": "OCCUPIED",
        "assignedTrailerId": "TR-8842",
        "currentPalletCount": 30,
        "estimatedClearMinutes": 15
      },
      {
        "doorId": "DOOR-06",
        "doorNumber": 6,
        "type": "DRY_VAN",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-07",
        "doorNumber": 7,
        "type": "DRY_VAN",
        "status": "OCCUPIED",
        "assignedTrailerId": "TR-9104",
        "currentPalletCount": 24,
        "estimatedClearMinutes": 40
      },
      {
        "doorId": "DOOR-08",
        "doorNumber": 8,
        "type": "DRY_VAN",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-09",
        "doorNumber": 9,
        "type": "DRY_VAN",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-10",
        "doorNumber": 10,
        "type": "DRY_VAN",
        "status": "MAINTENANCE",
        "estimatedClearMinutes": 180
      },
      {
        "doorId": "DOOR-11",
        "doorNumber": 11,
        "type": "FLATBED",
        "status": "AVAILABLE",
        "estimatedClearMinutes": 0
      },
      {
        "doorId": "DOOR-12",
        "doorNumber": 12,
        "type": "FLATBED",
        "status": "OCCUPIED",
        "assignedTrailerId": "TR-4409",
        "currentPalletCount": 18,
        "estimatedClearMinutes": 30
      }
    ],
    "spots": [
      {
        "spotId": "SPOT-A01",
        "spotNumber": "A-01",
        "zone": "DROP_LOT_A",
        "status": "OCCUPIED",
        "trailerId": "TR-6112"
      },
      {
        "spotId": "SPOT-A02",
        "spotNumber": "A-02",
        "zone": "DROP_LOT_A",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-A03",
        "spotNumber": "A-03",
        "zone": "DROP_LOT_A",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-A04",
        "spotNumber": "A-04",
        "zone": "DROP_LOT_A",
        "status": "OCCUPIED",
        "trailerId": "TR-5531"
      },
      {
        "spotId": "SPOT-B01",
        "spotNumber": "B-01",
        "zone": "DROP_LOT_B",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-B02",
        "spotNumber": "B-02",
        "zone": "DROP_LOT_B",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-B03",
        "spotNumber": "B-03",
        "zone": "DROP_LOT_B",
        "status": "OCCUPIED",
        "trailerId": "TR-7720"
      },
      {
        "spotId": "SPOT-B04",
        "spotNumber": "B-04",
        "zone": "DROP_LOT_B",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-S01",
        "spotNumber": "STG-1",
        "zone": "STAGING",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-S02",
        "spotNumber": "STG-2",
        "zone": "STAGING",
        "status": "OCCUPIED",
        "trailerId": "TR-9903"
      },
      {
        "spotId": "SPOT-INS",
        "spotNumber": "INSP-1",
        "zone": "INSPECTION",
        "status": "EMPTY"
      },
      {
        "spotId": "SPOT-OUT",
        "spotNumber": "OUT-01",
        "zone": "OUTBOUND_READY",
        "status": "OCCUPIED",
        "trailerId": "TR-1029"
      }
    ],
    "trailers": [
      {
        "trailerId": "TR-7701",
        "trailerNumber": "TLR-7701-RF",
        "carrierName": "Polar Express Logistics LLC",
        "carrierDot": "3194012",
        "type": "REEFER",
        "cargoStatus": "UNLOADING",
        "sealNumber": "SEAL-994182",
        "isSealIntact": true,
        "tempSetpointF": -10,
        "currentTempF": -9.8,
        "currentLocation": {
          "type": "DOCK_DOOR",
          "locationId": "DOOR-01"
        }
      },
      {
        "trailerId": "TR-8842",
        "trailerNumber": "TLR-8842-DV",
        "carrierName": "Keystone Logistics Transport Inc",
        "carrierDot": "2981440",
        "type": "DRY_VAN",
        "cargoStatus": "UNLOADING",
        "sealNumber": "SEAL-710245",
        "isSealIntact": true,
        "currentLocation": {
          "type": "DOCK_DOOR",
          "locationId": "DOOR-05"
        }
      },
      {
        "trailerId": "TR-6112",
        "trailerNumber": "TLR-6112-DV",
        "carrierName": "Apex Freight Lines Corp",
        "carrierDot": "1849201",
        "type": "DRY_VAN",
        "cargoStatus": "LOADED_INBOUND",
        "sealNumber": "SEAL-883011",
        "isSealIntact": true,
        "currentLocation": {
          "type": "YARD_SPOT",
          "locationId": "SPOT-A01"
        }
      }
    ],
    "appointments": [
      {
        "appointmentId": "APT-1001",
        "confirmationNumber": "CNF-89021",
        "carrierName": "Apex Freight Lines Corp",
        "carrierDot": "1849201",
        "scheduledTime": "2026-10-22T15:07:08.102Z",
        "doorTypeRequired": "DRY_VAN",
        "poNumbers": [
          "PO-88201",
          "PO-88202"
        ],
        "palletCount": 26,
        "status": "CHECKED_IN",
        "assignedDoorNumber": 6
      },
      {
        "appointmentId": "APT-1002",
        "confirmationNumber": "CNF-91044",
        "carrierName": "Polar Express Logistics LLC",
        "carrierDot": "3194012",
        "scheduledTime": "2026-10-22T16:22:08.159Z",
        "doorTypeRequired": "REEFER",
        "poNumbers": [
          "PO-90411"
        ],
        "palletCount": 24,
        "status": "SCHEDULED",
        "assignedDoorNumber": 2
      },
      {
        "appointmentId": "APT-1003",
        "confirmationNumber": "CNF-77409",
        "carrierName": "Horizon Transport Services",
        "carrierDot": "3419082",
        "scheduledTime": "2026-10-22T17:37:08.159Z",
        "doorTypeRequired": "DRY_VAN",
        "poNumbers": [
          "PO-99120"
        ],
        "palletCount": 28,
        "status": "SCHEDULED"
      }
    ],
    "tasks": [
      {
        "orderId": "JCK-201",
        "orderNumber": "WO-801",
        "trailerNumber": "TLR-6112-DV",
        "sourceLocation": "Drop Lot A-01",
        "targetLocation": "Dock Door #6",
        "priority": "URGENT",
        "status": "PENDING",
        "createdAt": "2026-10-22T15:27:08.159Z"
      },
      {
        "orderId": "JCK-202",
        "orderNumber": "WO-802",
        "trailerNumber": "TLR-1029-DV",
        "sourceLocation": "Dock Door #9",
        "targetLocation": "Outbound Ready 01",
        "priority": "STANDARD",
        "status": "IN_PROGRESS",
        "assignedHostler": "Hostler Unit 03 (Mike R.)",
        "createdAt": "2026-10-22T15:12:08.159Z"
      }
    ]
  },
  "quote": {
    "lane": {
      "originCity": "Chicago",
      "originState": "IL",
      "destCity": "Milwaukee",
      "destState": "WI",
      "loadedMiles": 95,
      "deadheadMiles": 12,
      "equipmentCategory": "dry_van"
    },
    "totalMiles": 107,
    "deadheadRatioPct": 11,
    "fixedEquipmentCost": 59.71,
    "driverLaborCost": 72.76,
    "maintenanceTiresCost": 23.54,
    "netFuelCost": 97.72,
    "tollsAndPassThroughs": 5.35,
    "totalOperatingCost": 259.08,
    "fuelSurchargePerMile": 0.747,
    "totalFuelSurcharge": 70.97,
    "totalAccessorials": 0,
    "accessorialItems": [],
    "breakevenRateTotal": 259.08,
    "breakevenRatePerMile": 2.73,
    "targetOperatingRatio": 0.9,
    "recommendedLinehaulRate": 216.9,
    "recommendedTotalRate": 287.87,
    "recommendedRatePerMile": 3.03,
    "allInRatePerMile": 2.69,
    "projectedProfit": 28.79,
    "projectedMarginPct": 10,
    "marginBearingRevenue": 287.87,
    "targetMarginPct": 10,
    "costWaterfall": [
      {
        "category": "Driver Labor",
        "amount": 72.76,
        "ratePerMile": 0.77,
        "pctOfTotal": 25.3
      },
      {
        "category": "Diesel Fuel Expense",
        "amount": 97.72,
        "ratePerMile": 1.03,
        "pctOfTotal": 33.9
      },
      {
        "category": "Equipment Fixed Amortization",
        "amount": 59.71,
        "ratePerMile": 0.63,
        "pctOfTotal": 20.7
      },
      {
        "category": "Maintenance & Tires",
        "amount": 23.54,
        "ratePerMile": 0.25,
        "pctOfTotal": 8.2
      },
      {
        "category": "Tolls & Misc",
        "amount": 5.35,
        "ratePerMile": 0.06,
        "pctOfTotal": 1.9
      },
      {
        "category": "Carrier Operating Profit",
        "amount": 28.79,
        "ratePerMile": 0.3,
        "pctOfTotal": 10
      }
    ],
    "pricingSignals": [
      "Elevated diesel index ($6.28/gal): Recommend breaking out FSC ($0.75/mi) to protect margin against weekly volatility.",
      "Breakeven rate floor: $2.73/mi ($259.08). Any spot bid below this generates net operating loss."
    ]
  },
  "provenance": {
    "referencePath": "docs/audits/visual-evidence/2026-10-22-shipment-flow/invoice-evidence-export.json",
    "sources": {
      "docs/audits/visual-evidence/2026-10-22-shipment-flow/invoice-evidence-export.json": "08ec794f96afe8f6182e464d9a06736124230d2bcbfb9d76934f096078437825",
      "products/product-04-asset-studio/src/engine/catalog.ts": "f2c95f0509a36d9347f3016ca8ff9ad24cef16890a24b498c76b99e9ffd00941",
      "products/product-08-carrier-trust/src/engine/carriers.ts": "624ce61494962e632224f65f4045b2a43105f8c26e36960d0321415067fbc86c",
      "products/product-08-carrier-trust/src/engine/scoring.ts": "d5da17f8426916321b7fba991ccbe4fc999481741a2f5d3192835c160d378060",
      "products/product-06-warehouse-space-flow/src/engine/spatialModel.ts": "78d87c655ea6c39b75b684c4a9129c5bfe094b3886901e72e2cf283aff13f0be",
      "products/product-07-yard-dock/src/engine/yardEngine.ts": "7258e37ae9f834bd837466020165a7f151d009dbf6fc5b92f2086446f0eceefc",
      "products/product-02-freight-pricing/src/engine/quote.ts": "9befc8a3797bc2e9d7f2419cd90df3073893f0a379bda4a940be28a3dac309c5",
      "products/product-02-freight-pricing/src/engine/costs.ts": "4c807679786d38813edcc3f25665a3ae7e7ba68deaf48514158ca32db914fcaa",
      "products/product-02-freight-pricing/src/engine/fuel.ts": "aabcd753ba11c5ba781211605ed5f74053405227fd08118e742742e366c53fa6",
      "products/product-02-freight-pricing/src/engine/accessorials.ts": "3f6040e258cad18ffb583a2a34b004dc5af63ab8d712f5e8447a1569b5c79696"
    },
    "notice": "Saved scenario and seeded templates. These are not live records; current visual study state is independent of the completed reference shipment."
  }
};
