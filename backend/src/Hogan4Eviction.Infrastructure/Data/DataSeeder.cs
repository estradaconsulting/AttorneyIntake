using Hogan4Eviction.Core.Enums;
using Hogan4Eviction.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Hogan4Eviction.Infrastructure.Data;

/// <summary>
/// Seeds realistic sample cases into the InMemory database for dev/demo purposes.
/// Only runs when Database:Provider=InMemory AND no cases exist yet.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        if (!db.Database.IsInMemory()) return;
        if (await db.IntakeCases.AnyAsync()) return;

        logger.LogInformation("[DataSeeder] Seeding sample cases for dev/demo...");

        var now = DateTime.UtcNow;

        var cases = new List<IntakeCase>
        {
            CreateCase(now, 1, "A3F2", CaseStatus.Submitted, 3, 2, "Margaret Delacroix",
                "4820 Winding Creek Blvd, Sacramento, CA 95821", "(916) 555-0182", "mdelacroix@gmail.com",
                new[] { OwnerType.Individual },
                "1142 Oak Park Way, Unit 4, Sacramento, CA 95815", PropertyLocation.Sacramento, 1850m,
                new[] { "Carlos Espinoza", "Diana Espinoza" }, hasWrittenAgreement: true, isMonthToMonth: true,
                evictionCause: CreateEviction("3-Day Pay or Quit", 3700m, true, true, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease_espinoza.pdf", 184320, now.AddDays(-3)),
                    CreateDocument(DocumentType.NoticeToTenant, "3day_notice_signed.pdf", 92160, now.AddDays(-3)),
                }),

            CreateCase(now, 2, "B71C", CaseStatus.UnderReview, 8, 3, "Pinnacle Properties LLC",
                "3300 Truxel Rd, Suite 200, Sacramento, CA 95833", "(916) 555-0244", "admin@pinnacleprops.com",
                new[] { OwnerType.LlcWithoutCorporateMember },
                "887 Watt Ave, Sacramento, CA 95864", PropertyLocation.Sacramento, 2200m,
                new[] { "Brianna Hollingsworth" }, hasWrittenAgreement: true, isTermLease: true,
                manager: CreateManager("Steve Fontaine", "Pinnacle Properties LLC", "(916) 555-0245", "sfontaine@pinnacleprops.com"),
                evictionCause: CreateEviction("3-Day Notice to Quit - Incurable Breach", null, true, true, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease_hollingsworth.pdf", 204800, now.AddDays(-8)),
                    CreateDocument(DocumentType.NoticeToTenant, "quit_notice.pdf", 77824, now.AddDays(-8)),
                    CreateDocument(DocumentType.ProofOfService, "proof_of_service.pdf", 55296, now.AddDays(-7)),
                }),

            CreateCase(now, 3, "C4D9", CaseStatus.PendingDocuments, 5, 0, "Robert and Linda Chen",
                null, "(916) 555-0391", "rlchen@outlook.com",
                new[] { OwnerType.Individual },
                "5501 Folsom Blvd, Unit 12, Sacramento, CA 95819", PropertyLocation.ElkGroveRosevileFolsom, 1650m,
                new[] { "Marcus Webb" }, isVerbalOnly: true, isMonthToMonth: true),

            CreateCase(now, 4, "E82B", CaseStatus.Active, 14, 2, "Sunset Ridge Investments LLC",
                "1000 G St, Suite 800, Sacramento, CA 95814", "(916) 555-0412", "legal@sunsetridgeinv.com",
                new[] { OwnerType.LlcWithCorporateMember },
                "2240 Del Paso Blvd, Sacramento, CA 95815", PropertyLocation.Sacramento, 1425m,
                new[] { "Angela Tran", "Minh Tran", "Tommy Tran" }, hasWrittenAgreement: true, isMonthToMonth: true,
                evictionCause: CreateEviction(null, null, false, true, true),
                noticeRequest: CreateNotice(NoticeType.ThreeDayPayOrQuit, "2240 Del Paso Blvd, Sacramento, CA 95815", 1425m, 4275m,
                    "Check or money order", "Sunset Ridge Investments LLC", "1000 G St, Suite 800, Sacramento, CA 95814", true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease_tran.pdf", 196608, now.AddDays(-14)),
                    CreateDocument(DocumentType.RentIncreaseNotice, "rent_increase_2024.pdf", 40960, now.AddDays(-13)),
                }),

            CreateCase(now, 5, "F19A", CaseStatus.FiledWithCourt, 30, 3, "Patricia Moorhead",
                null, "(916) 555-0503", "pmoorhead@yahoo.com",
                new[] { OwnerType.Individual },
                "7720 Fair Oaks Blvd, Carmichael, CA 95608", PropertyLocation.Sacramento, 1800m,
                new[] { "Jerome Williams" }, hasWrittenAgreement: true, isTermLease: true,
                ourFileNumber: "UD-2026-00412",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease.pdf", 163840, now.AddDays(-30)),
                    CreateDocument(DocumentType.NoticeToTenant, "30day_notice.pdf", 81920, now.AddDays(-30)),
                    CreateDocument(DocumentType.ProofOfService, "pos_certified.pdf", 61440, now.AddDays(-28)),
                }),

            CreateCase(now, 6, "2D45", CaseStatus.HearingScheduled, 45, 4, "Golden Valley Family Trust",
                null, "(916) 555-0618", "goldenvalleytrust@gmail.com",
                new[] { OwnerType.FamilyTrust },
                "3310 Marconi Ave, Unit B, Sacramento, CA 95821", PropertyLocation.Sacramento, 2100m,
                new[] { "Denise Holloway", "Kevin Holloway" }, hasWrittenAgreement: true, isMonthToMonth: true,
                isSection8OrSubsidy: true, trusteeName: "Howard and Susan Park", ourFileNumber: "UD-2026-00388",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease_holloway.pdf", 221184, now.AddDays(-45)),
                    CreateDocument(DocumentType.NoticeToTenant, "30day_section8.pdf", 94208, now.AddDays(-45)),
                    CreateDocument(DocumentType.ProofOfService, "proof_service.pdf", 57344, now.AddDays(-43)),
                    CreateDocument(DocumentType.Other, "housing_auth_ltr.pdf", 36864, now.AddDays(-40)),
                }),

            CreateCase(now, 7, "9E3C", CaseStatus.ConsultationRequired, 2, 1, "Meridian Commercial Partners",
                "2100 Capitol Ave, Sacramento, CA 95816", "(916) 555-0701", "ops@meridiancp.com",
                new[] { OwnerType.Corporation },
                "1540 J St, Suite 110, Sacramento, CA 95814", PropertyLocation.Sacramento, 5800m,
                new[] { "Blue Sky Salon LLC" }, hasWrittenAgreement: true, isTermLease: true, isCommercial: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "commercial_lease.pdf", 409600, now.AddDays(-2)),
                }),

            CreateCase(now, 8, "7A1F", CaseStatus.Draft, 0, 0, "Sandra Okonkwo",
                null, "(916) 555-0822", "sokonkwo@gmail.com",
                new[] { OwnerType.Individual },
                "6641 Hazel Ave, Orangevale, CA 95662", PropertyLocation.ElkGroveRosevileFolsom, 1975m,
                new[] { "Tyler Benson" }, hasWrittenAgreement: true, isMonthToMonth: true, submitted: false),

            CreateCase(now, 9, "D50E", CaseStatus.Closed, 90, 3, "Valley View Rentals LLC",
                null, "(916) 555-0933", "info@valleyviewrentals.com",
                new[] { OwnerType.LlcWithoutCorporateMember },
                "900 Exposition Blvd, Unit 22, Sacramento, CA 95815", PropertyLocation.Sacramento, 1550m,
                new[] { "Guadalupe Reyes" }, hasWrittenAgreement: true, isMonthToMonth: true,
                ourFileNumber: "UD-2025-04821",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "lease.pdf", 172032, now.AddDays(-90)),
                    CreateDocument(DocumentType.NoticeToTenant, "3day_pay.pdf", 86016, now.AddDays(-90)),
                    CreateDocument(DocumentType.ProofOfService, "pos.pdf", 53248, now.AddDays(-88)),
                }),

            CreateCase(now, 10, "6B8D", CaseStatus.Submitted, 1, 1, "First Pacific Bank, N.A. (REO Dept.)",
                "400 Capitol Mall, Sacramento, CA 95814", "(916) 555-1020", "reo@firstpacificbank.com",
                new[] { OwnerType.Corporation },
                "4455 Norwood Ave, Sacramento, CA 95838", PropertyLocation.Sacramento, 1700m,
                new[] { "Raymond Castillo" }, noAgreement: true, isForeclosure: true,
                evictionCause: CreateEviction(null, null, false, false, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.TrusteesDeed, "trustees_deed.pdf", 131072, now.AddDays(-1)),
                }),

            CreateCase(now, 11, "81AE", CaseStatus.Submitted, 6, 2, "Harbor Rock Holdings",
                "915 Howe Ave, Sacramento, CA 95825", "(916) 555-1104", "cases@harborrock.com",
                new[] { OwnerType.Partnership },
                "1768 Bell St, Sacramento, CA 95825", PropertyLocation.Sacramento, 1895m,
                new[] { "Megan Foster", "Ian Foster" }, hasWrittenAgreement: true, isMonthToMonth: true,
                evictionCause: CreateEviction("3-Day Pay or Quit", 1895m, true, true, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "foster_lease.pdf", 188000, now.AddDays(-6)),
                    CreateDocument(DocumentType.NoticeToTenant, "foster_3day.pdf", 80124, now.AddDays(-6)),
                }),

            CreateCase(now, 12, "4C90", CaseStatus.PendingDocuments, 4, 1, "Teresa and Mark Hollowell",
                "7812 Sunrise Blvd, Citrus Heights, CA 95610", "(916) 555-1236", "hollowellfamily@yahoo.com",
                new[] { OwnerType.Individual },
                "2911 Routier Rd, Sacramento, CA 95827", PropertyLocation.Sacramento, 1725m,
                new[] { "Claudia Mendez" }, hasWrittenAgreement: true, isMonthToMonth: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.NoticeToTenant, "notice_only.pdf", 65000, now.AddDays(-4)),
                }),

            CreateCase(now, 13, "AA27", CaseStatus.UnderReview, 10, 3, "Juniper Oaks REIT",
                "500 University Ave, Sacramento, CA 95825", "(916) 555-1350", "litigation@juniperoaksreit.com",
                new[] { OwnerType.RealEstateInvestmentTrust },
                "1407 K St, Unit 5, Sacramento, CA 95814", PropertyLocation.Sacramento, 2350m,
                new[] { "Natalie Brewer" }, hasWrittenAgreement: true, isTermLease: true,
                trusteeName: "Juniper Asset Services",
                manager: CreateManager("Holly Graves", "Juniper Oaks REIT", "(916) 555-1351", "hgraves@juniperoaksreit.com"),
                evictionCause: CreateEviction("60-Day Termination", null, true, true, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "brewer_lease.pdf", 210000, now.AddDays(-10)),
                    CreateDocument(DocumentType.NoticeToTenant, "60day_notice.pdf", 95000, now.AddDays(-10)),
                    CreateDocument(DocumentType.ProofOfService, "60day_pos.pdf", 42000, now.AddDays(-9)),
                }),

            CreateCase(now, 14, "5D64", CaseStatus.Active, 18, 4, "Northfield Residential Group",
                "1020 12th St, Sacramento, CA 95814", "(916) 555-1490", "admin@northfieldres.com",
                new[] { OwnerType.Corporation },
                "4128 Norwood Ave, Unit 8, Sacramento, CA 95838", PropertyLocation.Sacramento, 1495m,
                new[] { "Shawn Butler" }, hasWrittenAgreement: true, isMonthToMonth: true,
                evictionCause: CreateEviction("3-Day Pay or Quit", 2990m, true, true, true),
                noticeRequest: CreateNotice(NoticeType.ThreeDayPayOrQuit, "4128 Norwood Ave, Unit 8, Sacramento, CA 95838", 1495m, 2990m,
                    "Cashier's check", "Northfield Residential Group", "1020 12th St, Sacramento, CA 95814", true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "butler_lease.pdf", 176000, now.AddDays(-18)),
                    CreateDocument(DocumentType.NoticeToTenant, "draft_notice.pdf", 72000, now.AddDays(-17)),
                    CreateDocument(DocumentType.Other, "tenant_ledger.xlsx", 28000, now.AddDays(-17)),
                    CreateDocument(DocumentType.Other, "sms_log.pdf", 24000, now.AddDays(-16)),
                }),

            CreateCase(now, 15, "C82F", CaseStatus.FiledWithCourt, 22, 4, "Lakeside Property Ventures LLC",
                "801 Alhambra Blvd, Sacramento, CA 95816", "(916) 555-1507", "legal@lakesideventures.com",
                new[] { OwnerType.LlcWithCorporateMember },
                "6193 66th Ave, Sacramento, CA 95823", PropertyLocation.Sacramento, 2125m,
                new[] { "Lauren Jimenez", "Avery Jimenez" }, hasWrittenAgreement: true, isTermLease: true,
                ourFileNumber: "UD-2026-00449",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "jimenez_lease.pdf", 200500, now.AddDays(-22)),
                    CreateDocument(DocumentType.NoticeToTenant, "sixty_day_notice.pdf", 84120, now.AddDays(-22)),
                    CreateDocument(DocumentType.ProofOfService, "service_packet.pdf", 66420, now.AddDays(-21)),
                    CreateDocument(DocumentType.Other, "court_filing.pdf", 112430, now.AddDays(-19)),
                }),

            CreateCase(now, 16, "193B", CaseStatus.Submitted, 7, 2, "Crescent Family Trust",
                "771 University Ave, Sacramento, CA 95825", "(916) 555-1678", "crescenttrust@protonmail.com",
                new[] { OwnerType.FamilyTrust },
                "2144 9th Ave, Sacramento, CA 95818", PropertyLocation.Sacramento, 2650m,
                new[] { "Leonard Wu" }, hasWrittenAgreement: true, isMonthToMonth: true,
                trusteeName: "Marjorie and Alan Pierce",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "wu_lease.pdf", 182000, now.AddDays(-7)),
                    CreateDocument(DocumentType.NoticeToTenant, "termination_notice.pdf", 90500, now.AddDays(-7)),
                }),

            CreateCase(now, 17, "7E12", CaseStatus.PendingDocuments, 11, 0, "Nadia Brooks",
                "9244 Folsom Blvd, Sacramento, CA 95826", "(916) 555-1735", "nadiabrooks@gmail.com",
                new[] { OwnerType.Individual },
                "5216 Martin Luther King Jr Blvd, Sacramento, CA 95820", PropertyLocation.Sacramento, 1375m,
                new[] { "Trenton Hale", "Kyla Hale" }, isVerbalOnly: true, isMonthToMonth: true,
                evictionCause: CreateEviction("3-Day Pay or Quit", 2750m, true, true, true)),

            CreateCase(now, 18, "8B41", CaseStatus.UnderReview, 12, 2, "Parkline Housing Partners",
                "2330 Fair Oaks Blvd, Sacramento, CA 95825", "(916) 555-1802", "review@parklinehp.com",
                new[] { OwnerType.Partnership },
                "7436 Greenhaven Dr, Unit 2, Sacramento, CA 95831", PropertyLocation.Sacramento, 2050m,
                new[] { "Camila Ortega" }, hasWrittenAgreement: true, isMonthToMonth: true,
                manager: CreateManager("Rafael Moss", "Parkline Housing Partners", "(916) 555-1803", "rmoss@parklinehp.com"),
                evictionCause: CreateEviction("3-Day Quit - Incurable Breach", null, true, true, true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "ortega_lease.pdf", 191000, now.AddDays(-12)),
                    CreateDocument(DocumentType.NoticeToTenant, "breach_notice.pdf", 73400, now.AddDays(-12)),
                }),

            CreateCase(now, 19, "DA55", CaseStatus.HearingScheduled, 34, 5, "Ridgecrest Capital LLC",
                "3017 Douglas Blvd, Roseville, CA 95661", "(916) 555-1941", "filings@ridgecrestcap.com",
                new[] { OwnerType.LlcWithoutCorporateMember },
                "1201 Merkley Ave, West Sacramento, CA 95691", PropertyLocation.WestSacramento, 1980m,
                new[] { "Derrick Holt" }, hasWrittenAgreement: true, isMonthToMonth: true,
                ourFileNumber: "UD-2026-00403",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "holt_lease.pdf", 165000, now.AddDays(-34)),
                    CreateDocument(DocumentType.NoticeToTenant, "pay_or_quit.pdf", 79000, now.AddDays(-34)),
                    CreateDocument(DocumentType.ProofOfService, "service_holt.pdf", 43000, now.AddDays(-33)),
                    CreateDocument(DocumentType.Other, "answer_packet.pdf", 98000, now.AddDays(-29)),
                    CreateDocument(DocumentType.Other, "hearing_notice.pdf", 50000, now.AddDays(-27)),
                }),

            CreateCase(now, 20, "34F7", CaseStatus.Active, 16, 3, "West Elm Asset Group",
                "621 Capitol Mall, Sacramento, CA 95814", "(916) 555-2055", "admin@westelmassets.com",
                new[] { OwnerType.Corporation },
                "8984 La Riviera Dr, Sacramento, CA 95826", PropertyLocation.Sacramento, 2150m,
                new[] { "Kendra Finch" }, hasWrittenAgreement: true, isTermLease: true,
                noticeRequest: CreateNotice(NoticeType.SixtyDayTermination_JustCause, "8984 La Riviera Dr, Sacramento, CA 95826", 2150m, null,
                    "Online payment portal", "West Elm Asset Group", "621 Capitol Mall, Sacramento, CA 95814", true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "finch_lease.pdf", 208300, now.AddDays(-16)),
                    CreateDocument(DocumentType.Other, "owner_declaration.pdf", 43000, now.AddDays(-15)),
                    CreateDocument(DocumentType.Other, "repair_log.pdf", 51000, now.AddDays(-15)),
                }),

            CreateCase(now, 21, "90CE", CaseStatus.Submitted, 9, 3, "Auburn Creek Estates",
                "422 Lincoln Way, Auburn, CA 95603", "(530) 555-2104", "office@auburncreekestates.com",
                new[] { OwnerType.Partnership },
                "1187 High St, Auburn, CA 95603", PropertyLocation.AuburnElDoradoGalt, 1750m,
                new[] { "Joanna Ruiz" }, hasWrittenAgreement: true, isMonthToMonth: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "ruiz_lease.pdf", 172500, now.AddDays(-9)),
                    CreateDocument(DocumentType.NoticeToTenant, "3day_ruiz.pdf", 76100, now.AddDays(-9)),
                    CreateDocument(DocumentType.ProofOfService, "proof_ruiz.pdf", 40200, now.AddDays(-8)),
                }),

            CreateCase(now, 22, "71BD", CaseStatus.PendingDocuments, 13, 1, "Hector Alvarez",
                "2339 27th St, Sacramento, CA 95818", "(916) 555-2290", "halvarez@me.com",
                new[] { OwnerType.Individual },
                "9056 Florin Rd, Sacramento, CA 95829", PropertyLocation.Sacramento, 1600m,
                new[] { "Talia Jensen" }, hasWrittenAgreement: true, isMonthToMonth: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "signed_lease_only.pdf", 143000, now.AddDays(-13)),
                }),

            CreateCase(now, 23, "4EF1", CaseStatus.UnderReview, 15, 4, "Cobalt Residential REIT",
                "2000 Opportunity Dr, Roseville, CA 95678", "(916) 555-2388", "intake@cobaltresreit.com",
                new[] { OwnerType.RealEstateInvestmentTrust },
                "4780 Natomas Blvd, Unit 107, Sacramento, CA 95835", PropertyLocation.Sacramento, 2440m,
                new[] { "Mason Bennett", "Elise Bennett" }, hasWrittenAgreement: true, isTermLease: true,
                trusteeName: "Cobalt Management Services",
                manager: CreateManager("Priya Shah", "Cobalt Residential REIT", "(916) 555-2389", "pshah@cobaltresreit.com"),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "bennett_lease.pdf", 203000, now.AddDays(-15)),
                    CreateDocument(DocumentType.NoticeToTenant, "termination_bennett.pdf", 79200, now.AddDays(-15)),
                    CreateDocument(DocumentType.ProofOfService, "affidavit_service.pdf", 45120, now.AddDays(-14)),
                    CreateDocument(DocumentType.Other, "rent_history.pdf", 34100, now.AddDays(-14)),
                }),

            CreateCase(now, 24, "A607", CaseStatus.Active, 20, 2, "Lila Montgomery",
                "7717 Laguna Blvd, Elk Grove, CA 95758", "(916) 555-2470", "lmontgomery@gmail.com",
                new[] { OwnerType.Individual },
                "8832 Foulks Ranch Dr, Elk Grove, CA 95758", PropertyLocation.ElkGroveRosevileFolsom, 2285m,
                new[] { "Jared Pope" }, hasWrittenAgreement: true, isMonthToMonth: true,
                noticeRequest: CreateNotice(NoticeType.ThreeDayPayPerform, "8832 Foulks Ranch Dr, Elk Grove, CA 95758", 2285m, null,
                    "Certified funds", "Lila Montgomery", "7717 Laguna Blvd, Elk Grove, CA 95758", true),
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "pope_lease.pdf", 166200, now.AddDays(-20)),
                    CreateDocument(DocumentType.Other, "hoa_violation.pdf", 56000, now.AddDays(-19)),
                }),

            CreateCase(now, 25, "2A6C", CaseStatus.Judgment, 61, 5, "Silverline Property Group",
                "8101 Freeport Blvd, Sacramento, CA 95832", "(916) 555-2538", "court@silverlinepg.com",
                new[] { OwnerType.Corporation },
                "3525 44th St, Sacramento, CA 95820", PropertyLocation.Sacramento, 1585m,
                new[] { "Paula Green" }, hasWrittenAgreement: true, isMonthToMonth: true,
                ourFileNumber: "UD-2026-00219",
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "green_lease.pdf", 171000, now.AddDays(-61)),
                    CreateDocument(DocumentType.NoticeToTenant, "green_notice.pdf", 74000, now.AddDays(-61)),
                    CreateDocument(DocumentType.ProofOfService, "green_service.pdf", 39000, now.AddDays(-59)),
                    CreateDocument(DocumentType.Other, "judgment_packet.pdf", 120000, now.AddDays(-48)),
                    CreateDocument(DocumentType.Other, "writ_request.pdf", 85000, now.AddDays(-45)),
                }),

            CreateCase(now, 26, "B4D2", CaseStatus.Submitted, 2, 2, "Elmstone Homes LLC",
                "9050 Elk Grove Blvd, Elk Grove, CA 95624", "(916) 555-2671", "ops@elmstonehomes.com",
                new[] { OwnerType.LlcWithoutCorporateMember },
                "6544 Center Pkwy, Sacramento, CA 95823", PropertyLocation.Sacramento, 1945m,
                new[] { "Aria Knox" }, hasWrittenAgreement: true, isMonthToMonth: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "knox_lease.pdf", 177300, now.AddDays(-2)),
                    CreateDocument(DocumentType.NoticeToTenant, "knox_3day.pdf", 68800, now.AddDays(-2)),
                }),

            CreateCase(now, 27, "C973", CaseStatus.UnderReview, 17, 3, "Yolo Vista Holdings",
                "126 Main St, Woodland, CA 95695", "(530) 555-2710", "legal@yolovista.com",
                new[] { OwnerType.Partnership },
                "410 Court St, Woodland, CA 95695", PropertyLocation.Woodland, 1825m,
                new[] { "Renee McCall" }, hasWrittenAgreement: true, isMonthToMonth: true,
                documents: new[]
                {
                    CreateDocument(DocumentType.RentalAgreement, "mccall_lease.pdf", 161100, now.AddDays(-17)),
                    CreateDocument(DocumentType.NoticeToTenant, "woodland_notice.pdf", 70300, now.AddDays(-17)),
                    CreateDocument(DocumentType.ProofOfService, "woodland_pos.pdf", 41800, now.AddDays(-16)),
                }),
        };

        db.IntakeCases.AddRange(cases);
        await db.SaveChangesAsync();
        logger.LogInformation("[DataSeeder] Seeded {Count} sample cases.", cases.Count);
    }

    private static IntakeCase CreateCase(
        DateTime now,
        int number,
        string suffix,
        CaseStatus status,
        int daysAgo,
        int documentCountHint,
        string ownerName,
        string? ownerAddress,
        string ownerPhone,
        string ownerEmail,
        IEnumerable<OwnerType> ownerTypes,
        string propertyAddress,
        PropertyLocation location,
        decimal currentRent,
        IEnumerable<string> tenantNames,
        bool hasWrittenAgreement = false,
        bool isTermLease = false,
        bool isMonthToMonth = false,
        bool isVerbalOnly = false,
        bool noAgreement = false,
        bool isForeclosure = false,
        bool isSection8OrSubsidy = false,
        bool isCommercial = false,
        bool submitted = true,
        string? trusteeName = null,
        string? ourFileNumber = null,
        PropertyManager? manager = null,
        EvictionCause? evictionCause = null,
        NoticeRequest? noticeRequest = null,
        IEnumerable<CaseDocument>? documents = null)
    {
        var createdAt = number == 8 ? now.AddHours(-4) : now.AddDays(-daysAgo);
        DateTime? submittedAt = submitted ? createdAt : null;

        return new IntakeCase
        {
            ReferenceNumber = $"H2026-{number:D4}-{suffix}",
            Status = status,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            SubmittedAt = submittedAt,
            OurFileNumber = ourFileNumber,
            PropertyOwner = new PropertyOwner
            {
                Name = ownerName,
                Address = ownerAddress,
                Phone = ownerPhone,
                Email = ownerEmail,
                OwnerTypes = ownerTypes.ToList(),
                TrusteeName = trusteeName,
            },
            PropertyManager = manager,
            Property = new Property
            {
                Address = propertyAddress,
                IsResidential = !isCommercial,
                IsCommercial = isCommercial,
                CurrentRent = currentRent,
                Location = location,
                HasWrittenAgreement = hasWrittenAgreement,
                IsTermLease = isTermLease,
                IsMonthToMonth = isMonthToMonth,
                IsVerbalOnly = isVerbalOnly,
                NoAgreement = noAgreement,
                IsForeclosure = isForeclosure,
                IsSection8OrSubsidy = isSection8OrSubsidy,
                Tenants = tenantNames.Select(name => new Tenant { FullName = name }).ToList(),
            },
            EvictionCause = evictionCause,
            NoticeRequest = noticeRequest,
            Documents = documents?.ToList() ?? new List<CaseDocument>(documentCountHint),
        };
    }

    private static PropertyManager CreateManager(string name, string company, string phone, string email) =>
        new()
        {
            Name = name,
            Company = company,
            Phone = phone,
            Email = email,
        };

    private static EvictionCause CreateEviction(
        string? noticeForm,
        decimal? amountOwedAtNotice,
        bool noticeServed,
        bool subjectToRentControl,
        bool nonMilitaryConfirmed) =>
        new()
        {
            NoticeServed = noticeServed,
            NoticeForm = noticeForm,
            AmountOwedAtNotice = amountOwedAtNotice,
            IsSubjectToRentEvictionControl = subjectToRentControl,
            HasCompliedWithRentEvictionControlLaws = subjectToRentControl,
            RentAcceptedAfterNoticeExpired = false,
            NonMilitaryConfirmed = nonMilitaryConfirmed,
        };

    private static NoticeRequest CreateNotice(
        NoticeType noticeType,
        string tenantPropertyAddress,
        decimal? monthlyRent,
        decimal? currentBalanceDue,
        string methodOfPayment,
        string paymentRecipient,
        string paymentDeliveryAddress,
        bool hasWrittenAgreement) =>
        new()
        {
            NoticeType = noticeType,
            IsResidential = true,
            TenantPropertyAddress = tenantPropertyAddress,
            MonthlyRent = monthlyRent,
            CurrentBalanceDue = currentBalanceDue,
            MethodOfPayment = methodOfPayment,
            PaymentRecipient = paymentRecipient,
            PaymentDeliveryAddress = paymentDeliveryAddress,
            HasWrittenAgreement = hasWrittenAgreement,
        };

    private static CaseDocument CreateDocument(DocumentType type, string fileName, long size, DateTime uploadedAt) =>
        new()
        {
            DocumentType = type,
            OriginalFileName = fileName,
            FileSizeBytes = size,
            UploadedAt = uploadedAt,
        };
}
