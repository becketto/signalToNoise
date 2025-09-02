/**
 * Calculate inverse percentage score where the lowest scorer gets 0% (best)
 * @param userScore - The user's raw signal-to-noise ratio
 * @param topScore - The highest score in the dataset
 * @returns Inverse percentage score (0-100, where 0% is best)
 */
export function calculatePercentageScore(userScore: number, topScore: number): number {
    if (!userScore || !topScore || topScore <= 0) return 100;
    return Math.round(100 - (userScore / topScore) * 100);
}

/**
 * Get color for slop score based on percentage
 * @param percentage - The percentage score (0-100, where 0% is best)
 * @returns Chakra UI color token
 */
export function getSignalColor(percentage: number): string {
    if (percentage <= 20) return "green.400";
    if (percentage <= 50) return "yellow.400";
    return "red.400";
}

/**
 * Get label for slop score based on percentage
 * @param percentage - The percentage score (0-100, where 0% is best)
 * @returns Human-readable label
 */
export function getSignalLabel(percentage: number): string {
    if (percentage <= 20) return "Low Slop";
    if (percentage <= 50) return "Moderate Slop";
    return "High Slop";
}

/**
 * Get color scheme for badges based on percentage
 * @param percentage - The percentage score (0-100, where 0% is best)
 * @returns Chakra UI color scheme
 */
export function getSignalColorScheme(percentage: number): string {
    if (percentage <= 20) return "green";
    if (percentage <= 50) return "yellow";
    return "red";
}
