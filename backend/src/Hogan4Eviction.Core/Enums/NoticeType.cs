namespace Hogan4Eviction.Core.Enums;

public enum NoticeType
{
    ThreeDayPayOrQuit = 1,
    ThreeDayPayPerform = 2,
    ThirtyDayPayOrQuit_Section8 = 3,        // Section 8 / Bank Mortgage
    ThirtyDayTermination = 4,
    SixtyDayTermination_JustCause = 5,
    SixtyDay_AB1482Exempt = 6,
    NinetyDay_Subsidized = 7,
    NinetyDay_Foreclosure = 8,
    ThreeDay_Quit_Foreclosure = 9,
    ThreeDay_Quit_IncurableBreach = 10,
    Other = 99
}
